import {
  Confidence,
  DecisionModel,
  ItemKind,
  ModelEdge,
  ModelItem,
  Origin,
  VariableType,
  controlTypeForVariableType,
} from '../types/decision';

export interface ValidationResult {
  ok: boolean;
  errors: string[];   // structural problems — must fix or fall back to demo
  warnings: string[]; // tolerated problems (dropped items, unknown types, dangling refs)
}

const VALID_KINDS: ItemKind[] = [
  'decision', 'option', 'input', 'variable', 'computed',
  'goal', 'constraint', 'impact', 'assumption', 'unknown',
];

const VALID_CONFIDENCE: Confidence[] = ['high', 'medium', 'low'];
const VALID_REL_TYPES = ['direct', 'inverse', 'constrains', 'drives', 'mitigates', 'depends'];
const VALID_VAR_TYPES: VariableType[] = [
  'number', 'percentage', 'currency', 'duration', 'date',
  'boolean', 'choice', 'scale', 'text', 'unknown',
];

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : null;
}

/**
 * Validates a parsed JSON object claimed to be an AI decision model.
 * Tolerant by design: malformed items are reported and dropped, never thrown.
 */
export function validateRawModel(raw: unknown): ValidationResult & { model?: DecisionModel } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, errors: ['AI response is not a JSON object'], warnings };
  }
  const obj = raw as Record<string, unknown>;

  const title = str(obj.title) ?? str((obj.decision as Record<string, unknown>)?.title as string);
  const prompt = str(obj.prompt) ?? '';
  const summary = str(obj.summary) ?? '';

  if (!title) errors.push('Missing model title / decision statement');
  if (!prompt) warnings.push('Missing prompt — echoing the submitted one instead');

  const rawItems = Array.isArray(obj.items) ? obj.items : [];
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    errors.push('AI returned no model items');
  }

  const items: ModelItem[] = [];
  const seenIds = new Set<string>();
  const idOf = (v: unknown, fallbackKind: string, idx: number) => {
    const s = str(v);
    if (s && !seenIds.has(s) && /^[a-zA-Z0-9_-]{1,64}$/.test(s)) return s;
    const gen = `${fallbackKind}-${idx}-${Math.random().toString(36).slice(2, 7)}`;
    if (s && seenIds.has(s)) warnings.push(`Duplicate item id "${s}" — regenerated as "${gen}"`);
    else if (s) warnings.push(`Item id "${s}" is not a safe identifier — regenerated`);
    return gen;
  };

  rawItems.forEach((it, idx) => {
    if (!it || typeof it !== 'object' || Array.isArray(it)) {
      warnings.push(`Item #${idx} is not an object — dropped`);
      return;
    }
    const o = it as Record<string, unknown>;
    const kindRaw = str(o.kind)?.toLowerCase() ?? '';
    let kind = kindRaw as ItemKind;
    if (!VALID_KINDS.includes(kind)) {
      // Accept a few common synonyms from the AI rather than dropping the item.
      const synonym = str(o.type)?.toLowerCase() ?? '';
      if (VALID_KINDS.includes(synonym as ItemKind)) {
        kind = synonym as ItemKind;
      } else {
        warnings.push(`Item #${idx} has unsupported kind "${kindRaw}" — dropped`);
        return;
      }
    }

    const label = str(o.label) ?? str(o.name);
    if (!label) {
      warnings.push(`Item #${idx} (${kind}) has no label — dropped`);
      return;
    }

    const id = idOf(o.id, kind, idx);
    seenIds.add(id);

    const originRaw = str(o.origin)?.toLowerCase();
    const sourceRaw = str(o.source)?.toLowerCase();
    const origin: Origin =
      originRaw === 'user' || sourceRaw === 'user_provided' || sourceRaw === 'user'
        ? 'user'
        : sourceRaw === 'unknown' || originRaw === 'unknown'
          ? 'unknown'
          : 'inferred';

    const confidence = VALID_CONFIDENCE.includes(o.confidence as Confidence)
      ? (o.confidence as Confidence)
      : undefined;

    const item: ModelItem = {
      id,
      kind,
      label,
      detail: str(o.detail) ?? str(o.description) ?? '',
      origin,
      confidence,
    };

    // Variable typing
    const vtRaw = str(o.variableType)?.toLowerCase() ?? str(o.type)?.toLowerCase();
    let variableType: VariableType | undefined;
    if (vtRaw && VALID_VAR_TYPES.includes(vtRaw as VariableType)) {
      variableType = vtRaw as VariableType;
    } else if (vtRaw) {
      warnings.push(`Item "${label}" has unsupported variable type "${vtRaw}" — treated as number`);
      variableType = 'number';
    }

    if (kind === 'input' || kind === 'variable' || kind === 'computed') {
      item.variableType = variableType ?? 'number';
      item.controlType = controlTypeForVariableType(item.variableType);
    }

    // Value / range
    const numeric =
      kind === 'input' || kind === 'variable' || kind === 'computed'
        ? typeof o.value === 'number'
          ? o.value
          : typeof o.value === 'string' && o.value.trim() !== '' && !Number.isNaN(Number(o.value))
            ? Number(o.value)
            : null
        : null;

    if (numeric !== null) {
      const min = typeof o.min === 'number' ? o.min : Math.max(0, numeric * 0.25);
      const max = typeof o.max === 'number' ? o.max : numeric === 0 ? 10 : numeric * 2;
      item.range = {
        min: Math.min(min, numeric),
        max: Math.max(max, numeric),
        value: numeric,
        unit: str(o.unit) ?? '',
      };
    } else if (o.value !== undefined && o.value !== null) {
      item.value = o.value as string | number | boolean;
    }
    if (typeof o.unit === 'string' && item.range && !item.range.unit) item.range.unit = o.unit;

    if (typeof o.computedFormula === 'string') item.computedFormula = o.computedFormula;
    if (Array.isArray(o.selectOptions)) {
      item.selectOptions = o.selectOptions.map((s) => String(s)).filter((s) => s.length > 0);
    }
    if (Array.isArray(o.affects)) {
      item.affects = o.affects.map((a) => String(a)).filter((a) => a.length > 0);
    }
    if (Array.isArray(o.facts)) {
      item.facts = o.facts
        .filter((f): f is { label: string; value: string } =>
          !!f && typeof f === 'object' && typeof (f as any).label === 'string' && typeof (f as any).value === 'string')
        .map((f) => ({ label: f.label, value: f.value }));
    }
    if (typeof o.polarity === 'string' && ['positive', 'negative', 'warning', 'neutral'].includes(o.polarity)) {
      item.polarity = o.polarity as ModelItem['polarity'];
    }

    items.push(item);
  });

  // Edges
  const rawEdges = Array.isArray(obj.edges) ? obj.edges : [];
  const edges: ModelEdge[] = [];
  rawEdges.forEach((e, idx) => {
    if (!e || typeof e !== 'object') {
      warnings.push(`Edge #${idx} is not an object — dropped`);
      return;
    }
    const o = e as Record<string, unknown>;
    const from = str(o.from) ?? str(o.source);
    const to = str(o.to) ?? str(o.target);
    if (!from || !to) {
      warnings.push(`Edge #${idx} missing from/to — dropped`);
      return;
    }
    if (!seenIds.has(from) || !seenIds.has(to)) {
      warnings.push(`Edge #${idx} references missing node (${from} → ${to}) — dropped`);
      return;
    }
    const relRaw = str(o.relationshipType)?.toLowerCase();
    edges.push({
      id: str(o.id) ?? `e-${idx}-${from}-${to}`,
      from,
      to,
      relationshipType:
        relRaw && VALID_REL_TYPES.includes(relRaw) ? (relRaw as ModelEdge['relationshipType']) : 'direct',
      explanation: str(o.explanation) ?? undefined,
      origin: 'inferred',
      confidence: VALID_CONFIDENCE.includes(o.confidence as Confidence) ? (o.confidence as Confidence) : undefined,
    });
  });

  // Consequences
  const consequences = Array.isArray(obj.consequences)
    ? obj.consequences
        .filter((c): c is Record<string, unknown> => !!c && typeof c === 'object')
        .map((c, idx) => ({
          id: str(c.id) ?? `k-${idx}`,
          label: str(c.label) ?? str(c.title) ?? `Consequence ${idx + 1}`,
          detail: str(c.detail) ?? str(c.description) ?? '',
          polarity: (['positive', 'negative', 'warning', 'neutral'].includes(String(c.polarity))
            ? c.polarity
            : 'neutral') as NonNullable<ModelItem['polarity']>,
          driver: str(c.driver) ?? '',
        }))
        .filter((c) => c.label)
    : [];

  const model: DecisionModel = {
    id: str(obj.id) ?? `model-${Date.now().toString(36)}`,
    title: title!,
    prompt,
    summary: summary || 'No summary returned by the analysis.',
    items,
    edges,
    consequences,
    scenarios: Array.isArray(obj.scenarios) ? (obj.scenarios as DecisionModel['scenarios']) : undefined,
    source: obj.source === 'demo' ? 'demo' : 'ai',
    generatedAt: new Date().toISOString(),
  };

  return { ok: errors.length === 0 && items.length > 0, errors, warnings, model };
}
