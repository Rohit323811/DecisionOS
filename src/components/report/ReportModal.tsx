import { DownloadIcon, FileTextIcon, PrinterIcon } from 'lucide-react';
import { ModelEdge, ModelItem } from '../../types/decision';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface ReportModalProps {
  open: boolean;
  title: string;
  prompt: string;
  summary: string;
  items: ModelItem[];
  edges: ModelEdge[];
  onClose: () => void;
  onExportJSON: () => void;
}

export function ReportModal({
  open,
  title,
  prompt,
  summary,
  items,
  edges,
  onClose,
  onExportJSON
}: ReportModalProps) {
  const unknowns = items.filter((i) => i.kind === 'unknown' || i.origin === 'unknown');
  const assumptions = items.filter((i) => i.kind === 'assumption');
  const goals = items.filter((i) => i.kind === 'goal');
  const constraints = items.filter((i) => i.kind === 'constraint');

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
          </div>
          <h2 className="text-xl font-bold text-fg">{title}</h2>
          <p className="border-l-2 border-accent pl-3 text-[13.5px] italic text-fg-muted">
            “{prompt}”
          </p>
        </div>

        {/* Executive Summary */}
        <div className="space-y-2">
          <h3 className="font-mono text-2xs uppercase tracking-wider text-fg-muted font-semibold">
            Executive Summary
          </h3>
          <p className="text-[13.5px] leading-relaxed text-fg-secondary bg-surface p-3.5 rounded-xl border border-line">
            {summary}
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
            </ul>
          </div>
        </div>

        {/* Critical Path Unknowns */}
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
      </div>
    </Modal>
  );
}
