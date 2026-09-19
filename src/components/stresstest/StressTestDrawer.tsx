import { useMemo, useState } from 'react';
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  RotateCcwIcon,
  ShieldAlertIcon,
  SlidersIcon,
  XIcon
} from 'lucide-react';
import { ModelEdge, ModelItem } from '../../types/decision';
import { formatDelta } from '../../utils/decisionEngine';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

interface StressTestDrawerProps {
  open: boolean;
  items: ModelItem[];
  edges: ModelEdge[];
  /** Live propagation deltas from the context — drives the impact cards. */
  propagationDeltas?: Record<string, number>;
  onClose: () => void;
  onApplyShock: (id: string, newVal: number | boolean) => void;
}

export function StressTestDrawer({
  open,
  items,
  propagationDeltas = {},
  onClose,
  onApplyShock
}: StressTestDrawerProps) {
  // Hooks must run unconditionally — no early return above this line.
  const [shocks, setShocks] = useState<Record<string, number>>({});

  // Filter assumptions, constraints, and numerical inputs dynamically from model
  const keyInputs = useMemo(() => {
    return items.filter(
      (i) => i.kind === 'assumption' || i.kind === 'constraint' || i.kind === 'variable' || i.kind === 'input'
    );
  }, [items]);

  const handleShockChange = (id: string, deltaPercent: number) => {
    setShocks((prev) => ({ ...prev, [id]: deltaPercent }));
    const item = items.find((i) => i.id === id);
    if (item && item.range) {
      const base = item.range.value;
      const shockedVal = Math.round(base * (1 + deltaPercent / 100));
      onApplyShock(id, shockedVal);
    }
  };

  const handleResetShocks = () => {
    setShocks({});
  };

  // Evaluate model resilience based on active shocks
  const activeShockCount = Object.values(shocks).filter((v) => v !== 0).length;

  const impactedGoals = useMemo(() => {
    return items.filter((i) => i.kind === 'goal');
  }, [items]);

  const impactedConstraints = useMemo(() => {
    return items.filter((i) => i.kind === 'constraint');
  }, [items]);

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col border-l border-line bg-surface/98 shadow-2xl backdrop-blur-xl select-none">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-line px-5 shrink-0 bg-[#1e1710]/40">
        <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-wider font-semibold">
          <ShieldAlertIcon className="h-4 w-4" /> Stress Testing Engine
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded text-fg-muted hover:bg-line hover:text-fg transition-colors"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Intro banner */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
          <h3 className="text-[14px] font-semibold text-amber-300">
            "What happens if a key assumption changes?"
          </h3>
          <p className="text-2xs text-fg-muted leading-relaxed">
            Simulate dynamic market shocks, load spikes, or constraint breaches. The model recalculates downstream impacts immediately — locally, with no AI calls.
          </p>
        </div>

        {/* Dynamic Model Variables & Assumptions to Stress Test */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <span className="font-mono text-2xs uppercase tracking-wider text-fg font-semibold flex items-center gap-1.5">
              <SlidersIcon className="h-3.5 w-3.5 text-amber-400" /> Shock Modifiers
            </span>
            {activeShockCount > 0 && (
              <button
                onClick={handleResetShocks}
                className="font-mono text-2xs text-amber-400 flex items-center gap-1 hover:underline"
              >
                <RotateCcwIcon className="h-3 w-3" /> Reset Shocks
              </button>
            )}
          </div>

          <div className="space-y-3">
            {keyInputs.map((item) => {
              const currentShock = shocks[item.id] || 0;
              const editable = Boolean(item.range);
              return (
                <div key={item.id} className="rounded-xl border border-line bg-bg p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[13px] text-fg truncate max-w-[220px]">
                      {item.label}
                    </span>
                    <Badge tone={item.kind === 'constraint' ? 'negative' : 'warning'} mono>
                      {item.kind}
                    </Badge>
                  </div>

                  <p className="text-2xs text-fg-muted line-clamp-1">{item.detail}</p>

                  {editable ? (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between font-mono text-2xs">
                        <span className="text-fg-muted">Simulated Shock</span>
                        <span className={cn('font-semibold', currentShock > 0 ? 'text-red-400' : currentShock < 0 ? 'text-emerald-400' : 'text-fg')}>
                          {currentShock > 0 ? `+${currentShock}%` : `${currentShock}%`}
                        </span>
                      </div>

                      <input
                        type="range"
                        min={-50}
                        max={100}
                        step={5}
                        value={currentShock}
                        onChange={(e) => handleShockChange(item.id, Number(e.target.value))}
                        className="w-full accent-amber-400 bg-line h-1.5 rounded-lg cursor-pointer"
                      />
                      <div className="flex justify-between font-mono text-2xs text-fg-muted">
                        <span>{item.range!.min} {item.range!.unit}</span>
                        <span>{item.range!.max} {item.range!.unit}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="rounded-md border border-dashed border-line px-2.5 py-1.5 font-mono text-2xs text-fg-muted">
                      qualitative — has no numeric value to shock
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Impact Analysis Report */}
        <div className="space-y-3">
          <span className="font-mono text-2xs uppercase tracking-wider text-fg font-semibold border-b border-line pb-2 block">
            Impact Analysis & Constraint Risk
          </span>

          <div className="space-y-2">
            {impactedGoals.map((goal) => {
              const delta = propagationDeltas[goal.id];
              return (
                <div
                  key={goal.id}
                  className={cn(
                    'flex items-center justify-between rounded-lg border p-3 font-mono text-2xs',
                    delta && Math.abs(delta) > 0.001
                      ? 'border-amber-500/30 bg-amber-500/5 text-amber-300'
                      : activeShockCount > 0
                        ? 'border-amber-500/30 bg-amber-500/5 text-amber-300'
                        : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {delta && Math.abs(delta) > 0.001 ? (
                      <AlertTriangleIcon className="h-4 w-4 shrink-0 text-amber-400" />
                    ) : (
                      <CheckCircle2Icon className="h-4 w-4 shrink-0 text-emerald-400" />
                    )}
                    <span className="truncate font-medium">{goal.label}</span>
                  </div>
                  <span className="shrink-0 font-semibold">
                    {delta && Math.abs(delta) > 0.001 ? formatDelta(delta) : activeShockCount > 0 ? 'At Risk' : 'Satisfied'}
                  </span>
                </div>
              );
            })}

            {impactedConstraints.map((cnst) => (
              <div
                key={cnst.id}
                className="flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/5 p-3 font-mono text-2xs text-red-400"
              >
                <span className="truncate font-medium">{cnst.label}</span>
                <span className="shrink-0 font-semibold">
                  {activeShockCount > 0 ? 'Threshold Breached' : 'Binding Limit'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-line p-4 bg-bg shrink-0">
        <button
          onClick={onClose}
          className="w-full rounded-lg bg-amber-500 py-2.5 font-mono text-2xs font-semibold text-black hover:bg-amber-400 transition-colors"
        >
          Close Stress Test
        </button>
      </div>
    </div>
  );
}

export default StressTestDrawer;
