import { DecisionModel } from '../types/decision';

export const contractorDecision: DecisionModel = {
  id: 'contractor',
  title: 'Contracting while finishing college',
  prompt:
  'I want to become a contractor, but because of college I can’t properly handle my contractor tasks.',
  summary:
  'A capacity conflict between two commitments that both consume the same finite resource: your weekly hours. The model treats college load as fixed in the short term and contract scope as the adjustable surface.',
  items: [
  {
    id: 'g1',
    kind: 'goal',
    label: 'Build sustainable contracting income',
    detail:
    'Reach a revenue level that survives after graduation without depending on a single client.',
    origin: 'user',
    facts: [
    { label: 'horizon', value: '18 months' },
    { label: 'priority', value: 'primary' }],

    affects: ['o1', 'o2', 'v1']
  },
  {
    id: 'g2',
    kind: 'goal',
    label: 'Finish the degree on schedule',
    detail: 'No dropped semesters, no academic probation, graduate with the current cohort.',
    origin: 'user',
    facts: [{ label: 'deadline', value: 'fixed' }],
    affects: ['c1', 'v2']
  },
  {
    id: 'g3',
    kind: 'goal',
    label: 'Avoid burnout',
    detail:
    'Inferred from “can’t properly handle” — the phrasing describes overload, not lack of skill.',
    origin: 'inferred',
    confidence: 'medium',
    facts: [{ label: 'signal', value: 'overload language' }],
    affects: ['v1', 'v4']
  },
  {
    id: 'o1',
    kind: 'option',
    label: 'Reduce contract scope',
    detail:
    'Keep contracting but cut to a single retainer client with a narrow, repeatable deliverable.',
    origin: 'inferred',
    polarity: 'positive',
    facts: [
    { label: 'income', value: '−35%' },
    { label: 'load', value: '−55%' }],

    affects: ['v1', 'v3']
  },
  {
    id: 'o2',
    kind: 'option',
    label: 'Subcontract execution',
    detail: 'Stay client-facing, delegate delivery work, absorb the margin loss.',
    origin: 'inferred',
    polarity: 'warning',
    facts: [
    { label: 'margin', value: '−40%' },
    { label: 'risk', value: 'quality' }],

    affects: ['v3', 'u2']
  },
  {
    id: 'o3',
    kind: 'option',
    label: 'Reduce course load',
    detail: 'Drop to part-time enrolment, extend graduation by one or two semesters.',
    origin: 'inferred',
    polarity: 'negative',
    facts: [
    { label: 'graduation', value: '+2 sem' },
    { label: 'aid', value: 'at risk' }],

    affects: ['g2', 'c2', 'v2']
  },
  {
    id: 'o4',
    kind: 'option',
    label: 'Pause contracting for two terms',
    detail: 'Fully defer client work until the heaviest coursework is behind you.',
    origin: 'inferred',
    polarity: 'neutral',
    facts: [{ label: 'income', value: '→ 0' }],
    affects: ['g1', 'v3']
  },
  {
    id: 'v1',
    kind: 'variable',
    label: 'Weekly hours available',
    detail: 'The shared resource both commitments draw from. Everything downstream scales here.',
    origin: 'inferred',
    confidence: 'high',
    range: { min: 10, max: 70, value: 38, unit: 'hrs/wk' },
    facts: [{ label: 'shared_by', value: 'college, clients' }],
    affects: ['v2', 'v3', 'u1']
  },
  {
    id: 'v2',
    kind: 'variable',
    label: 'Course load',
    detail: 'Credits enrolled this term, including lab and studio hours.',
    origin: 'inferred',
    range: { min: 6, max: 21, value: 15, unit: 'credits' },
    facts: [{ label: 'hrs_per_credit', value: '≈2.5' }],
    affects: ['v1', 'g2']
  },
  {
    id: 'v3',
    kind: 'variable',
    label: 'Active client count',
    detail: 'Concurrent engagements. Each one carries fixed coordination overhead.',
    origin: 'inferred',
    range: { min: 0, max: 8, value: 3, unit: 'clients', step: 1 },
    facts: [{ label: 'overhead', value: '~3 hrs each' }],
    affects: ['v1', 'v5']
  },
  {
    id: 'v4',
    kind: 'variable',
    label: 'Recovery time',
    detail: 'Unscheduled hours per week. The first thing overload consumes.',
    origin: 'inferred',
    confidence: 'low',
    range: { min: 0, max: 30, value: 6, unit: 'hrs/wk' },
    affects: ['g3']
  },
  {
    id: 'v5',
    kind: 'variable',
    label: 'Effective hourly rate',
    detail: 'Revenue divided by all hours worked, including unbilled coordination.',
    origin: 'inferred',
    range: { min: 15, max: 200, value: 62, unit: '$/hr' },
    affects: ['g1']
  },
  {
    id: 'v6',
    kind: 'variable',
    label: 'Delivery lead time',
    detail: 'Days between commitment and delivery. Rises non-linearly as hours compress.',
    origin: 'inferred',
    range: { min: 2, max: 45, value: 14, unit: 'days' },
    affects: ['u2']
  },
  {
    id: 'c1',
    kind: 'constraint',
    label: 'Attendance requirement',
    detail: 'Studio and lab sessions cannot be rescheduled or attended asynchronously.',
    origin: 'inferred',
    polarity: 'negative',
    facts: [{ label: 'hard', value: 'true' }],
    affects: ['v1']
  },
  {
    id: 'c2',
    kind: 'constraint',
    label: 'Full-time enrolment tied to aid',
    detail: 'Dropping below 12 credits may forfeit financial aid for the year.',
    origin: 'inferred',
    confidence: 'low',
    polarity: 'warning',
    facts: [{ label: 'threshold', value: '12 credits' }],
    affects: ['o3']
  },
  {
    id: 'c3',
    kind: 'constraint',
    label: 'Existing client commitments',
    detail: 'Signed scopes run to end of term and cannot be reduced unilaterally.',
    origin: 'user',
    polarity: 'negative',
    facts: [{ label: 'locked_until', value: 'term end' }],
    affects: ['o1', 'o4']
  },
  {
    id: 'u1',
    kind: 'unknown',
    label: 'Actual hours lost to context switching',
    detail:
    'Switching between coursework and client work has a real cost that has not been measured.',
    origin: 'unknown',
    facts: [{ label: 'estimate', value: '4–12 hrs/wk' }],
    affects: ['v1']
  },
  {
    id: 'u2',
    kind: 'unknown',
    label: 'Client tolerance for slower delivery',
    detail: 'Unclear whether current clients would accept longer lead times over losing you.',
    origin: 'unknown',
    facts: [{ label: 'testable', value: 'yes — one conversation' }],
    affects: ['o1', 'o2']
  },
  {
    id: 'u3',
    kind: 'unknown',
    label: 'Post-graduation pipeline',
    detail: 'Whether current clients convert into sustained work after the degree ends.',
    origin: 'unknown',
    affects: ['g1']
  },
  {
    id: 'a1',
    kind: 'assumption',
    label: 'College load is fixed this term',
    detail: 'Treated as immovable until the add/drop window is confirmed.',
    origin: 'inferred',
    confidence: 'medium',
    facts: [{ label: 'revisit', value: 'add/drop date' }],
    affects: ['v2']
  },
  {
    id: 'a2',
    kind: 'assumption',
    label: 'Contracting is a long-term intent, not a stopgap',
    detail: 'Read from “I want to become a contractor” rather than “I need money now”.',
    origin: 'inferred',
    confidence: 'high',
    affects: ['g1']
  },
  {
    id: 'a3',
    kind: 'assumption',
    label: 'Quality problems come from capacity, not skill',
    detail: 'If this is wrong, reducing scope will not fix delivery quality.',
    origin: 'inferred',
    confidence: 'low',
    polarity: 'warning',
    affects: ['o1', 'o2']
  }],

  consequences: [
  {
    id: 'k1',
    label: 'Delivery quality recovers before income does',
    detail: 'Cutting clients frees hours immediately; revenue takes two to three months to stabilise.',
    polarity: 'positive',
    driver: 'v3'
  },
  {
    id: 'k2',
    label: 'Financial aid becomes the binding constraint',
    detail: 'Any path that reduces course load below 12 credits collides with c2.',
    polarity: 'negative',
    driver: 'c2'
  },
  {
    id: 'k3',
    label: 'Recovery time is the first thing to disappear',
    detail: 'At current hours the model shows recovery approaching zero before either goal fails.',
    polarity: 'warning',
    driver: 'v4'
  }]

};

