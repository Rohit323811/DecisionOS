import { DecisionModel, ItemKind, ModelEdge, ModelItem, Scenario } from '../types/decision';

/**
 * Turns a validated AI payload into the canonical internal DecisionModel:
 * stable ids, bidirectional links (edges + `affects` back-references), canvas
 * layout, and a default baseline scenario. Operates generically on any model
 * shape — nothing here knows what the decision is about.
 */

const KIND_COLUMNS: Record<ItemKind, number> = {
  decision: 0,
  option: 1,
  input: 1,
  variable: 2,
  computed: 3,
  goal: 4,
  constraint: 4,
  impact: 4,
  assumption: 2,
  unknown: 1,
};

const COLUMN_X = [80, 400, 720, 1040, 1360];
const Y_START = 80;
const Y_STEP = 155;

/**
 * Deterministic layered layout: nodes are grouped by kind into flow columns
 * and stacked within each column. If the AI supplied coordinates we keep them.
 */
export function computeLayout(items: ModelItem[]): ModelItem[] {
  const withCoords = items.filter((i) => typeof i.x === 'number' && typeof i.y === 'number');
  if (withCoords.length === items.length) return items;

  const counts = new Map<number, number>();
  const laid = items.map((item) => {
    if (typeof item.x === 'number' && typeof item.y === 'number') return item;
    const col = KIND_COLUMNS[item.kind] ?? 2;
    const row = counts.get(col) ?? 0;
    counts.set(col, row + 1);
    return { ...item, x: COLUMN_X[col] ?? 720, y: Y_START + row * Y_STEP };
  });
  // De-overlap vertically with a light local pass so dense columns spread out.
  return spreadColumns(laid);
}

function spreadColumns(items: ModelItem[]): ModelItem[] {
  const byCol = new Map<number, ModelItem[]>();
  items.forEach((i) => {
    const col = i.x !== undefined ? nearestColumn(i.x) : 2;
    const list = byCol.get(col) ?? [];
    list.push(i);
    byCol.set(col, list);
  });

  const result = new Map<string, ModelItem>();
  byCol.forEach((list) => {
    const sorted = [...list].sort((a, b) => (a.y ?? 0) - (b.y ?? 0));
    let prevBottom = -Infinity;
    sorted.forEach((item, idx) => {
      const y = Math.max(item.y ?? Y_START + idx * Y_STEP, prevBottom + 40);
      prevBottom = y + 130;
      result.set(item.id, { ...item, y });
    });
  });

  return items.map((i) => result.get(i.id) ?? i);
}

function nearestColumn(x: number): number {
  let best = 0;
  let bestDist = Infinity;
  COLUMN_X.forEach((cx, idx) => {
    const d = Math.abs(cx - x);
    if (d < bestDist) {
      bestDist = d;
      best = idx;
    }
  });
  return best;
}

/** Position for a user-added node: end of the kind's flow column. */
export function nextPositionFor(kind: ItemKind, items: ModelItem[]): { x: number; y: number } {
  const col = KIND_COLUMNS[kind] ?? 2;
  const x = COLUMN_X[col] ?? 720;
  const inColumn = items.filter((i) => Math.abs((i.x ?? -9999) - x) < 40);
  if (inColumn.length === 0) return { x, y: Y_START };
  const maxY = inColumn.reduce((max, i) => Math.max(max, i.y ?? 0), 0);
  return { x, y: maxY + 170 };
}

/** Ensure every edge has a matching `affects` back-reference and vice versa. */
export function linkEdges(items: ModelItem[], edges: ModelEdge[]): { items: ModelItem[]; edges: ModelEdge[] } {
  const ids = new Set(items.map((i) => i.id));
  const deduped: ModelEdge[] = [];
  const seen = new Set<string>();
  for (const e of edges) {
    if (!ids.has(e.from) || !ids.has(e.to) || e.from === e.to) continue;
    const key = `${e.from}->${e.to}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push({ ...e, id: e.id || key });
  }

  const affectsMap = new Map<string, string[]>();
  for (const e of deduped) {
    const list = affectsMap.get(e.from) ?? [];
    if (!list.includes(e.to)) list.push(e.to);
    affectsMap.set(e.from, list);
  }

  return {
    items: items.map((i) => ({ ...i, affects: affectsMap.get(i.id) ?? i.affects })),
    edges: deduped,
  };
}

function uniqueId(base: string, taken: Set<string>): string {
  let id = base;
  let n = 1;
  while (taken.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  return id;
}

/** Create the baseline "Current Situation" scenario from the model's initial values. */
export function baselineScenario(items: ModelItem[]): Scenario {
  const variableValues: Record<string, number | string | boolean> = {};
  items.forEach((item) => {
    if (item.range) variableValues[item.id] = item.range.value;
    else if (item.value !== undefined && (item.kind === 'input' || item.kind === 'variable')) {
      variableValues[item.id] = item.value;
    }
  });
  return {
    id: 'sc-baseline',
    title: 'Current situation',
    description: 'Initial values as interpreted from your description.',
    isCurrent: true,
    variableValues,
  };
}

export function normalizeModel(raw: DecisionModel): DecisionModel {
  const { items, edges } = linkEdges(raw.items, raw.edges ?? []);
  const withLayout = computeLayout(items);
  const scenarios = raw.scenarios && raw.scenarios.length > 0 ? raw.scenarios : [baselineScenario(withLayout)];

  // Ensure unique ids across scenarios (regenerate defensively)
  const scIds = new Set<string>();
  const safeScenarios = scenarios.map((s) => {
    const id = uniqueId(s.id || 'scenario', scIds);
    scIds.add(id);
    return { ...s, id };
  });

  return {
    ...raw,
    items: withLayout,
    edges,
    scenarios: safeScenarios,
  };
}
