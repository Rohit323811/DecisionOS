import { DecisionModel, ModelEdge, Scenario } from '../types/decision';

export const contractorEdges: ModelEdge[] = [
  {
    id: 'e1',
    from: 'v1',
    to: 'v2',
    relationshipType: 'inverse',
    explanation: 'Higher weekly hours available allows managing larger course loads with lower strain.',
    origin: 'inferred',
    confidence: 'high'
  },
  {
    id: 'e2',
    from: 'v2',
    to: 'g2',
    relationshipType: 'direct',
    explanation: 'Course load directly determines credit progress toward graduating on schedule.',
    origin: 'inferred',
    confidence: 'high'
  },
  {
    id: 'e3',
    from: 'v1',
    to: 'v3',
    relationshipType: 'direct',
    explanation: 'Available time sets the upper bound on contractor workload capacity.',
    origin: 'inferred',
    confidence: 'high'
  },
  {
    id: 'e4',
    from: 'v3',
    to: 'v5',
    relationshipType: 'drives',
    explanation: 'Active client count directly drives monthly contracting revenue and effective rate.',
    origin: 'inferred',
    confidence: 'medium'
  },
  {
    id: 'e5',
    from: 'v5',
    to: 'g1',
    relationshipType: 'drives',
    explanation: 'Effective hourly rate and total revenue determine sustainable contracting income.',
    origin: 'user',
    confidence: 'high'
  },
  {
    id: 'e6',
    from: 'c1',
    to: 'v1',
    relationshipType: 'constrains',
    explanation: 'Fixed college attendance requirements reduce total weekly flexible hours.',
    origin: 'inferred',
    confidence: 'high'
  },
  {
    id: 'e7',
    from: 'u1',
    to: 'v1',
    relationshipType: 'inverse',
    explanation: 'Context switching hours lost directly deplete available time.',
    origin: 'unknown',
    confidence: 'medium'
  },
  {
    id: 'e8',
    from: 'v4',
    to: 'g3',
    relationshipType: 'direct',
    explanation: 'Sufficient recovery time prevents burnout and maintains personal health.',
    origin: 'inferred',
    confidence: 'medium'
  }
];

export const contractorScenarios: Scenario[] = [
  {
    id: 'sc-1',
    title: 'Current Situation',
    description: '15 credits coursework with 3 active client engagements (38 hrs/wk).',
    isCurrent: true,
    variableValues: {
      v1: 38,
      v2: 15,
      v3: 3,
      v4: 6,
      v5: 62
    }
  },
  {
    id: 'sc-2',
    title: 'Prioritize College',
    description: 'Reduce active clients to 1, protecting GPA and graduation timeline.',
    variableValues: {
      v1: 25,
      v2: 15,
      v3: 1,
      v4: 16,
      v5: 75
    }
  },
  {
    id: 'sc-3',
    title: 'Prioritize Contracting',
    description: 'Reduce course load to 9 credits, expanding client capacity to 5.',
    variableValues: {
      v1: 52,
      v2: 9,
      v3: 5,
      v4: 4,
      v5: 85
    }
  },
  {
    id: 'sc-4',
    title: 'Balanced Workload',
    description: '12 credits with 2 retainer clients, keeping recovery time at 12 hrs/wk.',
    variableValues: {
      v1: 34,
      v2: 12,
      v3: 2,
      v4: 12,
      v5: 70
    }
  }
];

