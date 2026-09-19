import { DecisionModel, ModelEdge, ModelItem } from '../types/decision';

/**
 * Deterministic model engine.
 *
 * After the AI has produced a DecisionModel, ALL behaviour in this app is
 * computed here — never by calling OpenAI again. The engine walks the
 * relationship graph, applies signed influence weights per relationship type
 * and accumulates relative deltas downstream of whatever the user changed.
 *
 * The math is a first-order linear approximation on purpose: it is fully
 * deterministic, explainable ("changing X shifts Y by roughly w·Δ%"), and
 * works on ANY model topology the AI produces — no shape is hardcoded.
 */

/** Signed influence multiplier per relationship type. */
export function influenceWeight(rel: ModelEdge['relationshipType']): number {
  switch (rel) {
    case 'inverse':
      return -1;
    case 'constrains':
      return -0.6;
    case 'mitigates':
      return -0.5;
    case 'depends':
      return 0.75;
    case 'drives':
      return 1;
    case 'direct':
    default:
      return 1;
  }
}

const EDITABLE_KINDS = new Set(['input', 'variable']);
const VALUE_KINDS = new Set(['input', 'variable', 'computed', 'impact']);

export function isEditableVariable(item: ModelItem): boolean {
  return EDITABLE_KINDS.has(item.kind) && item.origin !== 'unknown';
}

export function hasNumericValue(item: ModelItem): boolean {
  return item.range !== undefined || (typeof item.value === 'number' && VALUE_KINDS.has(item.kind));
}

export function currentValue(item: ModelItem): number | null {
  if (item.range) return item.range.value;
  if (typeof item.value === 'number' && VALUE_KINDS.has(item.kind)) return item.value;
  return null;
}

/** Unknowns are modeled but do not drive outcomes until the user resolves them. */
function isDormant(item: ModelItem): boolean {
  return item.kind === 'unknown' || (item.origin === 'unknown' && item.kind !== 'goal');
}

export interface PropagationUpdate {
  /** New numeric value for the item, already clamped to its range. */
  value?: number;
  /** Accumulated relative delta, e.g. 0.12 for +12%. */
  deltaPct: number;
  /** Human-readable chain of how the change reached this item. */
  path: string[];
}

export interface PropagationResult {
  /** itemId → update, for every item materially affected by the change. */
  updates: Record<string, PropagationUpdate>;
  /** BFS waves (topological layers) — used for the staggered highlight animation. */
  waves: string[][];
  /** All affected ids in visit order. */
  affectedIds: string[];
}

interface QueueEntry {
  id: string;
  deltaPct: number;
  path: string[];
}

/**
 * Propagate a relative change of one or more source items through the graph.
 * `changes` maps source item ids to their relative delta (e.g. 0.25 = +25%).
 * Unresolved unknowns are treated as dormant: their outgoing edges are skipped.
 */