export const relocationDecision: DecisionModel = {
  id: 'relocation',
  title: 'Relocating with a remote role',
  prompt:
  'My company went remote-first and I could move somewhere cheaper, but my partner’s career is here and we just started fertility treatment.',
  summary:
  'Three commitments with different reversibility. Housing cost is the adjustable surface; treatment continuity and one career are close to fixed.',
  items: [
  {
    id: 'g1',
    kind: 'goal',
    label: 'Lower fixed monthly cost',
    detail: 'Reduce the burn rate enough that one income could carry the household.',
    origin: 'user',
    affects: ['v1']
  },
  {
    id: 'g2',
    kind: 'goal',
    label: 'Keep both careers intact',
    detail: 'Neither person takes a step backwards in seniority.',
    origin: 'user',
    affects: ['o1', 'o2']
  },
  {
    id: 'o1',
    kind: 'option',
    label: 'Move now',
    detail: 'Relocate before the next lease renewal and transfer care.',
    origin: 'inferred',
    polarity: 'warning',
    affects: ['c1']
  },
  {
    id: 'o2',
    kind: 'option',
    label: 'Defer twelve months',
    detail: 'Stay through the treatment cycle, reassess with more information.',
    origin: 'inferred',
    polarity: 'positive',
    affects: ['u1']
  },
  {
    id: 'v1',
    kind: 'variable',
    label: 'Monthly housing cost',
    detail: 'The largest single line item and the clearest lever.',
    origin: 'inferred',
    range: { min: 900, max: 5200, value: 3400, unit: '$/mo' },
    affects: ['g1']
  },
  {
    id: 'v2',
    kind: 'variable',
    label: 'Distance from current care team',
    detail: 'Drives both continuity risk and travel cost.',
    origin: 'inferred',
    range: { min: 0, max: 2500, value: 0, unit: 'miles' },
    affects: ['c1']
  },
  {
    id: 'c1',
    kind: 'constraint',
    label: 'Treatment continuity',
    detail: 'The current cycle cannot be interrupted or transferred mid-protocol.',
    origin: 'user',
    polarity: 'negative',
    affects: ['o1']
  },
  {
    id: 'u1',
    kind: 'unknown',
    label: 'Whether the remote policy is permanent',
    detail: 'No written commitment beyond the current fiscal year.',
    origin: 'unknown',
    affects: ['o1', 'o2']
  },
  {
    id: 'a1',
    kind: 'assumption',
    label: 'Partner’s field is location-dependent',
    detail: 'Assumed from “her career is here”. Worth testing before modelling further.',
    origin: 'inferred',
    confidence: 'low',
    affects: ['g2']
  }],

  consequences: [
  {
    id: 'k1',
    label: 'Timing dominates destination',
    detail: 'When you move changes the outcome more than where you move.',
    polarity: 'warning',
    driver: 'c1'
  }]

};

