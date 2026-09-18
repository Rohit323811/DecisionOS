import {
  DownloadIcon,
  FileTextIcon,
  HelpCircleIcon,
  LayersIcon,
  LockIcon,
  PrinterIcon,
  RotateCcwIcon,
  ShieldAlertIcon,
  SlidersIcon,
  TargetIcon
} from 'lucide-react';
import { ModelEdge, ModelItem, Scenario } from '../../types/decision';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface ReportModalProps {
  open: boolean;
  title: string;
  prompt: string;
  summary: string;
  items: ModelItem[];
  edges?: ModelEdge[];
  scenarios?: Scenario[];
  activeScenarioTitle?: string;
  onClose: () => void;
  onEditModel?: () => void;
  onCompareScenarios?: () => void;
  onRunStressTest?: () => void;
  onExportJSON: () => void;
  onSaveDecision?: () => void;
}

export function ReportModal({
  open,
  title,
  prompt,
  summary,
  items,
  edges = [],
  activeScenarioTitle = 'Current situation',
  onClose,
  onEditModel,
  onCompareScenarios,
  onRunStressTest,
  onExportJSON,
  onSaveDecision
}: ReportModalProps) {
  const goals = items.filter((i) => i.kind === 'goal');
  const options = items.filter((i) => i.kind === 'option');
  const variables = items.filter((i) => i.kind === 'variable' || i.kind === 'input' || i.kind === 'computed');
  const constraints = items.filter((i) => i.kind === 'constraint');
  const unknowns = items.filter((i) => i.kind === 'unknown' || i.origin === 'unknown');
  const assumptions = items.filter((i) => i.kind === 'assumption');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="DecisionOS Final Analytical Brief"
      description="Objective structural summary. Formulated strictly in terms of modeled trade-offs and propagation logic."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2 w-full pt-2">
          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-2xs">
            {onEditModel && (
              <Button size="sm" variant="secondary" onClick={onEditModel}>
                <RotateCcwIcon className="h-3.5 w-3.5 mr-1" /> Edit Model
              </Button>
            )}
            {onCompareScenarios && (
              <Button size="sm" variant="secondary" onClick={onCompareScenarios}>
                <LayersIcon className="h-3.5 w-3.5 mr-1" /> Compare Scenarios
              </Button>
            )}
            {onRunStressTest && (
              <Button size="sm" variant="secondary" onClick={onRunStressTest}>
                <ShieldAlertIcon className="h-3.5 w-3.5 mr-1" /> Stress Test
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => window.print()}>
              <PrinterIcon className="h-3.5 w-3.5 mr-1" /> Print
            </Button>
            <Button size="sm" variant="primary" onClick={onExportJSON}>
              <DownloadIcon className="h-3.5 w-3.5 mr-1" /> Export JSON
            </Button>
            {onSaveDecision && (
              <Button size="sm" variant="primary" onClick={onSaveDecision}>
                Save Decision
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6 select-text text-fg font-sans">
        {/* 1. Decision Title & Prompt */}
        <div className="border-b border-line pb-4 space-y-2">
          <div className="flex items-center gap-2 font-mono text-2xs uppercase tracking-wider text-accent font-semibold">
            <FileTextIcon className="h-3.5 w-3.5" /> Analytical Brief
          </div>
          <h2 className="text-xl font-bold text-fg">{title}</h2>
          <p className="border-l-2 border-accent pl-3 text-[13.5px] italic text-fg-muted">
            “{prompt}”
          </p>
          <p className="text-2xs font-mono text-fg-muted">
            Active Scenario: <span className="text-accent font-semibold">{activeScenarioTitle}</span>
          </p>
        </div>

        {/* Analytical Model Summary */}
        <div className="rounded-xl border border-line bg-surface p-4 space-y-2">
          <h3 className="font-mono text-2xs uppercase tracking-wider text-accent font-semibold">
            Executive Model Brief
          </h3>
          <p className="text-[13.5px] leading-relaxed text-fg-secondary">
            {summary}
          </p>
        </div>

        {/* 2. Goals */}
        <div className="space-y-2">
          <h3 className="font-mono text-2xs uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
            <TargetIcon className="h-3.5 w-3.5" /> Modeled Goals ({goals.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {goals.map((g) => (
              <div key={g.id} className="rounded-lg border border-line bg-bg p-3 text-2xs space-y-1">
                <span className="font-semibold text-fg block">{g.label}</span>
                <p className="text-fg-muted">{g.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Options */}
        <div className="space-y-2">
          <h3 className="font-mono text-2xs uppercase tracking-wider text-cyan-400 font-semibold flex items-center gap-1.5">
            <LayersIcon className="h-3.5 w-3.5" /> Evaluated Options ({options.length})
          </h3>
          <div className="space-y-2">
            {options.map((o) => (
              <div key={o.id} className="rounded-lg border border-line bg-bg p-3 text-2xs space-y-1">
                <span className="font-semibold text-fg block">{o.label}</span>
                <p className="text-fg-muted">{o.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Key Variables & 5. Constraints */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-mono text-2xs uppercase tracking-wider text-fg-muted font-semibold flex items-center gap-1.5">
              <SlidersIcon className="h-3.5 w-3.5 text-accent" /> Key Variables ({variables.length})
            </h3>
            <div className="space-y-1.5 text-2xs">
              {variables.map((v) => (
                <div key={v.id} className="rounded border border-line bg-bg p-2 flex items-center justify-between">
                  <span className="font-medium text-fg">{v.label}</span>
                  <span className="font-mono text-accent">
                    {v.range ? `${v.range.value} ${v.range.unit}` : String(v.value ?? 'Variable')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-mono text-2xs uppercase tracking-wider text-red-400 font-semibold flex items-center gap-1.5">
              <LockIcon className="h-3.5 w-3.5" /> Constraints ({constraints.length})
            </h3>
            <div className="space-y-1.5 text-2xs">
              {constraints.map((c) => (
                <div key={c.id} className="rounded border border-line bg-bg p-2 space-y-0.5">
                  <span className="font-medium text-red-400 block">• {c.label}</span>
                  <p className="text-fg-muted">{c.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 6. Major Dependencies */}
        <div className="space-y-2">
          <h3 className="font-mono text-2xs uppercase tracking-wider text-accent font-semibold">
            Major Model Dependencies ({edges.length})
          </h3>
          <div className="rounded-xl border border-line bg-bg p-3.5 space-y-2 text-2xs font-mono">
            {edges.map((e) => {
              const from = items.find((i) => i.id === e.from);
              const to = items.find((i) => i.id === e.to);
              return (
                <div key={e.id} className="border-b border-line/40 pb-1.5 last:border-b-0">
                  <span className="text-fg font-semibold">{from?.label || 'Node'}</span>
                  <span className="text-accent mx-2">→</span>
                  <span className="text-fg font-semibold">{to?.label || 'Node'}</span>
                  <p className="text-fg-muted font-sans text-2xs mt-0.5">
                    "{e.explanation || `Under this model, changing ${from?.label} directly affects ${to?.label}.`}"
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 7. Scenario Differences & 8. Stress Test Findings */}
        <div className="rounded-xl border border-line bg-surface p-4 space-y-3">
          <h3 className="font-mono text-2xs uppercase tracking-wider text-amber-400 font-semibold">
            Scenario Differences & Stress-Test Findings
          </h3>
          <p className="text-2xs text-fg-secondary leading-relaxed">
            Comparing scenario parameters indicates that reducing course load frees capacity for client commitments without increasing burnout risk, whereas maintaining high course load shifts the bottleneck to project delivery lead time.
          </p>
        </div>

        {/* 9. Unknowns & 10. Assumptions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-3.5 space-y-2">
            <h4 className="font-mono text-2xs uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1">
              <HelpCircleIcon className="h-3.5 w-3.5" /> Unknowns ({unknowns.length})
            </h4>
            <div className="space-y-1 text-2xs text-fg">
              {unknowns.map((uk) => (
                <div key={uk.id} className="border-b border-line/40 pb-1 last:border-b-0">
                  <span className="font-medium text-amber-300 block">{uk.label}</span>
                  <span className="text-fg-muted text-2xs">{uk.detail}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-line bg-bg p-3.5 space-y-2">
            <h4 className="font-mono text-2xs uppercase tracking-wider text-indigo-300 font-semibold">
              Model Assumptions ({assumptions.length})
            </h4>
            <div className="space-y-1 text-2xs text-fg">
              {assumptions.map((a) => (
                <div key={a.id} className="border-b border-line/40 pb-1 last:border-b-0">
                  <span className="font-medium text-indigo-300 block">{a.label}</span>
                  <span className="text-fg-muted text-2xs">{a.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 11. Modeled Consequences & 12. What to Investigate Next */}
        <div className="rounded-xl border border-line bg-bg p-4 space-y-3">
          <h3 className="font-mono text-2xs uppercase tracking-wider text-fg font-semibold">
            What to Investigate Next
          </h3>
          <ul className="space-y-1.5 text-2xs text-fg-secondary list-disc pl-4">
            <li>Quantify actual hours lost to context switching through a 1-week time audit.</li>
            <li>Confirm client flexibility regarding extended lead times prior to altering retainer scopes.</li>
            <li>Verify financial aid credit thresholds before adjusting enrolment status.</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
}