export function propagate(model: DecisionModel, changes: Record<string, number>): PropagationResult {
  const itemsById = new Map(model.items.map((i) => [i.id, i]));
  const outEdges = new Map<string, ModelEdge[]>();
  (model.edges ?? []).forEach((e) => {
    const list = outEdges.get(e.from) ?? [];
    list.push(e);
    outEdges.set(e.from, list);
  });

  const updates: Record<string, PropagationUpdate> = {};
  const waves: string[][] = [];

  // Source nodes are the ones whose values the caller ALREADY set (inspector edit,
  // scenario apply). Their current value is final — the engine must never re-settle
  // or re-scale them, only fan their relative delta outward.
  const sourceIds = new Set(Object.keys(changes).filter((id) => itemsById.has(id)));

  let frontier: QueueEntry[] = [...sourceIds]
    .map((id) => ({ id, deltaPct: changes[id], path: [id] }));

  const settled = new Map<string, number>();
  // A node may be reached from several parents; allow up to 3 merges then stop.
  const visits = new Map<string, number>();
  const MAX_MERGES = 3;
  const MAX_WAVES = 12;

  let wave = 0;
  while (frontier.length > 0 && wave < MAX_WAVES) {
    const nextFrontier: QueueEntry[] = [];
    const waveIds: string[] = [];

    for (const entry of frontier) {
      const { id, deltaPct, path } = entry;
      if (Math.abs(deltaPct) < 0.001) continue; // ignore sub-0.1% noise

      const item = itemsById.get(id)!;
      if (isDormant(item)) continue; // unknowns don't propagate

      // Record/update this node
      const existing = updates[id];
      if (existing) {
        existing.deltaPct += deltaPct;
        if (existing.path.length > path.length) existing.path = path;
      } else {
        updates[id] = { deltaPct, path: [...path] };
      }
      waveIds.push(id);

      // Resolve value if numeric — but never for sources: their value is already final.
      if (hasNumericValue(item) && !sourceIds.has(id)) {
        const base = settled.get(id) ?? currentValue(item);
        if (base !== null) {
          const raw = base * (1 + (existing ? existing.deltaPct : deltaPct));
          settled.set(id, item.range ? clamp(raw, item.range) : raw);
        }
      }

      const seenCount = (visits.get(id) ?? 0) + 1;
      visits.set(id, seenCount);
      if (seenCount > MAX_MERGES) continue; // cycle / diamond guard

      // Fan out to children. Sources pass their delta straight through; derived
      // nodes re-derive the effective delta from their settled value.
      const effectiveDelta =
        sourceIds.has(id) ||
        settled.get(id) === undefined ||
        currentValue(item) === null ||
        currentValue(item)! === 0
          ? deltaPct
          : (settled.get(id)! - currentValue(item)!) / currentValue(item)!;

      for (const edge of outEdges.get(id) ?? []) {
        const target = itemsById.get(edge.to);
        if (!target || isDormant(target)) continue;
        if (!hasNumericValue(target) && target.kind !== 'goal' && target.kind !== 'constraint') continue;
        const w = influenceWeight(edge.relationshipType);
        nextFrontier.push({
          id: edge.to,
          deltaPct: effectiveDelta * w,
          path: [...path, edge.to],
        });
      }
    }

    if (waveIds.length > 0) waves.push(waveIds);
    frontier = nextFrontier;
    wave += 1;
  }

  // Materialize value updates — sources are excluded: the caller already set them.
  Object.entries(updates).forEach(([id, upd]) => {
    if (sourceIds.has(id)) return;
    const item = itemsById.get(id);
    if (!item) return;
    if (hasNumericValue(item)) {
      const base = currentValue(item)!;
      const raw = base * (1 + upd.deltaPct);
      upd.value = item.range ? clamp(raw, item.range) : round3(raw);
    }
  });

  // The source itself is "affected" for highlight purposes but carries no delta
  Object.keys(changes).forEach((id) => {
    if (!updates[id]) updates[id] = { deltaPct: 0, path: [id] };
  });

  const affectedIds = waves.flat();
  return { updates, waves, affectedIds };
}

function clamp(v: number, range: NonNullable<ModelItem['range']>): number {
  const stepped = range.step && range.step > 0 ? Math.round(v / range.step) * range.step : v;
  return round3(Math.min(range.max, Math.max(range.min, stepped)));
}

function round3(v: number): number {
  return Math.round(v * 1000) / 1000;
}

/** Apply a scenario's saved values, then propagate all of them at once. */
export function applyScenario(model: DecisionModel, variableValues: Record<string, number | string | boolean>): {
  items: ModelItem[];
  propagation: PropagationResult;
} {
  const changed: Record<string, number> = {};
  const items = model.items.map((item) => {
    if (!(item.id in variableValues)) return item;
    const val = variableValues[item.id];
    if (item.range && typeof val === 'number') {
      changed[item.id] = currentValue(item) !== null && currentValue(item)! !== 0
        ? (val - currentValue(item)!) / currentValue(item)!
        : 0;
      return { ...item, range: { ...item.range, value: clamp(val, item.range) } };
    }
    return { ...item, value: val };
  });

  const propagation = propagate({ ...model, items }, changed);
  // Scenario sources were set to their exact saved values above — exclude them
  // from the merge so propagation doesn't compound their deltas a second time.
  return { items: mergePropagation(items, propagation, new Set(Object.keys(changed))), propagation };
}

/** Merge propagation results back into an item list (values only — deltas stay ephemeral).
 *  `skipIds` are nodes whose value the user/scenario already set directly — never re-apply. */
