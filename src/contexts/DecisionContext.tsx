import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { DecisionModel, ItemKind, ModelItem, Scenario } from '../types/decision';
import { contractorDecision, exampleDecisions } from '../data/exampleDecisions';

interface DecisionContextValue {
  prompt: string;
  setPrompt: (p: string) => void;
  model: DecisionModel | null;
  activeScenarioId: string;
  historyIndex: number;
  historyLength: number;
  activePropagatingIds: Set<string>;
  buildModelFor: (prompt: string) => DecisionModel;
  commitModel: (model: DecisionModel) => void;
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
}

const DecisionContext = createContext<DecisionContextValue | null>(null);

export function useDecision() {
  const ctx = useContext(DecisionContext);
  if (!ctx) throw new Error('useDecision must be used inside DecisionProvider');
  return ctx;
}

function resolveModel(prompt: string): DecisionModel {
  const normalized = prompt.trim().toLowerCase();
  const match = exampleDecisions.find((d) => d.prompt.toLowerCase() === normalized);
  const base = match ?? contractorDecision;
  return { ...base, prompt: prompt.trim() || base.prompt };
}

export function DecisionProvider({ children }: { children: React.ReactNode }) {
  const [prompt, setPrompt] = useState(contractorDecision.prompt);
  const [history, setHistory] = useState<DecisionModel[]>([contractorDecision]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('sc-1');
  const [activePropagatingIds, setActivePropagatingIds] = useState<Set<string>>(new Set());

  const currentModel = historyIndex >= 0 && historyIndex < history.length ? history[historyIndex] : null;

  const buildModelFor = useCallback((p: string) => resolveModel(p), []);

  const commitModel = useCallback((next: DecisionModel) => {
    setHistory([next]);
    setHistoryIndex(0);
    if (next.scenarios && next.scenarios.length > 0) {
      setActiveScenarioId(next.scenarios[0].id);
    }
  }, []);

  const pushState = useCallback((nextModel: DecisionModel) => {
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, nextModel];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  // Flash propagation on affected nodes
  const triggerPropagation = useCallback((sourceId: string, model: DecisionModel) => {
    const affected = new Set<string>([sourceId]);
    model.items.forEach((item) => {
      if (item.affects?.includes(sourceId) || model.items.find((i) => i.id === sourceId)?.affects?.includes(item.id)) {
        affected.add(item.id);
      }
    });
    setActivePropagatingIds(affected);
    setTimeout(() => setActivePropagatingIds(new Set()), 1200);
  }, []);

  const updateItem = useCallback(
    (id: string, patch: Partial<ModelItem>) => {
      if (!currentModel) return;
      const updatedItems = currentModel.items.map((i) => (i.id === id ? { ...i, ...patch } : i));
      const nextModel = { ...currentModel, items: updatedItems };
      pushState(nextModel);
      triggerPropagation(id, nextModel);
    },
    [currentModel, pushState, triggerPropagation]
  );

  const updateNodePosition = useCallback(
    (id: string, x: number, y: number) => {
      if (!currentModel) return;
      const updatedItems = currentModel.items.map((i) => (i.id === id ? { ...i, x, y } : i));
      setHistory((prev) => {
        const copy = [...prev];
        copy[historyIndex] = { ...currentModel, items: updatedItems };
        return copy;
      });
    },
    [currentModel, historyIndex]
  );

  const removeItem = useCallback(
    (id: string) => {
      if (!currentModel) return;
      const nextModel = {
        ...currentModel,
        items: currentModel.items
          .filter((i) => i.id !== id)
          .map((i) => ({ ...i, affects: i.affects?.filter((a) => a !== id) })),
        edges: currentModel.edges?.filter((e) => e.from !== id && e.to !== id)
      };
      pushState(nextModel);
    },
    [currentModel, pushState]
  );

  const addItem = useCallback(
    (kind: ItemKind) => {
      if (!currentModel) return '';
      const id = `${kind}-${Math.random().toString(36).slice(2, 7)}`;
      const newItem: ModelItem = {
        id,
        kind,
        label: `New ${kind}`,
        detail: 'User defined variable in decision graph.',
        origin: 'user',
        x: 400 + Math.random() * 100,
        y: 200 + Math.random() * 100
      };
      const nextModel = { ...currentModel, items: [...currentModel.items, newItem] };
      pushState(nextModel);
      return id;
    },
    [currentModel, pushState]
  );

  const selectScenario = useCallback(
    (scenarioId: string) => {
      setActiveScenarioId(scenarioId);
      if (!currentModel) return;
      const sc = currentModel.scenarios?.find((s) => s.id === scenarioId);
      if (!sc) return;

      // Apply scenario variable values to current items
      const updatedItems = currentModel.items.map((item) => {
        if (sc.variableValues[item.id] !== undefined) {
          const val = sc.variableValues[item.id];
          if (item.range && typeof val === 'number') {
            return { ...item, range: { ...item.range, value: val } };
          }
          return { ...item, value: val };
        }
        return item;
      });

      pushState({ ...currentModel, items: updatedItems });
    },
    [currentModel, pushState]
  );

  const createScenario = useCallback(
    (title: string, description: string) => {
      if (!currentModel) return;
      const newSc: Scenario = {
        id: `sc-${Date.now()}`,
        title,
        description,
        variableValues: {}
      };
      currentModel.items.forEach((item) => {
        if (item.range) newSc.variableValues[item.id] = item.range.value;
        else if (item.value !== undefined) newSc.variableValues[item.id] = item.value;
      });

      const nextScenarios = [...(currentModel.scenarios || []), newSc];
      const nextModel = { ...currentModel, scenarios: nextScenarios };
      pushState(nextModel);
      setActiveScenarioId(newSc.id);
    },
    [currentModel, pushState]
  );

  const applyShock = useCallback(
    (id: string, val: number | boolean) => {
      updateItem(id, typeof val === 'number' && currentModel?.items.find((i) => i.id === id)?.range ? { range: { ...currentModel!.items.find((i) => i.id === id)!.range!, value: val } } : { value: val });
    },
    [currentModel, updateItem]
  );

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
    }
  }, [historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1);
    }
  }, [historyIndex, history.length]);

  const reset = useCallback(() => {
    setPrompt('');
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  const value = useMemo(
    () => ({
      prompt,
      setPrompt,
      model: currentModel,
      activeScenarioId,
      historyIndex,
      historyLength: history.length,
      activePropagatingIds,
      buildModelFor,
      commitModel,
      updateItem,
      updateNodePosition,
      removeItem,
      addItem,
      selectScenario,
      createScenario,
      applyShock,
      undo,
      redo,
      reset
    }),
    [
      prompt,
      currentModel,
      activeScenarioId,
      historyIndex,
      history.length,
      activePropagatingIds,
      buildModelFor,
      commitModel,
      updateItem,
      updateNodePosition,
      removeItem,
      addItem,
      selectScenario,
      createScenario,
      applyShock,
      undo,
      redo,
      reset
    ]
  );

  return <DecisionContext.Provider value={value}>{children}</DecisionContext.Provider>;
}
