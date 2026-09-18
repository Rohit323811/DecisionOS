import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { DecisionModel, ItemKind, ModelItem } from '../types/decision';
import { contractorDecision, exampleDecisions } from '../data/exampleDecisions';

interface DecisionContextValue {
  prompt: string;
  setPrompt: (p: string) => void;
  model: DecisionModel | null;
  buildModelFor: (prompt: string) => DecisionModel;
  commitModel: (model: DecisionModel) => void;
  updateItem: (id: string, patch: Partial<ModelItem>) => void;
  removeItem: (id: string) => void;
  addItem: (kind: ItemKind) => string;
  reset: () => void;
}

const DecisionContext = createContext<DecisionContextValue | null>(null);

export function useDecision() {
  const ctx = useContext(DecisionContext);
  if (!ctx) throw new Error('useDecision must be used inside DecisionProvider');
  return ctx;
}

/**
 * Deterministic resolution: the prompt selects which model is produced.
 * The AI decides *what* is modelled; everything after this point is rule-driven.
 */
function resolveModel(prompt: string): DecisionModel {
  const normalized = prompt.trim().toLowerCase();
  const match = exampleDecisions.find((d) => d.prompt.toLowerCase() === normalized);
  const base = match ?? contractorDecision;
  return { ...base, prompt: prompt.trim() || base.prompt };
}

export function DecisionProvider({ children }: {children: React.ReactNode;}) {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<DecisionModel | null>(null);

  const buildModelFor = useCallback((p: string) => resolveModel(p), []);

  const commitModel = useCallback((next: DecisionModel) => setModel(next), []);

  const updateItem = useCallback((id: string, patch: Partial<ModelItem>) => {
    setModel((prev) =>
    prev ?
    { ...prev, items: prev.items.map((i) => i.id === id ? { ...i, ...patch } : i) } :
    prev
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setModel((prev) =>
    prev ?
    {
      ...prev,
      items: prev.items.
      filter((i) => i.id !== id).
      map((i) => ({ ...i, affects: i.affects?.filter((a) => a !== id) }))
    } :
    prev
    );
  }, []);

  const addItem = useCallback((kind: ItemKind) => {
    const id = `${kind}-${Math.random().toString(36).slice(2, 7)}`;
    setModel((prev) =>
    prev ?
    {
      ...prev,
      items: [
      ...prev.items,
      {
        id,
        kind,
        label: 'Untitled',
        detail: 'Describe this in your own words.',
        origin: 'user' as const
      }]

    } :
    prev
    );
    return id;
  }, []);

  const reset = useCallback(() => {
    setPrompt('');
    setModel(null);
  }, []);

  const value = useMemo(
    () => ({ prompt, setPrompt, model, buildModelFor, commitModel, updateItem, removeItem, addItem, reset }),
    [prompt, model, buildModelFor, commitModel, updateItem, removeItem, addItem, reset]
  );

  return <DecisionContext.Provider value={value}>{children}</DecisionContext.Provider>;
}