import { useMemo, useState } from 'react';
import {
  AlertTriangleIcon,
  ArrowDownIcon,
  CheckCircle2Icon,
  RotateCcwIcon,
  ShieldAlertIcon,
  SlidersIcon,
  XIcon
} from 'lucide-react';
import { ModelEdge, ModelItem } from '../../types/decision';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

interface StressTestDrawerProps {
  open: boolean;
  items: ModelItem[];
  edges?: ModelEdge[];
  onClose: () => void;
  onApplyShock: (id: string, newVal: number | boolean) => void;
  onApplyToScenario?: (title: string) => void;
}

export function StressTestDrawer({
  open,
  items,
  edges = [],
  onClose,
  onApplyShock,
  onApplyToScenario
}: StressTestDrawerProps) {
  if (!open) return null;

  // Dynamically identify meaningful quantitative variables and assumptions from model
  const testableInputs = useMemo(() => {
    return items.filter(
      (i) => i.range || i.kind === 'variable' || i.kind === 'input' || i.kind === 'assumption' || i.kind === 'constraint'
    );
  }, [items]);

  const [selectedVarId, setSelectedVarId] = useState<string>(testableInputs[0]?.id || items[0]?.id || '');
  const [percentChange, setPercentChange] = useState<number>(-20);

  const selectedItem = useMemo(() => items.find((i) => i.id === selectedVarId) || items[0], [items, selectedVarId]);

  // Calculate before and after values
  const baseValue = selectedItem?.range?.value ?? (typeof selectedItem?.value === 'number' ? selectedItem.value : 100);
  const unit = selectedItem?.range?.unit || '';
  const afterValue = Math.round(baseValue * (1 + percentChange / 100));

  // Trace propagation chain through edges
  const affectedDependencies = useMemo(() => {
    if (!selectedItem) return [];
    const directChildIds = edges.filter((e) => e.from === selectedItem.id).map((e) => e.to);
    return items.filter((i) => directChildIds.includes(i.id) || selectedItem.affects?.includes(i.id));
  }, [items, edges, selectedItem]);

  const downstreamConsequences = useMemo(() => {
    const parentIds = affectedDependencies.map((d) => d.id);
    const grandchildIds = edges.filter((e) => parentIds.includes(e.from)).map((e) => e.to);
    return items.filter(
      (i) => (grandchildIds.includes(i.id) || i.kind === 'goal' || i.kind === 'constraint' || i.kind === 'impact') && i.id !== selectedItem?.id
    );
  }, [items, edges, affectedDependencies, selectedItem]);

  const handleReset = () => {
    setPercentChange(0);
    if (selectedItem) {
      onApplyShock(selectedItem.id, baseValue);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[460px] flex-col border-l border-line bg-surface/98 shadow-2xl backdrop-blur-xl select-none">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-line px-5 shrink-0 bg-[#1e1710]/40">
        <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-wider font-semibold">
          <ShieldAlertIcon className="h-4 w-4" /> Dynamic Stress Test Engine
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded text-fg-muted hover:bg-line hover:text-fg transition-colors"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Domain-Agnostic Question Banner */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-1.5">
          <h3 className="text-[14px] font-semibold text-amber-300">
            What happens if {selectedItem?.label || 'variable'} changes by {percentChange > 0 ? `+${percentChange}%` : `${percentChange}%`}?
          </h3>
          <p className="text-2xs text-fg-muted leading-relaxed">
            Stress testing propagates parameter changes through the model's dependency graph.
          </p>
        </div>

        {/* Variable Selector & Slider Controls */}
        <div className="rounded-xl border border-line bg-bg p-4 space-y-4">
          <div className="space-y-1">
            <label className="font-mono text-2xs uppercase tracking-wider text-fg-muted font-semibold flex items-center gap-1.5">
              <SlidersIcon className="h-3.5 w-3.5 text-amber-400" /> Target Variable / Assumption
            </label>
            <select
              value={selectedVarId}
              onChange={(e) => {
                setSelectedVarId(e.target.value);
                setPercentChange(-20);
              }}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 font-mono text-2xs text-fg focus:border-amber-400 focus:outline-none"
            >
              {testableInputs.map((item) => (
                <option key={item.id} value={item.id}>
                  [{item.kind.toUpperCase()}] {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* Slider & Percentage Change Controls */}
          <div className="space-y-2 pt-1 border-t border-line">
            <div className="flex justify-between font-mono text-2xs">
              <span className="text-fg-muted">Simulated Percentage Shift</span>
              <span className={cn('font-semibold', percentChange > 0 ? 'text-red-400' : percentChange < 0 ? 'text-amber-400' : 'text-fg')}>
                {percentChange > 0 ? `+${percentChange}%` : `${percentChange}%`}
              </span>
            </div>

            <input
              type="range"
              min={-80}
              max={100}
              step={5}
              value={percentChange}
              onChange={(e) => {
                const pc = Number(e.target.value);
                setPercentChange(pc);
                const newVal = Math.round(baseValue * (1 + pc / 100));
                if (selectedItem) onApplyShock(selectedItem.id, newVal);
              }}
              className="w-full accent-amber-400 bg-line h-1.5 rounded-lg cursor-pointer"
            />

            {/* Before / After Comparison Display */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="rounded-lg border border-line bg-surface p-2.5 text-center font-mono text-2xs">
                <span className="block text-fg-muted">Before Value</span>
                <span className="text-sm font-semibold text-fg">
                  {baseValue} {unit}
                </span>
              </div>
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-center font-mono text-2xs">
                <span className="block text-amber-300">After Value</span>
                <span className="text-sm font-semibold text-amber-400">
                  {afterValue} {unit}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={handleReset}
              className="font-mono text-2xs text-fg-muted flex items-center gap-1 hover:text-fg transition-colors"
            >
              <RotateCcwIcon className="h-3 w-3" /> Reset Parameter
            </button>
          </div>
        </div>

        {/* VISUAL PROPAGATION CHAIN: Before ↓ Changed variable ↓ Affected dependencies ↓ Changed consequences */}
        <div className="space-y-3">
          <span className="font-mono text-2xs uppercase tracking-wider text-fg font-semibold block border-b border-line pb-1.5">
            Model Propagation Chain
          </span>

          <div className="space-y-2 font-mono text-2xs">
            {/* 1. Before State */}
            <div className="rounded-lg border border-line bg-surface p-3">
              <span className="text-fg-muted uppercase block text-2xs">1. Baseline Parameter</span>
              <span className="font-semibold text-fg">{selectedItem?.label}: {baseValue} {unit}</span>
            </div>

            <div className="flex justify-center text-amber-400">
              <ArrowDownIcon className="h-4 w-4 animate-bounce" />
            </div>

            {/* 2. Changed Variable */}
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-amber-300">
              <span className="uppercase block text-2xs">2. Applied Shock Parameter</span>
              <span className="font-semibold">{selectedItem?.label} shifted to {afterValue} {unit} ({percentChange > 0 ? `+${percentChange}%` : `${percentChange}%`})</span>
            </div>

            <div className="flex justify-center text-amber-400">
              <ArrowDownIcon className="h-4 w-4 animate-bounce" />
            </div>

            {/* 3. Affected Dependencies */}
            <div className="rounded-lg border border-line bg-surface p-3 space-y-1.5">
              <span className="text-fg-muted uppercase block text-2xs">3. Direct Affected Dependencies ({affectedDependencies.length})</span>
              {affectedDependencies.length === 0 ? (
                <p className="text-fg-muted italic">No direct child variables affected.</p>
              ) : (
                <div className="space-y-1">
                  {affectedDependencies.map((dep) => (
                    <div key={dep.id} className="flex items-center justify-between text-fg">
                      <span>• {dep.label}</span>
                      <Badge tone="accent" mono>Adjusting</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-center text-amber-400">
              <ArrowDownIcon className="h-4 w-4 animate-bounce" />
            </div>

            {/* 4. Downstream Consequences & Goal Impacts */}
            <div className="rounded-lg border border-line bg-surface p-3 space-y-1.5">
              <span className="text-fg-muted uppercase block text-2xs">4. Downstream Consequence Impacts ({downstreamConsequences.length})</span>
              <div className="space-y-1">
                {downstreamConsequences.map((cons) => (
                  <div key={cons.id} className="flex items-center justify-between text-amber-400 font-semibold">
                    <span className="flex items-center gap-1">
                      {cons.kind === 'constraint' ? <AlertTriangleIcon className="h-3 w-3 text-red-400" /> : <CheckCircle2Icon className="h-3 w-3 text-emerald-400" />}
                      {cons.label}
                    </span>
                    <span className="text-fg-muted font-normal">[{cons.kind}]</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-line p-4 bg-bg shrink-0 flex items-center justify-between gap-2">
        <button
          onClick={handleReset}
          className="rounded-lg border border-line bg-surface px-3 py-2 font-mono text-2xs text-fg-secondary hover:text-fg"
        >
          Reset
        </button>
        <button
          onClick={() => {
            if (onApplyToScenario && selectedItem) {
              onApplyToScenario(`Stress scenario (${selectedItem.label} ${percentChange}%)`);
            }
            onClose();
          }}
          className="flex-1 rounded-lg bg-amber-500 py-2 font-mono text-2xs font-semibold text-black hover:bg-amber-400 transition-colors"
        >
          Save as New Scenario State
        </button>
      </div>
    </div>
  );
}
