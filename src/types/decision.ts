export type ItemKind =
  | 'decision'
  | 'option'
  | 'input'
  | 'variable'
  | 'computed'
  | 'goal'
  | 'constraint'
  | 'impact'
  | 'assumption'
  | 'unknown';

/** Where a piece of the model came from. Drives the provenance language across the UI. */
export type Origin = 'user' | 'inferred' | 'unknown';

export type Confidence = 'high' | 'medium' | 'low';

export type Polarity = 'positive' | 'negative' | 'warning' | 'neutral';

export type VariableControlType = 'numeric' | 'slider' | 'dropdown' | 'toggle' | 'date' | 'percentage';

export type WorkspaceViewMode = 'canvas' | 'scenarios' | 'stresstest' | 'sensitivity' | 'assumptions' | 'report' | 'states';

export type SystemStateType = 'loading' | 'missing_info' | 'insufficient_data' | 'ai_error' | 'empty_scenario' | 'saved';

export interface ItemFact {
  label: string;
  value: string;
}

export interface ModelItem {
  id: string;
  kind: ItemKind;
  label: string;
  detail: string;
  origin: Origin;
  confidence?: Confidence;
  /** Canvas layout coordinates */
  x?: number;
  y?: number;
  /** Value representation */
  value?: string | number | boolean;
  /** UI control type for editing */
  controlType?: VariableControlType;
  selectOptions?: string[];
  computedFormula?: string;
  /** Short technical facts rendered in monospace on the card. */
  facts?: ItemFact[];
  /** Ids of other items this item affects. */
  affects?: string[];
  polarity?: Polarity;
  /** Numeric variables get a tunable range. */
  range?: {
    min: number;
    max: number;
    value: number;
    unit: string;
    step?: number;
  };
  /** Unknown estimation choices */
  unknownEstimation?: {
    type?: 'range' | 'qualitative' | 'exact' | 'unresolved';
    qualitative?: 'low' | 'medium' | 'high';
    rangeMin?: number;
    rangeMax?: number;
  };
}

export interface ModelEdge {
  id: string;
  from: string;
  to: string;
  relationshipType?: 'direct' | 'inverse' | 'constrains' | 'drives' | 'mitigates' | 'depends';
  explanation?: string;
  origin?: Origin;
  confidence?: Confidence;
}

export interface Consequence {
  id: string;
  label: string;
  detail: string;
  polarity: Polarity;
  driver: string;
}

export interface SensitivityMetric {
  id: string;
  label: string;
  impactScore: number; // 0–100 magnitude bar
  unit?: string;
  description: string;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  isCurrent?: boolean;
  variableValues: Record<string, number | string | boolean>;
  goalImpacts?: Record<string, string>;
  constraintStatus?: Record<string, 'Satisfied' | 'At Risk' | 'Breached'>;
  consequences?: string[];
  unknownsCount?: number;
  assumptionsCount?: number;
}

export interface DecisionModel {
  id: string;
  title: string;
  prompt: string;
  summary: string;
  items: ModelItem[];
  edges?: ModelEdge[];
  consequences: Consequence[];
  scenarios?: Scenario[];
  sensitivities?: SensitivityMetric[];
}

export const KIND_ORDER: ItemKind[] = [
  'decision',
  'option',
  'input',
  'variable',
  'computed',
  'goal',
  'constraint',
  'impact',
  'assumption',
  'unknown'
];

export const KIND_LABEL: Record<ItemKind, string> = {
  decision: 'Decision',
  option: 'Options',
  input: 'Inputs',
  variable: 'Variables',
  computed: 'Computed',
  goal: 'Goals',
  constraint: 'Constraints',
  impact: 'Impacts',
  assumption: 'Assumptions',
  unknown: 'Unknowns'
};

export const KIND_DESCRIPTION: Record<ItemKind, string> = {
  decision: 'The primary decision or question being evaluated.',
  option: 'Distinct paths or actions available to choose from.',
  input: 'A user-provided variable that directly influences calculations.',
  variable: 'Quantities that move. Changing one propagates through the model.',
  computed: 'A value dynamically calculated or derived from other variables.',
  goal: 'What a good outcome has to satisfy. Goals are scored, never chosen for you.',
  constraint: 'Hard limits or boundaries the model is not allowed to violate.',
  impact: 'A modeled consequence or downstream effect on the decision.',
  assumption: 'Statements or parameters the model currently accepts as true.',
  unknown: 'Missing or unavailable information treated as a range or estimate.'
};

export const ORIGIN_LABEL: Record<Origin, string> = {
  user: 'User provided',
  inferred: 'AI inferred',
  unknown: 'Unknown'
};