export function mergePropagation(
  items: ModelItem[],
  propagation: PropagationResult,
  skipIds?: Set<string>
): ModelItem[] {
  return items.map((item) => {
    if (skipIds?.has(item.id)) return item;
    const upd = propagation.updates[item.id];
    if (!upd || upd.value === undefined) return item;
    if (item.range) return { ...item, range: { ...item.range, value: upd.value } };
    return { ...item, value: upd.value };
  });
}

/**
 * Sensitivity analysis: wiggle every editable variable by ±10% and record how
 * much each goal / impact moves. Fully local, deterministic, reversible.
 */
export interface SensitivityRow {
  variableId: string;
  variableLabel: string;
  unit: string;
  targets: {
    id: string;
    label: string;
    kind: string;
    deltaAtPlus: number;  // relative delta when variable +10%
    deltaAtMinus: number; // relative delta when variable −10%
  }[];
  /** Max |delta| across downstream goals/impacts — a simple leverage score. */
  leverage: number;
}

export function computeSensitivity(model: DecisionModel): SensitivityRow[] {
  const targets = model.items.filter((i) => i.kind === 'goal' || i.kind === 'impact');
  if (targets.length === 0) return [];

  const rows: SensitivityRow[] = [];
  for (const v of model.items) {
    if (!isEditableVariable(v) || !v.range) continue;
    const base = v.range.value;
    const span = v.range.max - v.range.min;
    const step = span !== 0 ? span * 0.1 : 0;
    if (step === 0) continue;

    const up = propagate(model, { [v.id]: step / (base || 1) });
    const down = propagate(model, { [v.id]: -step / (base || 1) });

    const cells = targets.map((t) => ({
      id: t.id,
      label: t.label,
      kind: t.kind,
      deltaAtPlus: up.updates[t.id]?.deltaPct ?? 0,
      deltaAtMinus: down.updates[t.id]?.deltaPct ?? 0,
    }));
    const leverage = Math.max(...cells.map((c) => Math.max(Math.abs(c.deltaAtPlus), Math.abs(c.deltaAtMinus))), 0);
    rows.push({
      variableId: v.id,
      variableLabel: v.label,
      unit: v.range.unit,
      targets: cells,
      leverage,
    });
  }
  rows.sort((a, b) => b.leverage - a.leverage);
  return rows;
}

/**
 * Assumption audit: for every assumption and unresolved unknown, compute how
 * much of the model sits downstream of it (criticality) without inventing data.
 */
export interface AuditRow {
  id: string;
  label: string;
  detail: string;
  kind: 'assumption' | 'unknown';
  confidence?: ModelItem['confidence'];
  downstreamCount: number;
  goalsAffected: string[];
  criticality: 'critical' | 'moderate' | 'low';
}

export function auditAssumptions(model: DecisionModel): AuditRow[] {
  const rows: AuditRow[] = model.items
    .filter((i) => i.kind === 'assumption' || i.kind === 'unknown')
    .map((item) => {
      const reach = reachableFrom(model, item.id);
      const goalsAffected = model.items
        .filter((g) => g.kind === 'goal' && reach.has(g.id))
        .map((g) => g.label);
      const criticality: AuditRow['criticality'] =
        goalsAffected.length >= 2 ? 'critical' : goalsAffected.length === 1 ? 'moderate' : 'low';
      return {
        id: item.id,
        label: item.label,
        detail: item.detail,
        kind: item.kind as 'assumption' | 'unknown',
        confidence: item.confidence,
        downstreamCount: reach.size,
        goalsAffected,
        criticality,
      };
    });
  rows.sort((a, b) => b.downstreamCount - a.downstreamCount);
  return rows;
}

function reachableFrom(model: DecisionModel, startId: string): Set<string> {
  const out = new Map<string, string[]>();
  (model.edges ?? []).forEach((e) => {
    const list = out.get(e.from) ?? [];
    list.push(e.to);
    out.set(e.from, list);
  });
  const seen = new Set<string>();
  const stack = [startId];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const nxt of out.get(cur) ?? []) {
      if (!seen.has(nxt)) {
        seen.add(nxt);
        stack.push(nxt);
      }
    }
  }
  seen.delete(startId);
  return seen;
}

/** Format a propagated delta for UI display. */
export function formatDelta(deltaPct: number): string {
  const pct = Math.round(deltaPct * 1000) / 10;
  if (pct === 0) return '±0%';
  return `${pct > 0 ? '+' : ''}${pct}%`;
}
