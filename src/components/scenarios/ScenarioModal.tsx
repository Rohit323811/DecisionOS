import { CheckIcon, LayersIcon, PlusIcon } from 'lucide-react';
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
  const variableItems = items.filter((i) => i.range || i.value !== undefined);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Scenario System & Comparison"
      description="Each scenario preserves its own variable values. Compare how trade-offs move outcomes across states."
      footer={
        <Button size="sm" variant="secondary" onClick={onClose}>
          Close Matrix
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Scenario Cards Row */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {scenarios.map((sc) => {
            const isCurrent = sc.id === activeScenarioId;
            return (
              <div
                key={sc.id}
                onClick={() => onSelectScenario(sc.id)}
                className={cn(
                  'cursor-pointer rounded-xl border p-3.5 transition-all text-left space-y-2',
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

                <h4 className="text-[14px] font-semibold text-fg">{sc.title}</h4>
                <p className="text-2xs text-fg-muted line-clamp-2">{sc.description}</p>
              </div>
            );
          })}
        </div>

        {/* Matrix Comparison Table */}
        <div className="rounded-xl border border-line bg-bg overflow-hidden">
          <div className="border-b border-line bg-surface px-4 py-2.5 font-mono text-2xs uppercase tracking-wider text-fg-muted font-semibold">
            Variable Comparison Matrix
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-2xs">
              <thead>
                <tr className="border-b border-line bg-surface/50 text-fg-muted">
                  <th className="px-4 py-2.5 font-semibold">Variable</th>
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
        </div>

        {/* Create Scenario Action */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-2xs text-fg-muted font-mono">
            Modifying a variable in the inspector updates the currently active scenario.
          </p>
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              const name = `Scenario ${scenarios.length + 1}`;
              onCreateScenario(name, 'Custom state cloned from current situation');
            }}
          >
            <PlusIcon className="h-3.5 w-3.5 mr-1" /> Clone New Scenario
          </Button>
        </div>
      </div>
    </Modal>
  );
}
