import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DecisionModel, ItemKind, KIND_LABEL, ModelItem, Scenario } from '../types/decision';
import { AIError, AnalyzeResponse, analyzeDecision, buildDemoModel } from '../services/decisionAI';
import { applyScenario, isEditableVariable, mergePropagation, propagate } from '../utils/decisionEngine';
import { nextPositionFor } from '../utils/modelNormalizer';
import {
  clearAll,
  loadActiveScenario,
  loadModel,
  saveActiveScenario,
  saveModel,
} from '../utils/persistence';

export type AnalysisStatus = 'idle' | 'analyzing' | 'done' | 'error';

interface AnalyzeMeta {
  source: 'ai' | 'demo';
  latencyMs?: number;
  warnings: string[];
  fallback?: boolean;
  fallbackReason?: string;
}

interface DecisionContextValue {
  // ---- input + analysis flow ----
  prompt: string;
  setPrompt: (p: string) => void;
  analysisStatus: AnalysisStatus;
  analysisStage: number;         // real milestone reported by the service
  analysisError: AIError | null;
  analysisMeta: AnalyzeMeta | null;
  analyze: (p: string) => Promise<void>;
  runDemo: (p: string) => void;
  cancelAnalysis: () => void;

  // ---- draft model (Model Review) ----
  draftModel: DecisionModel | null;
  updateDraftItem: (id: string, patch: Partial<ModelItem>) => void;
  removeDraftItem: (id: string) => void;
  addDraftItem: (kind: ItemKind) => string;
  commitDraft: () => void;
  discardDraft: () => void;

  // ---- committed model + workspace ops ----
  model: DecisionModel | null;
  activeScenarioId: string;
  historyIndex: number;
  historyLength: number;
  activePropagatingIds: Set<string>;
  propagationDeltas: Record<string, number>;
  updateItem: (id: string, patch: Partial<ModelItem>) => void;
  updateNodePosition: (id: string, x: number, y: number) => void;
  removeItem: (id: string) => void;
  addItem: (kind: ItemKind) => string;
  selectScenario: (scenarioId: string) => void;
  createScenario: (title: string, description: string) => void;
  applyShock: (id: string, val: number | boolean) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  isDemoModel: boolean;
}

const DecisionContext = createContext<DecisionContextValue | null>(null);

export function useDecision() {
  const ctx = useContext(DecisionContext);
  if (!ctx) throw new Error('useDecision must be used inside DecisionProvider');
  return ctx;
}

/** History entries coalesce when the same variable is edited in quick succession (slider drags). */
const HISTORY_COALESCE_MS = 900;
/** How long propagation highlights flash after a change. */
const PROPAGATION_FLASH_MS = 1400;

