export type ItemKind =
'goal' |
'option' |
'variable' |
'constraint' |
'unknown' |
'assumption';

/** Where a piece of the model came from. Drives the provenance language across the UI. */
export type Origin = 'user' | 'inferred' | 'unknown';

export type Confidence = 'high' | 'medium' | 'low';

export type Polarity = 'positive' | 'negative' | 'warning' | 'neutral';

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
  /** Short technical facts rendered in monospace on the card. */
  facts?: ItemFact[];
  /** Ids of other items this item affects. */
  affects?: string[];
  polarity?: Polarity;
  /** Numeric variables get a tunable range. */
  range?: {min: number;max: number;value: number;unit: string;step?: number;};
}

export interface Consequence {
  id: string;
  label: string;
  detail: string;
  polarity: Polarity;
  driver: string;
}

export interface DecisionModel {
  id: string;
  title: string;
  prompt: string;
  summary: string;
  items: ModelItem[];
  consequences: Consequence[];
}

export const KIND_ORDER: ItemKind[] = [
'goal',
'option',
'variable',
'constraint',
'unknown',
'assumption'];


export const KIND_LABEL: Record<ItemKind, string> = {
  goal: 'Goals',
  option: 'Options',
  variable: 'Variables',
  constraint: 'Constraints',
  unknown: 'Unknowns',
  assumption: 'Assumptions'
};

export const KIND_DESCRIPTION: Record<ItemKind, string> = {
  goal: 'What a good outcome has to satisfy. Goals are scored, never chosen for you.',
  option: 'Distinct paths available from where you stand today.',
  variable: 'Quantities that move. Changing one propagates through the model.',
  constraint: 'Hard limits the model is not allowed to violate.',
  unknown: 'Missing information the model treats as a range, not a fact.',
  assumption: 'Statements the model is currently accepting as true.'
};

export const ORIGIN_LABEL: Record<Origin, string> = {
  user: 'From you',
  inferred: 'Inferred',
  unknown: 'Unknown'
};