export const contractorDecision: DecisionModel = {
  id: 'contractor',
  title: 'Contracting while finishing college',
  prompt:
    'I want to become a contractor, but because of college I can’t properly handle my contractor tasks.',
  summary:
    'A capacity conflict between two commitments drawing from weekly available time. College workload affects available time, which controls contractor workload capacity, project delivery, and long-term career progress.',
  edges: contractorEdges,
  scenarios: contractorScenarios,
  items: [
    {
      id: 'dc-1',
      kind: 'decision',
      label: 'Balance college workload and contracting',
      detail: 'Central decision on how to structure weekly time allocation.',
      origin: 'user',
      x: 80,
      y: 180,
      facts: [{ label: 'focus', value: 'Primary' }]
    },
    {
      id: 'g1',
      kind: 'goal',
      label: 'Build sustainable contracting income',
      detail: 'Reach revenue level that survives graduation without client churn.',
      origin: 'user',
      x: 1320,
      y: 80,
      facts: [
        { label: 'horizon', value: '18 months' },
        { label: 'priority', value: 'primary' }
      ],
      affects: ['o1', 'o2', 'v1']
    },
    {
      id: 'g2',
      kind: 'goal',
      label: 'Finish degree on schedule',
      detail: 'No dropped semesters, graduate with current cohort.',
      origin: 'user',
      x: 1320,
      y: 240,
      facts: [{ label: 'deadline', value: 'fixed' }],
      affects: ['c1', 'v2']
    },
    {
      id: 'g3',
      kind: 'goal',
      label: 'Avoid burnout',
      detail: 'Maintain healthy recovery time and mental clarity.',
      origin: 'inferred',
      confidence: 'medium',
      x: 1320,
      y: 400,
      facts: [{ label: 'signal', value: 'overload language' }],
      affects: ['v1', 'v4']
    },
    {
      id: 'o1',
      kind: 'option',
      label: 'Reduce contract scope',
      detail: 'Cut to single retainer client with repeatable deliverable.',
      origin: 'inferred',
      polarity: 'positive',
      x: 380,
      y: 80,
      facts: [
        { label: 'income', value: '−35%' },
        { label: 'load', value: '−55%' }
      ],
      affects: ['v1', 'v3']
    },
    {
      id: 'o2',
      kind: 'option',
      label: 'Subcontract execution',
      detail: 'Stay client-facing, delegate delivery work.',
      origin: 'inferred',
      polarity: 'warning',
      x: 380,
      y: 230,
      facts: [
        { label: 'margin', value: '−40%' },
        { label: 'risk', value: 'quality' }
      ],
      affects: ['v3', 'u2']
    },
    {
      id: 'o3',
      kind: 'option',
      label: 'Reduce course load',
      detail: 'Drop to part-time enrolment, extend graduation by 1 term.',
      origin: 'inferred',
      polarity: 'negative',
      x: 380,
      y: 380,
      facts: [
        { label: 'graduation', value: '+1 sem' },
        { label: 'aid', value: 'at risk' }
      ],
      affects: ['g2', 'c2', 'v2']
    },
    {
      id: 'v1',
      kind: 'input',
      label: 'College workload',
      detail: 'Estimated weekly hours spent on classes, labs, and assignments.',
      origin: 'user',
      confidence: 'high',
      range: { min: 10, max: 70, value: 38, unit: 'hrs/wk' },
      x: 680,
      y: 80,
      facts: [{ label: 'type', value: 'User Input' }],
      affects: ['v2', 'v3', 'u1']
    },
    {
      id: 'v2',
      kind: 'computed',
      label: 'Available time',
      detail: 'Derived flexible time remaining for client engagements.',
      origin: 'inferred',
      computedFormula: '168 - College Workload - Sleep',
      range: { min: 5, max: 50, value: 24, unit: 'hrs/wk' },
      x: 990,
      y: 80,
      facts: [{ label: 'derived', value: 'Dynamic' }],
      affects: ['v3', 'g2']
    },
    {
      id: 'v3',
      kind: 'computed',
      label: 'Contractor workload capacity',
      detail: 'Maximum concurrent client engagements supported.',
      origin: 'inferred',
      range: { min: 0, max: 8, value: 3, unit: 'clients', step: 1 },
      x: 990,
      y: 240,
      facts: [{ label: 'overhead', value: '~3 hrs each' }],
      affects: ['v5']
    },
    {
      id: 'v4',
      kind: 'variable',
      label: 'Recovery time',
      detail: 'Unscheduled hours per week for rest and buffer.',
      origin: 'inferred',
      confidence: 'low',
      range: { min: 0, max: 30, value: 6, unit: 'hrs/wk' },
      x: 680,
      y: 380,
      affects: ['g3']
    },
    {
      id: 'v5',
      kind: 'impact',
      label: 'Career progress & project completion',
      detail: 'Project delivery reliability and long-term trajectory.',
      origin: 'inferred',
      range: { min: 15, max: 200, value: 85, unit: 'score' },
      x: 1320,
      y: 560,
      affects: ['g1']
    },
    {
      id: 'c1',
      kind: 'constraint',
      label: 'Attendance requirement',
      detail: 'Studio and lab sessions cannot be rescheduled.',
      origin: 'inferred',
      polarity: 'negative',
      x: 680,
      y: 230,
      facts: [{ label: 'hard limit', value: 'true' }],
      affects: ['v1']
    },
    {
      id: 'u1',
      kind: 'unknown',
      label: 'Hours lost to context switching',
      detail: 'Unmeasured penalty when toggling between study and client work.',
      origin: 'unknown',
      x: 680,
      y: 530,
      facts: [{ label: 'estimate', value: '4–12 hrs/wk' }],
      affects: ['v1']
    },
    {
      id: 'a1',
      kind: 'assumption',
      label: 'College load is fixed this term',
      detail: 'Treated as immovable until add/drop date.',
      origin: 'inferred',
      confidence: 'medium',
      x: 380,
      y: 530,
      facts: [{ label: 'revisit', value: 'add/drop date' }],
      affects: ['v2']
    }
  ],
  consequences: [
    {
      id: 'k1',
      label: 'Delivery quality recovers before income does',
      detail: 'Cutting clients frees hours immediately; revenue stabilizes over 2–3 months.',
      polarity: 'positive',
      driver: 'v3'
    }
  ]
};

export const exampleDecisions: DecisionModel[] = [contractorDecision];
export const examplePrompts = exampleDecisions.map((d) => ({
  label: d.title,
  prompt: d.prompt
}));
