import { useMemo } from 'react';
import { DownloadIcon, FileTextIcon, PrinterIcon } from 'lucide-react';
import { DecisionModel, ModelEdge, ModelItem } from '../../types/decision';
import { auditAssumptions, computeSensitivity, formatDelta } from '../../utils/decisionEngine';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

interface ReportModalProps {
  open: boolean;
  model: DecisionModel;
  items: ModelItem[];
  edges: ModelEdge[];
  onClose: () => void;
  onExportJSON: () => void;
}

export function ReportModal({
  open,
  model,
  items,
  edges,
  onClose,
  onExportJSON
}: ReportModalProps) {
  const unknowns = items.filter((i) => i.kind === 'unknown' || i.origin === 'unknown');
  const assumptions = items.filter((i) => i.kind === 'assumption');
  const goals = items.filter((i) => i.kind === 'goal');
  const constraints = items.filter((i) => i.kind === 'constraint');

  // Both analyses are pure functions of the current model — no AI, fully deterministic.
  const sensitivity = useMemo(() => computeSensitivity(model), [model]);
  const audit = useMemo(() => auditAssumptions(model), [model]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="DecisionOS Analytical Executive Report"
      description="Formal synthesis of the decision dependency model, variable sensitivities, and unresolved unknowns."
      footer={
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => window.print()}>
            <PrinterIcon className="h-3.5 w-3.5 mr-1" /> Print Report
          </Button>
          <Button size="sm" variant="primary" onClick={onExportJSON}>
            <DownloadIcon className="h-3.5 w-3.5 mr-1" /> Export JSON
          </Button>
        </div>
      }
    >
      <div className="space-y-6 select-text">
        {/* Title & Prompt Header */}
        <div className="border-b border-line pb-4 space-y-2">
          <div className="flex items-center gap-2 font-mono text-2xs uppercase tracking-wider text-accent font-semibold">
            <FileTextIcon className="h-3.5 w-3.5" /> Decision Brief
            {model.source === 'demo' ? (
              <Badge tone="warning" mono>demo</Badge>
            ) : (
              <Badge tone="accent" mono>ai-generated</Badge>
            )}
          </div>
          <h2 className="text-xl font-bold text-fg">{model.title}</h2>
          <p className="border-l-2 border-accent pl-3 text-[13.5px] italic text-fg-muted">
            “{model.prompt}”
          </p>
        </div>

        {/* Executive Summary */}
        <div className="space-y-2">
          <h3 className="font-mono text-2xs uppercase tracking-wider text-fg-muted font-semibold">
            Executive Summary
          </h3>
          <p className="text-[13.5px] leading-relaxed text-fg-secondary bg-surface p-3.5 rounded-xl border border-line">
            {model.summary}
          </p>
        </div>

        {/* Structural Metrics */}
        <div className="grid grid-cols-4 gap-2 text-center font-mono text-2xs">
          <div className="rounded-lg border border-line bg-bg p-2.5">
            <span className="block text-lg font-bold text-fg">{items.length}</span>
            <span className="text-fg-muted">Nodes</span>
          </div>
          <div className="rounded-lg border border-line bg-bg p-2.5">
            <span className="block text-lg font-bold text-accent">{edges.length}</span>
            <span className="text-fg-muted">Edges</span>
          </div>
          <div className="rounded-lg border border-line bg-bg p-2.5">
            <span className="block text-lg font-bold text-amber-400">{unknowns.length}</span>
            <span className="text-fg-muted">Unknowns</span>
          </div>
          <div className="rounded-lg border border-line bg-bg p-2.5">
            <span className="block text-lg font-bold text-indigo-300">{assumptions.length}</span>
            <span className="text-fg-muted">Assumptions</span>
          </div>
        </div>

        {/* Goals & Constraints */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-line bg-bg p-3.5 space-y-2">
            <h4 className="font-mono text-2xs uppercase tracking-wider text-emerald-400 font-semibold">
              Primary Goals ({goals.length})
            </h4>
            <ul className="space-y-1.5 text-2xs text-fg">
              {goals.map((g) => (
                <li key={g.id} className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{g.label}</span>
                </li>
              ))}
              {goals.length === 0 && <li className="text-fg-muted">None identified.</li>}
            </ul>
          </div>

          <div className="rounded-xl border border-line bg-bg p-3.5 space-y-2">
            <h4 className="font-mono text-2xs uppercase tracking-wider text-red-400 font-semibold">
              Binding Constraints ({constraints.length})
            </h4>
            <ul className="space-y-1.5 text-2xs text-fg">
              {constraints.map((c) => (
                <li key={c.id} className="flex items-start gap-1.5">
                  <span className="text-red-400 font-bold">•</span>
                  <span>{c.label}</span>
                </li>
              ))}
              {constraints.length === 0 && <li className="text-fg-muted">None identified.</li>}
            </ul>
          </div>
        </div>

        {/* Sensitivity Analysis */}
        {sensitivity.length > 0 && (
          <div className="rounded-xl border border-line bg-bg p-3.5 space-y-3">
            <div>
              <h4 className="font-mono text-2xs uppercase tracking-wider text-accent font-semibold">
                Sensitivity Analysis
              </h4>
              <p className="mt-1 text-2xs text-fg-muted leading-relaxed">
                Each editable variable moved ±10% of its range; the effect on goals and impacts is computed
                deterministically from the relationship graph. Ranked by leverage.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-2xs">
                <thead>
                  <tr className="border-b border-line text-fg-muted">
                    <th className="px-2 py-2 font-semibold">Variable</th>
                    <th className="px-2 py-2 font-semibold">Downstream effect (±10% move)</th>
                    <th className="px-2 py-2 text-right font-semibold">Leverage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {sensitivity.slice(0, 8).map((row) => {
                    const parts = row.targets
                      .filter((t) => Math.abs(t.deltaAtPlus) > 0.001 || Math.abs(t.deltaAtMinus) > 0.001)
                      .map((t) => `${t.label} ${formatDelta(t.deltaAtPlus)} / ${formatDelta(t.deltaAtMinus)}`);
                    return (
                      <tr key={row.variableId} className="hover:bg-surface/30">
                        <td className="px-2 py-2 font-medium text-fg">
                          {row.variableLabel}
                          <span className="ml-1.5 text-fg-muted">{row.unit}</span>
                        </td>
                        <td className="px-2 py-2 text-fg-secondary">
                          {parts.length > 0 ? parts.join(' · ') : 'no measurable downstream effect'}
                        </td>
                        <td className="px-2 py-2 text-right">
                          <span
                            className={cn(
                              'font-semibold',
                              row.leverage > 0.15 ? 'text-amber-400' : row.leverage > 0.05 ? 'text-accent' : 'text-fg-muted'
                            )}>
                            {formatDelta(row.leverage).replace('±', '')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Assumption Audit */}
        {audit.length > 0 && (
          <div className="rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-3.5 space-y-3">
            <div>
              <h4 className="font-mono text-2xs uppercase tracking-wider text-amber-400 font-semibold">
                Assumption & Unknown Audit
              </h4>
              <p className="mt-1 text-2xs text-fg-muted leading-relaxed">
                What the model currently accepts without proof, ranked by how much of the model sits downstream of it.
              </p>
            </div>
            <div className="space-y-2">
              {audit.slice(0, 8).map((row) => (
                <div key={row.id} className="flex items-start justify-between gap-3 border-b border-line/40 pb-2 last:border-b-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-fg">{row.label}</span>
                      <Badge
                        tone={row.criticality === 'critical' ? 'negative' : row.criticality === 'moderate' ? 'warning' : 'neutral'}
                        mono>
                        {row.criticality}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-2xs text-fg-muted">{row.detail}</p>
                  </div>
                  <span className="shrink-0 font-mono text-2xs text-fg-muted">
                    {row.goalsAffected.length} goal{row.goalsAffected.length === 1 ? '' : 's'} · {row.downstreamCount} downstream
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Information Gaps */}
        {unknowns.length > 0 && (
          <div className="rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-3.5 space-y-2">
            <h4 className="font-mono text-2xs uppercase tracking-wider text-amber-400 font-semibold">
              Key Information Gaps (Unknowns)
            </h4>
            <div className="space-y-1.5 text-2xs text-fg">
              {unknowns.map((uk) => (
                <div key={uk.id} className="flex items-center justify-between border-b border-line/40 pb-1 last:border-b-0">
                  <span className="font-medium text-fg">{uk.label}</span>
                  <span className="font-mono text-fg-muted">{uk.detail}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scenario snapshot */}
        {(model.scenarios?.length ?? 0) > 0 && (
          <div className="rounded-xl border border-line bg-bg p-3.5 space-y-2">
            <h4 className="font-mono text-2xs uppercase tracking-wider text-fg-muted font-semibold">
              Scenario Snapshots ({model.scenarios!.length})
            </h4>
            <ul className="space-y-1 text-2xs text-fg-secondary">
              {model.scenarios!.map((s) => (
                <li key={s.id} className="flex items-baseline justify-between gap-3">
                  <span className="font-medium text-fg">{s.title}</span>
                  <span className="truncate text-fg-muted">{s.description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}
