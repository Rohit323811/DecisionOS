import { useState } from 'react';
import { CheckIcon, HelpCircleIcon, LayersIcon, LockIcon, PlusIcon, SlidersIcon, TargetIcon, TrendingUpIcon } from 'lucide-react';
import { ModelItem, Scenario } from '../../types/decision';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

interface ScenarioModalProps {
  open: boolean;
  scenarios: Scenario[];
  activeScenarioId: string;
  items: ModelItem[];
  onClose: () => void;
  onSelectScenario: (id: string) => void;
  onCreateScenario: (title: string, description: string) => void;
}

export function ScenarioModal({
  open,
  scenarios,
  activeScenarioId,
  items,
  onClose,
  onSelectScenario,
  onCreateScenario
}: ScenarioModalProps) {
  const [activeTab, setActiveTab] = useState<'variables' | 'goals' | 'constraints' | 'consequences' | 'unknowns'>('variables');

  const variableItems = items.filter((i) => i.kind === 'variable' || i.kind === 'input' || i.kind === 'computed' || i.range || i.value !== undefined);
  const goalItems = items.filter((i) => i.kind === 'goal');
  const constraintItems = items.filter((i) => i.kind === 'constraint');
  const unknownItems = items.filter((i) => i.kind === 'unknown' || i.origin === 'unknown');
  const assumptionItems = items.filter((i) => i.kind === 'assumption');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Scenario Management & Trade-off Matrix"
      description="Compare model behavior across different scenarios. DecisionOS presents structural differences objectively without assigning scores."
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-2xs font-mono text-fg-muted">
            {scenarios.length} scenarios modeled · No scenario is marked as optimal
          </span>
          <Button size="sm" variant="secondary" onClick={onClose}>
            Close Matrix
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Scenario Selection Header Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          {scenarios.map((sc) => {
            const isCurrent = sc.id === activeScenarioId;
            return (
              <button
                key={sc.id}
                onClick={() => onSelectScenario(sc.id)}
                className={cn(
                  'rounded-xl border p-3 transition-all text-left space-y-1.5 focus:outline-none',
                  isCurrent
                    ? 'border-accent bg-[#102422] shadow-[0_0_15px_rgba(63,191,176,0.2)]'
                    : 'border-line bg-surface hover:border-line-strong'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xs uppercase tracking-wider text-fg-muted font-semibold flex items-center gap-1">
                    <LayersIcon className="h-3 w-3 text-accent" /> State
                  </span>
                  {isCurrent && <CheckIcon className="h-3.5 w-3.5 text-accent" />}
                </div>

                <h4 className="text-[13.5px] font-semibold text-fg">{sc.title}</h4>
                <p className="text-2xs text-fg-muted line-clamp-2">{sc.description}</p>
              </button>
            );
          })}
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1 border-b border-line pb-2 font-mono text-2xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('variables')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors',
              activeTab === 'variables' ? 'border-accent/40 bg-accent/10 text-accent font-semibold' : 'border-transparent text-fg-muted hover:text-fg'
            )}
          >
            <SlidersIcon className="h-3.5 w-3.5" /> Variable Changes
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors',
              activeTab === 'goals' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-semibold' : 'border-transparent text-fg-muted hover:text-fg'
            )}
          >
            <TargetIcon className="h-3.5 w-3.5" /> Goal Impacts
          </button>
          <button
            onClick={() => setActiveTab('constraints')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors',
              activeTab === 'constraints' ? 'border-red-500/40 bg-red-500/10 text-red-400 font-semibold' : 'border-transparent text-fg-muted hover:text-fg'
            )}
          >
            <LockIcon className="h-3.5 w-3.5" /> Constraints
          </button>
          <button
            onClick={() => setActiveTab('consequences')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors',
              activeTab === 'consequences' ? 'border-amber-500/40 bg-amber-500/10 text-amber-400 font-semibold' : 'border-transparent text-fg-muted hover:text-fg'
            )}
          >
            <TrendingUpIcon className="h-3.5 w-3.5" /> Consequences
          </button>
          <button
            onClick={() => setActiveTab('unknowns')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors',
              activeTab === 'unknowns' ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300 font-semibold' : 'border-transparent text-fg-muted hover:text-fg'
            )}
          >
            <HelpCircleIcon className="h-3.5 w-3.5" /> Unknowns & Assumptions
          </button>
        </div>

        {/* TAB CONTENTS */}
        <div className="rounded-xl border border-line bg-bg overflow-hidden">
          {activeTab === 'variables' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-2xs">
                <thead>
                  <tr className="border-b border-line bg-surface/80 text-fg-muted">
                    <th className="px-4 py-2.5 font-semibold">Variable Name</th>
                    {scenarios.map((sc) => (
                      <th key={sc.id} className="px-4 py-2.5 font-semibold">
                        {sc.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {variableItems.map((varItem) => (
                    <tr key={varItem.id} className="hover:bg-surface/30">
                      <td className="px-4 py-2.5 font-medium text-fg">{varItem.label}</td>
                      {scenarios.map((sc) => {
                        const overrideVal = sc.variableValues[varItem.id];
                        const displayVal =
                          overrideVal !== undefined
                            ? overrideVal
                            : varItem.range
                            ? `${varItem.range.value} ${varItem.range.unit}`
                            : String(varItem.value ?? 'Default');

                        return (
                          <td key={sc.id} className="px-4 py-2.5 text-accent font-semibold">
                            {String(displayVal)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="p-4 space-y-3">
              <p className="text-2xs text-fg-muted font-mono">
                Goal satisfaction comparison across scenarios:
              </p>
              <div className="space-y-2">
                {goalItems.map((g) => (
                  <div key={g.id} className="rounded-lg border border-line bg-surface p-3 space-y-2">
                    <div className="font-semibold text-[13px] text-emerald-400">{g.label}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-2xs font-mono">
                      {scenarios.map((sc) => (
                        <div key={sc.id} className="rounded border border-line/60 bg-bg p-2">
                          <span className="block text-fg-muted">{sc.title}</span>
                          <span className="text-fg font-medium">
                            {sc.goalImpacts?.[g.id] || 'Modeled as Satisfied'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'constraints' && (
            <div className="p-4 space-y-3">
              <div className="space-y-2">
                {constraintItems.map((c) => (
                  <div key={c.id} className="rounded-lg border border-line bg-surface p-3 space-y-2">
                    <div className="font-semibold text-[13px] text-red-400">{c.label}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-2xs font-mono">
                      {scenarios.map((sc) => (
                        <div key={sc.id} className="rounded border border-line/60 bg-bg p-2">
                          <span className="block text-fg-muted">{sc.title}</span>
                          <span className="text-red-400 font-medium">
                            {sc.constraintStatus?.[c.id] || 'Binding Limit'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'consequences' && (
            <div className="p-4 space-y-3">
              <div className="space-y-2">
                {scenarios.map((sc) => (
                  <div key={sc.id} className="rounded-lg border border-line bg-surface p-3 space-y-1.5">
                    <div className="flex items-center justify-between font-mono text-2xs font-semibold text-accent">
                      <span>Scenario: {sc.title}</span>
                    </div>
                    <p className="text-2xs text-fg-secondary">
                      {sc.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'unknowns' && (
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-line bg-surface p-3 space-y-2">
                  <span className="font-mono text-2xs uppercase tracking-wider text-amber-400 font-semibold">
                    Unknowns ({unknownItems.length})
                  </span>
                  <ul className="space-y-1 text-2xs text-fg">
                    {unknownItems.map((u) => (
                      <li key={u.id}>• {u.label}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg border border-line bg-surface p-3 space-y-2">
                  <span className="font-mono text-2xs uppercase tracking-wider text-indigo-300 font-semibold">
                    Assumptions ({assumptionItems.length})
                  </span>
                  <ul className="space-y-1 text-2xs text-fg">
                    {assumptionItems.map((a) => (
                      <li key={a.id}>• {a.label}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Create Scenario Action */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-2xs text-fg-muted font-mono">
            Create a custom scenario by duplicating the current state.
          </p>
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              const name = `Scenario ${scenarios.length + 1}`;
              onCreateScenario(name, 'Custom scenario created from active state');
            }}
          >
            <PlusIcon className="h-3.5 w-3.5 mr-1" /> New Scenario
          </Button>
        </div>
      </div>
    </Modal>
  );
}
