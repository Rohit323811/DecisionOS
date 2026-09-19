import { DecisionModel } from '../types/decision';
import { demoDecision } from './demoModel';

/**
 * Legacy export surface kept for the landing page graph preview.
 * All example data now lives in the schema-compliant demo model.
 */
export const contractorDecision: DecisionModel = demoDecision;

export const exampleDecisions: DecisionModel[] = [demoDecision];

export const examplePrompts = exampleDecisions.map((d) => ({
  id: d.id,
  label: d.title,
  prompt: d.prompt,
}));