export const pricingDecision: DecisionModel = {
  id: 'pricing',
  title: 'Raising prices on existing customers',
  prompt:
  'We need to raise prices but half our revenue comes from six early customers who are on legacy plans.',
  summary:
  'A concentration problem disguised as a pricing problem. The model separates the price change from the account risk it creates.',
  items: [
  {
    id: 'g1',
    kind: 'goal',
    label: 'Reach gross-margin target',
    detail: 'Cover rising infrastructure cost without new headcount.',
    origin: 'user',
    affects: ['v1']
  },
  {
    id: 'o1',
    kind: 'option',
    label: 'Grandfather indefinitely',
    detail: 'Raise prices for new customers only.',
    origin: 'inferred',
    polarity: 'neutral',
    affects: ['v2']
  },
  {
    id: 'o2',
    kind: 'option',
    label: 'Phased migration',
    detail: 'Move legacy accounts over three renewal cycles with notice.',
    origin: 'inferred',
    polarity: 'positive',
    affects: ['v2', 'u1']
  },
  {
    id: 'v1',
    kind: 'variable',
    label: 'Price increase',
    detail: 'Applied to the legacy cohort.',
    origin: 'inferred',
    range: { min: 0, max: 100, value: 22, unit: '%' },
    affects: ['v2']
  },
  {
    id: 'v2',
    kind: 'variable',
    label: 'Churn risk in legacy cohort',
    detail: 'Non-linear: tolerance collapses past a threshold rather than degrading smoothly.',
    origin: 'inferred',
    range: { min: 0, max: 100, value: 18, unit: '%' },
    affects: ['g1']
  },
  {
    id: 'c1',
    kind: 'constraint',
    label: 'Revenue concentration',
    detail: 'Six accounts represent half of revenue. Losing two is not survivable this year.',
    origin: 'user',
    polarity: 'negative',
    affects: ['o1', 'o2']
  },
  {
    id: 'u1',
    kind: 'unknown',
    label: 'Actual switching cost for legacy customers',
    detail: 'Never measured. Determines how much pricing power you actually hold.',
    origin: 'unknown',
    affects: ['v2']
  }],

  consequences: [
  {
    id: 'k1',
    label: 'Concentration, not price, is the real exposure',
    detail: 'Every option leaves the same six accounts able to decide the year.',
    polarity: 'negative',
    driver: 'c1'
  }]

};

export const exampleDecisions: DecisionModel[] = [
contractorDecision,
relocationDecision,
pricingDecision];


export const examplePrompts: {label: string;prompt: string;}[] = exampleDecisions.map((d) => ({
  label: d.title,
  prompt: d.prompt
}));