export function DecisionProvider({ children }: { children: React.ReactNode }) {
  // ---- persisted core ----
  const [model, setModel] = useState<DecisionModel | null>(() => loadModel());
  const [history, setHistory] = useState<DecisionModel[]>(() => {
    const restored = loadModel();
    return restored ? [restored] : [];
  });
  const [historyIndex, setHistoryIndex] = useState(() => (loadModel() ? 0 : -1));
  const [activeScenarioId, setActiveScenarioId] = useState<string>(() => {
    const restored = loadModel();
    const saved = loadActiveScenario();
    if (saved && restored?.scenarios?.some((s) => s.id === saved)) return saved;
    return restored?.scenarios?.[0]?.id ?? '';
  });

  // ---- analysis flow ----
  const [prompt, setPrompt] = useState('');
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('idle');
  const [analysisStage, setAnalysisStage] = useState(0);
  const [analysisError, setAnalysisError] = useState<AIError | null>(null);
  const [analysisMeta, setAnalysisMeta] = useState<AnalyzeMeta | null>(null);
  const [draftModel, setDraftModel] = useState<DecisionModel | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ---- propagation flash ----
  const [activePropagatingIds, setActivePropagatingIds] = useState<Set<string>>(new Set());
  const [propagationDeltas, setPropagationDeltas] = useState<Record<string, number>>({});
  const flashTimer = useRef<number | null>(null);

  // ---- history coalescing ----
  const lastEditRef = useRef<{ id: string; at: number }>({ id: '', at: 0 });

  // ---------- persistence ----------
  useEffect(() => {
    saveModel(model);
  }, [model]);

  useEffect(() => {
    saveActiveScenario(activeScenarioId || null);
  }, [activeScenarioId]);

  const pushHistory = useCallback((next: DecisionModel) => {
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), next]);
    setHistoryIndex((i) => i + 1);
  }, [historyIndex]);

  /** Push to history unless this is a rapid repeat edit of the same item — then replace the top. */
  const pushHistoryCoalesced = useCallback((next: DecisionModel, itemId: string) => {
    const now = Date.now();
    const coalesce =
      lastEditRef.current.id === itemId && now - lastEditRef.current.at < HISTORY_COALESCE_MS;
    lastEditRef.current = { id: itemId, at: now };
    if (coalesce) {
      setHistory((prev) => {
        const copy = prev.slice(0, historyIndex + 1);
        copy[copy.length - 1] = next;
        return copy;
      });
    } else {
      pushHistory(next);
    }
  }, [historyIndex, pushHistory]);

  // ---------- analysis ----------
  const analyze = useCallback(async (p: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setAnalysisStatus('analyzing');
    setAnalysisStage(0);
    setAnalysisError(null);
    setAnalysisMeta(null);
    setDraftModel(null);

    try {
      const res: AnalyzeResponse = await analyzeDecision(p, (stage) => setAnalysisStage(stage), controller.signal);
      if (controller.signal.aborted) return;
      setDraftModel(res.model);
      setAnalysisMeta(res.meta);
      setAnalysisStage(5);
      setAnalysisStatus('done');
    } catch (err) {
      if (controller.signal.aborted) return;
      const aiErr = err instanceof AIError ? err : new AIError('network', 'Unexpected analysis failure.');
      setAnalysisError(aiErr);
      setAnalysisStatus('error');
    }
  }, []);

  const cancelAnalysis = useCallback(() => {
    abortRef.current?.abort();
    setAnalysisStatus('idle');
    setAnalysisStage(0);
  }, []);

  /** Fallback when analysis fails or no key is configured — same schema, clearly marked. */
  const runDemo = useCallback((p: string) => {
    const res = buildDemoModel(p);
    setDraftModel(res.model);
    setAnalysisMeta(res.meta);
    setAnalysisStage(5);
    setAnalysisStatus('done');
    setAnalysisError(null);
  }, []);

  // ---------- draft model (review) ----------
  const updateDraftItem = useCallback((id: string, patch: Partial<ModelItem>) => {
    setDraftModel((prev) => {
      if (!prev) return prev;
      // Re-normalize links when connectivity changed so the graph stays consistent.
      const items = prev.items.map((i) => (i.id === id ? { ...i, ...patch } : i));
      return { ...prev, items };
    });
  }, []);

  const removeDraftItem = useCallback((id: string) => {
    setDraftModel((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.filter((i) => i.id !== id),
        edges: (prev.edges ?? []).filter((e) => e.from !== id && e.to !== id),
        consequences: prev.consequences.filter((c) => c.driver !== id),
      };
    });
  }, []);

  const addDraftItem = useCallback((kind: ItemKind) => {
    const id = `${kind}-${Math.random().toString(36).slice(2, 8)}`;
    setDraftModel((prev) => {
      if (!prev) return prev;
      const pos = nextPositionFor(kind, prev.items);
      const item: ModelItem = {
        id,
        kind,
        label: `New ${KIND_LABEL[kind].replace(/s$/, '')}`,
        detail: 'Added during review. Describe what this represents and link it to related nodes.',
        origin: 'user',
        x: pos.x,
        y: pos.y,
      };
      if (kind === 'input' || kind === 'variable') {
        item.variableType = 'number';
        item.controlType = 'slider';
        item.range = { min: 0, max: 100, value: 50, unit: '' };
      }
      return { ...prev, items: [...prev.items, item] };
    });
    return id;
  }, []);

  const commitDraft = useCallback(() => {
    if (!draftModel) return;
    setModel(draftModel);
    setHistory([draftModel]);
    setHistoryIndex(0);
    setActiveScenarioId(draftModel.scenarios?.[0]?.id ?? '');
    setDraftModel(null);
    setAnalysisStatus('idle');
    setAnalysisStage(0);
  }, [draftModel]);

  const discardDraft = useCallback(() => {
    setDraftModel(null);
    setAnalysisStatus('idle');
    setAnalysisStage(0);
    setAnalysisMeta(null);
  }, []);

  // ---------- propagation ----------
  const flashPropagation = useCallback((result: ReturnType<typeof propagate>) => {
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    const deltas: Record<string, number> = {};
    Object.entries(result.updates).forEach(([id, upd]) => {
      if (upd.deltaPct !== 0) deltas[id] = upd.deltaPct;
    });
    setActivePropagatingIds(new Set(result.affectedIds));
    setPropagationDeltas(deltas);
    flashTimer.current = window.setTimeout(() => {
      setActivePropagatingIds(new Set());
      setPropagationDeltas({});
    }, PROPAGATION_FLASH_MS);
  }, []);

  // ---------- committed model ops ----------
  const currentModel = historyIndex >= 0 && historyIndex < history.length ? history[historyIndex] : model;

  const updateItem = useCallback(
    (id: string, patch: Partial<ModelItem>) => {
      if (!currentModel) return;
      const prevItem = currentModel.items.find((i) => i.id === id);
      if (!prevItem) return;

      let items = currentModel.items.map((i) => (i.id === id ? { ...i, ...patch } : i));
      let changed: Record<string, number> = {};

      // Only value changes propagate; label/detail/provenance edits stay local.
      if (
        isEditableVariable(prevItem) &&
        patch.range?.value !== undefined &&
        prevItem.range &&
        patch.range.value !== prevItem.range.value
      ) {
        const oldVal = prevItem.range.value;
        const newVal = patch.range.value;
        changed[id] = oldVal !== 0 ? (newVal - oldVal) / oldVal : 0;
      } else if (
        isEditableVariable(prevItem) &&
        patch.value !== undefined &&
        typeof patch.value === 'number' &&
        typeof prevItem.value === 'number' &&
        patch.value !== prevItem.value
      ) {
        changed[id] = prevItem.value !== 0 ? (patch.value - prevItem.value) / prevItem.value : 0;
      }

      let next: DecisionModel = { ...currentModel, items };
      if (Object.keys(changed).length > 0) {
        // The user already set the source value directly — merge only into downstream nodes.
        const result = propagate(next, changed);
        flashPropagation(result);
        next = { ...next, items: mergePropagation(next.items, result, new Set([id])) };
        items = next.items;
      }

      // Keep the active scenario's snapshot in sync with manual edits.
      const scenarios = (next.scenarios ?? []).map((s) => {
        if (s.id !== activeScenarioId) return s;
        const variableValues = { ...s.variableValues };
        items.forEach((item) => {
          if (item.range) variableValues[item.id] = item.range.value;
          else if (item.id === id && item.value !== undefined) variableValues[item.id] = item.value;
        });
        return { ...s, variableValues };
      });
      next = { ...next, scenarios };

      pushHistoryCoalesced(next, id);
    },
    [currentModel, activeScenarioId, pushHistoryCoalesced]
  );

  const updateNodePosition = useCallback(
    (id: string, x: number, y: number) => {
      if (!currentModel) return;
      // Layout tweaks do not create undo entries — they are view state.
      setHistory((prev) => {
        if (historyIndex < 0 || historyIndex >= prev.length) return prev;
        const copy = [...prev];
        copy[historyIndex] = {
          ...copy[historyIndex],
          items: copy[historyIndex].items.map((i) => (i.id === id ? { ...i, x, y } : i)),
        };
        return copy;
      });
    },
    [currentModel, historyIndex]
  );

  const removeItem = useCallback(
    (id: string) => {
      if (!currentModel) return;
      const next: DecisionModel = {
        ...currentModel,
        items: currentModel.items.filter((i) => i.id !== id),
        edges: (currentModel.edges ?? []).filter((e) => e.from !== id && e.to !== id),
        consequences: currentModel.consequences.filter((c) => c.driver !== id),
      };
      pushHistory(next);
    },
    [currentModel, pushHistory]
  );

  const addItem = useCallback(
    (kind: ItemKind) => {
      if (!currentModel) return '';
      const id = `${kind}-${Math.random().toString(36).slice(2, 8)}`;
      const pos = nextPositionFor(kind, currentModel.items);
      const item: ModelItem = {
        id,
        kind,
        label: `New ${KIND_LABEL[kind].replace(/s$/, '')}`,
        detail: 'Added by you. Describe what this represents and link it to related nodes.',
        origin: 'user',
        x: pos.x,
        y: pos.y,
      };
      if (kind === 'input' || kind === 'variable') {
        item.variableType = 'number';
        item.controlType = 'slider';
        item.range = { min: 0, max: 100, value: 50, unit: '' };
      }
      pushHistory({ ...currentModel, items: [...currentModel.items, item] });
      return id;
    },
    [currentModel, pushHistory]
  );

  const selectScenario = useCallback(
    (scenarioId: string) => {
      if (!currentModel) return;
      const sc = currentModel.scenarios?.find((s) => s.id === scenarioId);
      if (!sc) return;
      const { items } = applyScenario(currentModel, sc.variableValues);
      const next: DecisionModel = { ...currentModel, items };
      setHistory((prev) => {
        const copy = prev.slice(0, historyIndex + 1);
        return [...copy, next];
      });
      setHistoryIndex((i) => i + 1);
      setActiveScenarioId(scenarioId);
    },
    [currentModel, historyIndex]
  );

  const createScenario = useCallback(
    (title: string, description: string) => {
      if (!currentModel) return;
      const variableValues: Record<string, number | string | boolean> = {};
      currentModel.items.forEach((item) => {
        if (item.range) variableValues[item.id] = item.range.value;
        else if (item.value !== undefined && (item.kind === 'input' || item.kind === 'variable')) {
          variableValues[item.id] = item.value;
        }
      });
      const newScenario: Scenario = {
        id: `sc-${Date.now().toString(36)}`,
        title,
        description,
        variableValues,
      };
      const next: DecisionModel = {
        ...currentModel,
        scenarios: [...(currentModel.scenarios ?? []), newScenario],
      };
      pushHistory(next);
      setActiveScenarioId(newScenario.id);
    },
    [currentModel, pushHistory]
  );

  const applyShock = useCallback(
    (id: string, val: number | boolean) => {
      const item = currentModel?.items.find((i) => i.id === id);
      if (!item) return;
      if (typeof val === 'number' && item.range) {
        updateItem(id, { range: { ...item.range, value: val } });
      } else {
        updateItem(id, { value: val });
      }
    },
    [currentModel, updateItem]
  );

  const undo = useCallback(() => {
    setHistoryIndex((i) => Math.max(0, i - 1));
  }, []);

  const redo = useCallback(() => {
    setHistoryIndex((i) => Math.min(history.length - 1, i + 1));
  }, [history.length]);

  const reset = useCallback(() => {
    clearAll();
    setModel(null);
    setHistory([]);
    setHistoryIndex(-1);
    setActiveScenarioId('');
    setDraftModel(null);
    setAnalysisStatus('idle');
    setAnalysisStage(0);
    setAnalysisError(null);
    setAnalysisMeta(null);
    setPrompt('');
  }, []);

  const isDemoModel = currentModel?.source === 'demo' || draftModel?.source === 'demo';

  const value = useMemo<DecisionContextValue>(
    () => ({
      prompt,
      setPrompt,
      analysisStatus,
      analysisStage,
      analysisError,
      analysisMeta,
      analyze,
      cancelAnalysis,
      draftModel,
      updateDraftItem,
      removeDraftItem,
      addDraftItem,
      commitDraft,
      discardDraft,
      runDemo,
      model: currentModel,
      activeScenarioId,
      historyIndex,
      historyLength: history.length,
      activePropagatingIds,
      propagationDeltas,
      updateItem,
      updateNodePosition,
      removeItem,
      addItem,
      selectScenario,
      createScenario,
      applyShock,
      undo,
      redo,
      reset,
      isDemoModel,
    }),
    [
      prompt, analysisStatus, analysisStage, analysisError, analysisMeta,
      analyze, cancelAnalysis, draftModel, updateDraftItem, removeDraftItem,
      addDraftItem, commitDraft, discardDraft, runDemo, currentModel,
      activeScenarioId, historyIndex, history.length, activePropagatingIds,
      propagationDeltas, updateItem, updateNodePosition, removeItem, addItem,
      selectScenario, createScenario, applyShock, undo, redo, reset, isDemoModel,
    ]
  );

  return <DecisionContext.Provider value={value}>{children}</DecisionContext.Provider>;
}
