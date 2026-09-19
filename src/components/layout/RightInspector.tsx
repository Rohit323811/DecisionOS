import { useMemo, useState } from 'react';
import {
  ArrowRightIcon,
  CalendarIcon,
  ChevronRightIcon,
  CircleDashedIcon,
  HelpCircleIcon,
  InfoIcon,
  PercentIcon,
  SlidersIcon,
  Trash2Icon,
  XIcon
} from 'lucide-react';
import { ModelEdge, ModelItem, VariableControlType } from '../../types/decision';
import { KIND_META } from '../../utils/kindMeta';
import { Badge, OriginBadge } from '../ui/Badge';
import { cn } from '../../utils/cn';

interface RightInspectorProps {
  items: ModelItem[];
  edges: ModelEdge[];
  modelSummary: string;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  onSelectNode: (id: string | null) => void;
  onUpdateItem: (id: string, patch: Partial<ModelItem>) => void;
  onDeleteItem?: (id: string) => void;
  onClose: () => void;
}

export function RightInspector({
  items,
  edges,
  modelSummary,
  selectedNodeId,
  selectedEdgeId,
  onSelectNode,
  onUpdateItem,
  onDeleteItem,
  onClose
}: RightInspectorProps) {
  const selectedNode = useMemo(() => items.find((i) => i.id === selectedNodeId) || null, [items, selectedNodeId]);
  const selectedEdge = useMemo(() => edges.find((e) => e.id === selectedEdgeId) || null, [edges, selectedEdgeId]);

  const fromNode = useMemo(() => items.find((i) => i.id === selectedEdge?.from), [items, selectedEdge]);
  const toNode = useMemo(() => items.find((i) => i.id === selectedEdge?.to), [items, selectedEdge]);

  // Connections for selected node
  const upstreamNodes = useMemo(() => {
    if (!selectedNodeId) return [];
    const parentIds = edges.filter((e) => e.to === selectedNodeId).map((e) => e.from);
    return items.filter((i) => parentIds.includes(i.id));
  }, [items, edges, selectedNodeId]);

  const downstreamNodes = useMemo(() => {
    if (!selectedNodeId) return [];
    const childIds = edges.filter((e) => e.from === selectedNodeId).map((e) => e.to);
    return items.filter((i) => childIds.includes(i.id));
  }, [items, edges, selectedNodeId]);

  // Unknown count & Assumption count
  const unknownCount = items.filter((i) => i.kind === 'unknown' || i.origin === 'unknown').length;
  const assumptionCount = items.filter((i) => i.kind === 'assumption').length;

  return (
    <aside className="relative flex h-full w-[340px] flex-col border-l border-line bg-surface/95 backdrop-blur-md select-none shrink-0 overflow-y-auto">
      {/* Header */}
      <div className="flex h-13 items-center justify-between border-b border-line px-4 shrink-0">
        <div className="flex items-center gap-2">
          <InfoIcon className="h-4 w-4 text-accent" />
          <span className="font-mono text-2xs uppercase tracking-wider text-fg font-semibold">
            {selectedNode ? 'Variable Inspector' : selectedEdge ? 'Relationship Inspector' : 'Model Overview'}
          </span>
        </div>
        {(selectedNodeId || selectedEdgeId) && (
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded text-fg-muted hover:bg-line hover:text-fg transition-colors"
            aria-label="Deselect"
          >
            <XIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* BODY CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* CASE 1: NODE SELECTED */}
        {selectedNode ? (
          <NodeInspectorView
            node={selectedNode}
            upstreamNodes={upstreamNodes}
            downstreamNodes={downstreamNodes}
            onSelectNode={onSelectNode}
            onUpdateItem={onUpdateItem}
            onDeleteItem={onDeleteItem}
          />
        ) : selectedEdge && fromNode && toNode ? (
          /* CASE 2: EDGE SELECTED */
          <EdgeInspectorView edge={selectedEdge} fromNode={fromNode} toNode={toNode} onSelectNode={onSelectNode} />
        ) : (
          /* CASE 3: NO SELECTION (MODEL OVERVIEW) */
          <ModelOverviewView
            items={items}
            edges={edges}
            summary={modelSummary}
            unknownCount={unknownCount}
            assumptionCount={assumptionCount}
            onSelectNode={onSelectNode}
          />
        )}
      </div>
    </aside>
  );
}

/** Per-type value controls, resolved from the variable type — never one-size-fits-all. */
function ValueControl({
  node,
  onUpdateItem
}: {
  node: ModelItem;
  onUpdateItem: (id: string, patch: Partial<ModelItem>) => void;
}) {
  const controlType: VariableControlType = node.controlType ?? (node.range ? 'slider' : 'numeric');

  if (controlType === 'slider' && node.range) {
    return (
      <div className="space-y-2 pt-1">
        <div className="flex justify-between font-mono text-2xs">
          <span className="text-fg-muted">Current Value</span>
          <span className="text-accent font-semibold">
            {node.range.value} {node.range.unit}
          </span>
        </div>
        <input
          type="range"
          min={node.range.min}
          max={node.range.max}
          step={node.range.step ?? 1}
          value={node.range.value}
          onChange={(e) => onUpdateItem(node.id, { range: { ...node.range!, value: Number(e.target.value) } })}
          className="w-full accent-accent bg-line h-1.5 rounded-lg cursor-pointer"
        />
        <div className="flex justify-between font-mono text-2xs text-fg-muted">
          <span>{node.range.min}</span>
          <span>{node.range.max}</span>
        </div>
      </div>
    );
  }

  if (controlType === 'currency') {
    return (
      <div className="space-y-1.5 pt-1">
        <label className="flex items-center gap-1 font-mono text-2xs text-fg-muted">
          <PercentIcon className="h-3 w-3 rotate-90" /> Amount (USD)
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-2xs text-fg-muted">$</span>
          <input
            type="number"
            value={typeof node.value === 'number' ? node.value : Number(node.value) || 0}
            onChange={(e) => onUpdateItem(node.id, { value: Number(e.target.value) })}
            className="w-full rounded border border-line bg-surface px-2.5 py-1.5 pl-6 font-mono text-2xs text-fg focus:border-accent focus:outline-none"
          />
        </div>
      </div>
    );
  }

  if (controlType === 'percentage') {
    return (
      <div className="space-y-2 pt-1">
        <div className="flex justify-between font-mono text-2xs">
          <span className="text-fg-muted">Percentage</span>
          <span className="text-accent font-semibold">{Number(node.value) || 0}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={Number(node.value) || 0}
          onChange={(e) => onUpdateItem(node.id, { value: Number(e.target.value) })}
          className="w-full accent-accent bg-line h-1.5 rounded-lg cursor-pointer"
        />
      </div>
    );
  }

  if (controlType === 'toggle') {
    return (
      <div className="flex items-center justify-between pt-1">
        <span className="font-mono text-2xs text-fg-secondary">State Enabled</span>
        <button
          type="button"
          role="switch"
          aria-checked={node.value === true}
          onClick={() => onUpdateItem(node.id, { value: !node.value })}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
            node.value ? 'bg-accent' : 'bg-line'
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
              node.value ? 'translate-x-4' : 'translate-x-0'
            )}
          />
        </button>
      </div>
    );
  }

  if (controlType === 'dropdown') {
    return (
      <div className="space-y-1 pt-1">
        <label className="font-mono text-2xs text-fg-muted">Option Select</label>
        <select
          value={String(node.value ?? '')}
          onChange={(e) => onUpdateItem(node.id, { value: e.target.value })}
          className="w-full rounded border border-line bg-surface px-2.5 py-1.5 font-mono text-2xs text-fg focus:border-accent focus:outline-none"
        >
          {(node.selectOptions && node.selectOptions.length > 0
            ? node.selectOptions
            : ['High', 'Medium', 'Low']
          ).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (controlType === 'date') {
    return (
      <div className="space-y-1 pt-1">
        <label className="flex items-center gap-1 font-mono text-2xs text-fg-muted">
          <CalendarIcon className="h-3 w-3" /> Target Date
        </label>
        <input
          type="date"
          value={String(node.value ?? '')}
          onChange={(e) => onUpdateItem(node.id, { value: e.target.value })}
          className="w-full rounded border border-line bg-surface px-2.5 py-1.5 font-mono text-2xs text-fg focus:border-accent focus:outline-none"
        />
      </div>
    );
  }

  if (controlType === 'numeric') {
    return (
      <div className="space-y-1 pt-1">
        <label className="font-mono text-2xs text-fg-muted">Value{node.range?.unit ? ` (${node.range.unit})` : ''}</label>
        <input
          type="number"
          value={typeof node.value === 'number' ? node.value : Number(node.value) || 0}
          onChange={(e) => onUpdateItem(node.id, { value: Number(e.target.value) })}
          className="w-full rounded border border-line bg-surface px-2.5 py-1.5 font-mono text-2xs text-fg focus:border-accent focus:outline-none"
        />
      </div>
    );
  }

  // text
  return (
    <div className="space-y-1 pt-1">
      <label className="font-mono text-2xs text-fg-muted">Value</label>
      <input
        type="text"
        value={String(node.value ?? '')}
        onChange={(e) => onUpdateItem(node.id, { value: e.target.value })}
        className="w-full rounded border border-line bg-surface px-2.5 py-1.5 font-mono text-2xs text-fg focus:border-accent focus:outline-none"
      />
    </div>
  );
}

/** Component for editing Node Variables & Controls */
function NodeInspectorView({
  node,
  upstreamNodes,
  downstreamNodes,
  onSelectNode,
  onUpdateItem,
  onDeleteItem
}: {
  node: ModelItem;
  upstreamNodes: ModelItem[];
  downstreamNodes: ModelItem[];
  onSelectNode: (id: string | null) => void;
  onUpdateItem: (id: string, patch: Partial<ModelItem>) => void;
  onDeleteItem?: (id: string) => void;
}) {
  const meta = KIND_META[node.kind] || KIND_META.variable;
  const Icon = meta.icon;
  const isUnknown = node.kind === 'unknown' || node.origin === 'unknown';
  const [controlOverride, setControlOverride] = useState<VariableControlType | null>(null);
  const controlType = controlOverride ?? node.controlType ?? (node.range ? 'slider' : 'numeric');

  return (
    <div className="space-y-5">
      {/* Node Header */}
      <div className={cn('rounded-xl border p-3.5 space-y-2', isUnknown ? 'border-dashed border-amber-500/40 bg-amber-500/5' : meta.fill)}>
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 font-mono text-2xs uppercase tracking-wider text-fg-muted font-semibold">
            <Icon className={cn('h-3.5 w-3.5', meta.color)} /> {node.kind}
          </span>
          <OriginBadge origin={node.origin} />
        </div>

        <input
          type="text"
          value={node.label}
          onChange={(e) => onUpdateItem(node.id, { label: e.target.value })}
          className="w-full bg-transparent text-[15px] font-semibold text-fg focus:outline-none focus:border-b focus:border-accent"
        />

        <textarea
          value={node.detail}
          onChange={(e) => onUpdateItem(node.id, { detail: e.target.value })}
          rows={2}
          className="w-full bg-transparent text-2xs text-fg-muted resize-none focus:outline-none focus:text-fg transition-colors"
        />

        {node.confidence && (
          <div className="flex items-center gap-1.5 border-t border-line/60 pt-1.5">
            <span className="font-mono text-2xs text-fg-muted">confidence:</span>
            <Badge tone={node.confidence === 'low' ? 'warning' : node.confidence === 'high' ? 'positive' : 'neutral'} mono>
              {node.confidence}
            </Badge>
          </div>
        )}
      </div>

      {/* CONTROLS SECTION */}
      <div className="rounded-xl border border-line bg-bg p-3.5 space-y-3">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <span className="font-mono text-2xs uppercase tracking-wider text-fg font-semibold flex items-center gap-1.5">
            <SlidersIcon className="h-3.5 w-3.5 text-accent" /> Variable Controls
          </span>

          {/* Control type switcher */}
          <select
            value={controlType}
            onChange={(e) => {
              const ct = e.target.value as VariableControlType;
              setControlOverride(ct);
              onUpdateItem(node.id, { controlType: ct });
            }}
            className="rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-2xs text-fg-secondary focus:outline-none focus:border-accent"
          >
            <option value="slider">Range Slider</option>
            <option value="numeric">Numeric Input</option>
            <option value="currency">Currency</option>
            <option value="percentage">Percentage</option>
            <option value="toggle">Toggle Switch</option>
            <option value="dropdown">Dropdown</option>
            <option value="date">Date Picker</option>
            <option value="text">Text</option>
          </select>
        </div>

        <ValueControl node={node} onUpdateItem={onUpdateItem} />

        {node.computedFormula && (
          <div className="border-t border-line pt-2.5">
            <span className="font-mono text-2xs text-fg-muted">derived from:</span>
            <p className="mt-1 rounded border border-[#4c3a70]/40 bg-[#1a162b]/60 px-2 py-1.5 font-mono text-2xs text-[#a78bfa]">
              {node.computedFormula}
            </p>
          </div>
        )}
      </div>

      {/* UNKNOWN HANDLING SECTION */}
      {isUnknown && (
        <div className="rounded-xl border border-dashed border-amber-500/50 bg-amber-500/10 p-3.5 space-y-2.5">
          <div className="flex items-center gap-1.5 text-amber-400 font-mono text-2xs font-semibold">
            <HelpCircleIcon className="h-3.5 w-3.5" /> Unknown Resolution
          </div>
          <p className="text-2xs text-fg-muted leading-relaxed">
            This node holds unconfirmed information. Resolve it yourself — the model never invents a value for you.
          </p>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={() =>
                onUpdateItem(node.id, {
                  origin: 'user',
                  kind: node.kind === 'unknown' ? 'input' : node.kind,
                  controlType: 'numeric',
                  variableType: 'number',
                })
              }
              className="rounded border border-amber-500/30 bg-surface px-2 py-1.5 font-mono text-2xs text-amber-300 hover:bg-amber-500/20"
            >
              Provide Value
            </button>
            <button
              onClick={() =>
                onUpdateItem(node.id, {
                  origin: 'user',
                  kind: node.kind === 'unknown' ? 'variable' : node.kind,
                  controlType: 'slider',
                  variableType: 'number',
                  range: node.range ?? { min: 0, max: 100, value: 50, unit: '' },
                })
              }
              className="rounded border border-amber-500/30 bg-surface px-2 py-1.5 font-mono text-2xs text-amber-300 hover:bg-amber-500/20"
            >
              Set Range
            </button>
          </div>
          <p className="flex items-center gap-1 font-mono text-2xs text-fg-muted">
            <CircleDashedIcon className="h-3 w-3" /> stays dormant in propagation until resolved
          </p>
        </div>
      )}

      {/* CONNECTIONS SECTION */}
      <div className="space-y-3">
        <h4 className="font-mono text-2xs uppercase tracking-wider text-fg-muted font-semibold">
          Graph Dependency Connections
        </h4>

        {/* Inputs (Upstream) */}
        <div className="rounded-xl border border-line bg-bg p-3 space-y-2">
          <span className="font-mono text-2xs text-fg-muted flex items-center justify-between">
            <span>Inputs (Affected By)</span>
            <span className="text-fg-secondary font-semibold">{upstreamNodes.length}</span>
          </span>
          {upstreamNodes.length === 0 ? (
            <p className="text-2xs text-fg-muted italic">No incoming parent nodes.</p>
          ) : (
            <div className="space-y-1">
              {upstreamNodes.map((parent) => (
                <button
                  key={parent.id}
                  onClick={() => onSelectNode(parent.id)}
                  className="flex w-full items-center justify-between rounded border border-line bg-surface p-2 text-left text-2xs hover:border-accent hover:text-accent transition-colors"
                >
                  <span className="truncate font-medium text-fg">{parent.label}</span>
                  <ChevronRightIcon className="h-3 w-3 shrink-0 text-fg-muted" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Outputs (Downstream) */}
        <div className="rounded-xl border border-line bg-bg p-3 space-y-2">
          <span className="font-mono text-2xs text-fg-muted flex items-center justify-between">
            <span>Outputs (Affects Downstream)</span>
            <span className="text-fg-secondary font-semibold">{downstreamNodes.length}</span>
          </span>
          {downstreamNodes.length === 0 ? (
            <p className="text-2xs text-fg-muted italic">No outgoing child nodes.</p>
          ) : (
            <div className="space-y-1">
              {downstreamNodes.map((child) => (
                <button
                  key={child.id}
                  onClick={() => onSelectNode(child.id)}
                  className="flex w-full items-center justify-between rounded border border-line bg-surface p-2 text-left text-2xs hover:border-accent hover:text-accent transition-colors"
                >
                  <span className="truncate font-medium text-fg">{child.label}</span>
                  <ChevronRightIcon className="h-3 w-3 shrink-0 text-fg-muted" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* DELETE NODE ACTION */}
      {onDeleteItem && (
        <div className="pt-2">
          <button
            onClick={() => onDeleteItem(node.id)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 py-2 font-mono text-2xs text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <Trash2Icon className="h-3.5 w-3.5" /> Remove Node from Graph
          </button>
        </div>
      )}
    </div>
  );
}

/** Component for Edge / Relationship Inspector */
function EdgeInspectorView({
  edge,
  fromNode,
  toNode,
  onSelectNode
}: {
  edge: ModelEdge;
  fromNode: ModelItem;
  toNode: ModelItem;
  onSelectNode: (id: string | null) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-accent/40 bg-[#102422] p-3.5 space-y-2">
        <span className="font-mono text-2xs uppercase tracking-wider text-accent font-semibold">
          Directional Relationship
        </span>

        {/* Source -> Target Path */}
        <div className="flex items-center gap-2 pt-1 font-mono text-2xs">
          <button
            onClick={() => onSelectNode(fromNode.id)}
            className="truncate rounded bg-surface border border-line px-2 py-1 text-fg hover:border-accent"
          >
            {fromNode.label}
          </button>
          <ArrowRightIcon className="h-4 w-4 shrink-0 text-accent" />
          <button
            onClick={() => onSelectNode(toNode.id)}
            className="truncate rounded bg-surface border border-line px-2 py-1 text-fg hover:border-accent"
          >
            {toNode.label}
          </button>
        </div>
      </div>

      {/* Explanation card */}
      <div className="rounded-xl border border-line bg-bg p-3.5 space-y-2">
        <span className="font-mono text-2xs text-fg-muted uppercase tracking-wider font-semibold">
          Relationship Explanation
        </span>
        <p className="text-[13.5px] leading-relaxed text-fg font-medium">
          "{edge.explanation || `Changing ${fromNode.label} directly impacts ${toNode.label}.`}"
        </p>

        <div className="flex items-center justify-between border-t border-line pt-2 text-2xs font-mono text-fg-muted">
          <span>Type: {edge.relationshipType || 'Direct effect'}</span>
          <span>Confidence: {edge.confidence || 'high'}</span>
        </div>
      </div>
    </div>
  );
}

/** Component for Model Overview when no node is selected */
function ModelOverviewView({
  items,
  edges,
  summary,
  unknownCount,
  assumptionCount,
  onSelectNode
}: {
  items: ModelItem[];
  edges: ModelEdge[];
  summary: string;
  unknownCount: number;
  assumptionCount: number;
  onSelectNode: (id: string | null) => void;
}) {
  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="rounded-xl border border-line bg-bg p-3.5 space-y-2">
        <span className="font-mono text-2xs uppercase tracking-wider text-accent font-semibold">
          Executive Model Summary
        </span>
        <p className="text-[13px] leading-relaxed text-fg-secondary">{summary}</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-line bg-bg p-3 text-center">
          <span className="block font-mono text-xl font-semibold text-fg">{items.length}</span>
          <span className="font-mono text-2xs text-fg-muted">Total Nodes</span>
        </div>
        <div className="rounded-lg border border-line bg-bg p-3 text-center">
          <span className="block font-mono text-xl font-semibold text-accent">{edges.length}</span>
          <span className="font-mono text-2xs text-fg-muted">Relationships</span>
        </div>
        <div className="rounded-lg border border-line bg-bg p-3 text-center">
          <span className="block font-mono text-xl font-semibold text-amber-400">{unknownCount}</span>
          <span className="font-mono text-2xs text-fg-muted">Unknowns</span>
        </div>
        <div className="rounded-lg border border-line bg-bg p-3 text-center">
          <span className="block font-mono text-xl font-semibold text-indigo-400">{assumptionCount}</span>
          <span className="font-mono text-2xs text-fg-muted">Assumptions</span>
        </div>
      </div>

      {/* Composition list */}
      <div className="space-y-2">
        <span className="font-mono text-2xs uppercase tracking-wider text-fg-muted font-semibold">
          Node Inventory
        </span>

        <div className="space-y-1">
          {items.map((item) => {
            const meta = KIND_META[item.kind] || KIND_META.variable;
            const Icon = meta.icon;
            return (
              <button
                key={item.id}
                onClick={() => onSelectNode(item.id)}
                className="flex w-full items-center justify-between rounded-lg border border-line bg-bg p-2 text-left hover:border-line-strong hover:bg-surface transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className={cn('h-3.5 w-3.5 shrink-0', meta.color)} />
                  <span className="truncate text-2xs font-medium text-fg">{item.label}</span>
                </div>
                <Badge tone={meta.tone} mono>
                  {item.kind}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
