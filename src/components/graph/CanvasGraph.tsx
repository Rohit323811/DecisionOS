import React, { useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import {
  Background,
  BackgroundVariant,
  BaseEdge,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  ReactFlowProvider,
  getBezierPath,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';
import type { Edge, EdgeProps, Node, NodeProps } from '@xyflow/react';
import { ArrowRightIcon, HelpCircleIcon } from 'lucide-react';
import '@xyflow/react/dist/style.css';
import { ItemKind, ModelEdge, ModelItem } from '../../types/decision';
import { formatDelta } from '../../utils/decisionEngine';
import { KIND_META } from '../../utils/kindMeta';
import { cn } from '../../utils/cn';

/**
 * Graph workspace canvas — built on React Flow, styled to reproduce the
 * original DecisionOS canvas design: kind-tinted node cards, directional
 * bezier edges with dimming, dashed constraint edges and flow dots on
 * active paths. Nodes and edges are generated dynamically from whatever
 * DecisionModel is loaded; nothing about the shape is hardcoded.
 */

export interface CanvasGraphHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  fitView: () => void;
  resetLayout: () => void;
}

interface CanvasGraphProps {
  items: ModelItem[];
  edges: ModelEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  hoveredNodeId: string | null;
  hoveredEdgeId: string | null;
  activePropagatingIds?: Set<string>;
  propagationDeltas?: Record<string, number>;
  searchQuery?: string;
  kindFilter?: ItemKind | 'all';
  showFlowAnimation?: boolean;
  onSelectNode: (id: string | null) => void;
  onSelectEdge: (id: string | null) => void;
  onHoverNode: (id: string | null) => void;
  onHoverEdge: (id: string | null) => void;
  onNodeMove: (id: string, x: number, y: number) => void;
  onViewportChange?: (zoom: number) => void;
}

interface NodeData extends Record<string, unknown> {
  item: ModelItem;
  selected: boolean;
  upstream: boolean;
  downstream: boolean;
  propagating: boolean;
  dimmed: boolean;
  deltaLabel: string | null;
}

type AppNode = Node<NodeData, 'decisionNode'>;

interface EdgeData extends Record<string, unknown> {
  strokeColor: string;
  strokeWidth: number;
  dashed: boolean;
  animated: boolean;
  dimmed: boolean;
}

type AppEdge = Edge<EdgeData, 'flowEdge'>;

const NODE_W = 240;

/** Mirror of the original canvas: upstream = blue, downstream = emerald, focus = teal. */
function nodeBorderClass(d: NodeData): string {
  const isUnknown = d.item.kind === 'unknown' || d.item.origin === 'unknown';
  if (d.selected) return 'border-accent bg-[#102422] shadow-[0_0_20px_rgba(63,191,176,0.25)] ring-1 ring-accent';
  if (d.downstream) return 'border-[#34d399] bg-[#064e3b]/30 shadow-[0_0_12px_rgba(52,211,153,0.15)]';
  if (d.upstream) return 'border-[#3b82f6] bg-[#0f172a] shadow-[0_0_12px_rgba(59,130,246,0.15)]';
  if (isUnknown) return 'border-dashed border-[#475569] bg-[#0f1217]';
  return KIND_META[d.item.kind]?.fill ?? KIND_META.variable.fill;
}

const DecisionNode = memoNode(function DecisionNode({ data }: NodeProps<AppNode>) {
  const { item, selected, propagating, dimmed, deltaLabel, upstream, downstream } = data;
  const meta = KIND_META[item.kind] ?? KIND_META.variable;
  const Icon = meta.icon;
  const isUnknown = item.kind === 'unknown' || item.origin === 'unknown';

  return (
    <div
      style={{ width: NODE_W }}
      className={cn(
        'graph-node rounded-xl border p-3.5 shadow-lg backdrop-blur-sm transition-[border-color,background-color,box-shadow,opacity] duration-200 ease-out',
        nodeBorderClass(data),
        dimmed && 'opacity-25 grayscale-[30%]',
        propagating && 'ring-2 ring-amber-400 animate-pulse'
      )}
    >
      <Handle type="target" position={Position.Left} className="rf-invisible-handle" isConnectable={false} />
      <Handle type="source" position={Position.Right} className="rf-invisible-handle" isConnectable={false} />

      <div className="flex items-center justify-between gap-2 border-b border-line/60 pb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded border text-2xs', meta.fill)}>
            <Icon className={cn('h-3 w-3', meta.color)} />
          </span>
          <span className="font-mono text-2xs uppercase tracking-wider text-fg-muted truncate">{item.kind}</span>
        </div>
        {deltaLabel ? (
          <span
            className={cn(
              'font-mono text-2xs font-semibold px-2 py-0.5 rounded bg-surface border border-amber-500/40 text-amber-400',
              selected && 'text-accent border-accent/40'
            )}
          >
            {deltaLabel}
          </span>
        ) : item.value !== undefined ? (
          <span className="font-mono text-2xs font-semibold px-2 py-0.5 rounded bg-surface border border-line text-accent truncate">
            {String(item.value)}
          </span>
        ) : item.range ? (
          <span className="font-mono text-2xs font-semibold px-2 py-0.5 rounded bg-surface border border-line text-fg truncate">
            {item.range.value} {item.range.unit}
          </span>
        ) : isUnknown ? (
          <span className="font-mono text-2xs px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-1">
            <HelpCircleIcon className="h-2.5 w-2.5" /> Unknown
          </span>
        ) : null}
      </div>

      <h3 className="mt-2 text-[13.5px] font-semibold text-fg leading-snug line-clamp-2">{item.label}</h3>
      <p className="mt-1 text-2xs text-fg-muted line-clamp-2 leading-relaxed">{item.detail}</p>

      <div className="mt-2.5 flex items-center justify-between pt-1.5 border-t border-line/40 text-2xs font-mono text-fg-muted">
        <span className="capitalize text-fg-secondary">
          {item.origin === 'user' ? 'User specified' : item.origin === 'inferred' ? 'AI inferred' : 'Unknown source'}
        </span>
        {(upstream || downstream) && (
          <span className="text-fg-muted">
            {upstream && 'in'} · {downstream && 'out'}
          </span>
        )}
        {item.affects && item.affects.length > 0 && !upstream && !downstream && (
          <span className="flex items-center gap-1 text-accent">
            <ArrowRightIcon className="h-2.5 w-2.5" /> {item.affects.length}
          </span>
        )}
      </div>
    </div>
  );
});

const FlowEdgeComp = memoEdge(function FlowEdge({ id, sourceX, sourceY, targetX, targetY, data, markerEnd }: EdgeProps<AppEdge>) {
  const [path] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition: Position.Right, targetPosition: Position.Left });
  const d = data as EdgeData;
  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        interactionWidth={16}
        className="rf-flow-edge"
        style={{
          stroke: d?.strokeColor ?? '#2b313a',
          strokeWidth: d?.strokeWidth ?? 1.5,
          strokeDasharray: d?.dashed ? '4 4' : undefined,
          opacity: d?.dimmed ? 0.15 : 1,
        }}
        markerEnd={markerEnd}
      />
      {d?.animated && !d.dimmed && (
        <circle r={3} fill={d.strokeColor}>
          <animateMotion dur="2s" repeatCount="indefinite" path={path} />
        </circle>
      )}
    </>
  );
});

const nodeTypes = { decisionNode: DecisionNode };
const edgeTypes = { flowEdge: FlowEdgeComp };

function GraphInner({ ref, ...props }: CanvasGraphProps & { ref?: React.Ref<CanvasGraphHandle> }) {
  const {
    items, edges, selectedNodeId, selectedEdgeId, hoveredNodeId, hoveredEdgeId,
    activePropagatingIds = new Set(), propagationDeltas = {}, searchQuery = '', kindFilter = 'all',
    showFlowAnimation = true, onSelectNode, onSelectEdge, onHoverNode, onHoverEdge, onNodeMove, onViewportChange,
  } = props;

  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const initialLayout = useRef<Map<string, { x: number; y: number }>>(new Map());

  // ---- highlight topology (identical semantics to the original canvas) ----
  const { upstreamSet, downstreamSet, activeEdgesSet } = useMemo(() => {
    const focusId = selectedNodeId || hoveredNodeId;
    const upstream = new Set<string>();
    const downstream = new Set<string>();
    const activeEdges = new Set<string>();
    if (!focusId) return { upstreamSet: upstream, downstreamSet: downstream, activeEdgesSet: activeEdges };

    const byFrom = new Map<string, ModelEdge[]>();
    const byTo = new Map<string, ModelEdge[]>();
    edges.forEach((e) => {
      (byFrom.get(e.from) ?? byFrom.set(e.from, []).get(e.from)!).push(e);
      (byTo.get(e.to) ?? byTo.set(e.to, []).get(e.to)!).push(e);
    });

    const walk = (start: string, map: Map<string, ModelEdge[]>, key: 'from' | 'to', into: Set<string>) => {
      const stack = [start];
      const seen = new Set<string>([start]);
      while (stack.length) {
        const cur = stack.pop()!;
        for (const e of map.get(cur) ?? []) {
          into.add(key === 'from' ? e.to : e.from);
          activeEdges.add(e.id);
          const nxt = key === 'from' ? e.to : e.from;
          if (!seen.has(nxt)) {
            seen.add(nxt);
            stack.push(nxt);
          }
        }
      }
    };

    walk(focusId, byTo, 'to', upstream);
    walk(focusId, byFrom, 'from', downstream);
    return { upstreamSet: upstream, downstreamSet: downstream, activeEdgesSet: activeEdges };
  }, [selectedNodeId, hoveredNodeId, edges]);

  const selectedEdgeObj = useMemo(() => edges.find((e) => e.id === selectedEdgeId) ?? null, [edges, selectedEdgeId]);
  const q = searchQuery.trim().toLowerCase();

  // ---- build RF nodes from model items ----
  const rfNodes: AppNode[] = useMemo(() => {
    return items.map((item) => {
      const isSel = selectedNodeId === item.id;
      const isHover = hoveredNodeId === item.id;
      const isUp = upstreamSet.has(item.id);
      const isDown = downstreamSet.has(item.id);
      const isProp = activePropagatingIds.has(item.id);
      const focusActive = Boolean(selectedNodeId || hoveredNodeId);
      const related = isSel || isHover || isUp || isDown;
      const edgeRelated = selectedEdgeObj && (selectedEdgeObj.from === item.id || selectedEdgeObj.to === item.id);
      const matchesQuery = !q || (item.label + ' ' + item.detail).toLowerCase().includes(q);
      const matchesKind = kindFilter === 'all' || item.kind === kindFilter;
      const dimmed = (focusActive && !related) || (!!selectedEdgeObj && !edgeRelated) || !matchesQuery || !matchesKind;

      return {
        id: item.id,
        type: 'decisionNode' as const,
        position: { x: item.x ?? 100, y: item.y ?? 100 },
        data: {
          item,
          selected: isSel,
          upstream: isUp,
          downstream: isDown,
          propagating: isProp,
          dimmed,
          deltaLabel: isProp && propagationDeltas[item.id] ? formatDelta(propagationDeltas[item.id]) : null,
        },
        // RF's own selection state stays unused — visual selection is data-driven
        selected: false,
        draggable: true,
        selectable: false,
      };
    });
  }, [items, selectedNodeId, hoveredNodeId, upstreamSet, downstreamSet, activePropagatingIds, propagationDeltas, selectedEdgeObj, q, kindFilter]);

  const rfEdges: AppEdge[] = useMemo(() => {
    return edges
      .filter((e) => {
        const fromExists = items.some((i) => i.id === e.from);
        const toExists = items.some((i) => i.id === e.to);
        return fromExists && toExists;
      })
      .map((edge) => {
        const isSel = selectedEdgeId === edge.id;
        const isHover = hoveredEdgeId === edge.id;
        const connectedToFocus = selectedNodeId === edge.from || selectedNodeId === edge.to || hoveredNodeId === edge.from || hoveredNodeId === edge.to;
        const isPathActive = activeEdgesSet.has(edge.id);
        const isProp = activePropagatingIds.has(edge.from) || activePropagatingIds.has(edge.to);
        const focusActive = Boolean(selectedNodeId || hoveredNodeId);
        const dimmed = focusActive && !isPathActive && !connectedToFocus && !isSel && !isHover;

        let strokeColor = '#2b313a';
        let strokeWidth = 1.5;
        let animated = false;
        if (isSel || isHover) {
          strokeColor = '#3fbfb0';
          strokeWidth = 2.5;
        } else if (isPathActive || connectedToFocus) {
          strokeColor = '#34d399';
          strokeWidth = 2;
        } else if (isProp) {
          strokeColor = '#f59e0b';
          strokeWidth = 2.5;
        }
        animated = showFlowAnimation && (isPathActive || isSel || isProp);

        return {
          id: edge.id,
          source: edge.from,
          target: edge.to,
          type: 'flowEdge' as const,
          data: {
            strokeColor,
            strokeWidth,
            dashed: edge.relationshipType === 'constrains',
            animated,
            dimmed,
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: isSel || isHover ? '#3fbfb0' : isPathActive || connectedToFocus ? '#34d399' : '#3a414b', width: 14, height: 14 },
          selectable: false,
          clickable: true,
        };
      });
  }, [edges, items, selectedEdgeId, hoveredEdgeId, selectedNodeId, hoveredNodeId, activeEdgesSet, activePropagatingIds, showFlowAnimation]);

  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>(rfNodes);
  const [, setEdges] = useEdgesState<AppEdge>(rfEdges);

  useEffect(() => setNodes(rfNodes), [rfNodes, setNodes]);
  useEffect(() => setEdges(rfEdges), [rfEdges, setEdges]);

  // Record the layout we were first given so "reset layout" can restore it.
  useEffect(() => {
    if (initialLayout.current.size === 0) {
      initialLayout.current = new Map(items.map((i) => [i.id, { x: i.x ?? 100, y: i.y ?? 100 }]));
    }
  }, [items]);

  useImperativeHandle(ref, () => ({
    zoomIn: () => zoomIn({ duration: 200 }),
    zoomOut: () => zoomOut({ duration: 200 }),
    fitView: () => fitView({ padding: 0.18, duration: 400 }),
    resetLayout: () => {
      onSelectNode(null);
      onSelectEdge(null);
      initialLayout.current.forEach((pos, id) => onNodeMove(id, pos.x, pos.y));
      window.setTimeout(() => fitView({ padding: 0.18, duration: 400 }), 60);
    },
  }));

  return (
    <ReactFlow
      nodes={nodes}
      edges={rfEdges}
      onNodesChange={onNodesChange}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultViewport={{ x: 60, y: 40, zoom: 0.85 }}
      minZoom={0.3}
      maxZoom={2}
      fitView
      fitViewOptions={{ padding: 0.18 }}
      nodesConnectable={false}
      elementsSelectable={false}
      deleteKeyCode={null}
      multiSelectionKeyCode={null}
      proOptions={{ hideAttribution: true }}
      onNodeClick={(_, node) => {
        onSelectNode(node.id);
        onSelectEdge(null);
      }}
      onNodeDragStart={(_, node) => onSelectNode(node.id)}
      onNodeDragStop={(_, node) => onNodeMove(node.id, Math.round(node.position.x), Math.round(node.position.y))}
      onNodeMouseEnter={(_, node) => onHoverNode(node.id)}
      onNodeMouseLeave={() => onHoverNode(null)}
      onEdgeClick={(_, edge) => {
        onSelectEdge(edge.id);
        onSelectNode(null);
      }}
      onEdgeMouseEnter={(_, edge) => onHoverEdge(edge.id)}
      onEdgeMouseLeave={() => onHoverEdge(null)}
      onPaneClick={() => {
        onSelectNode(null);
        onSelectEdge(null);
      }}
      onMove={(_, viewport) => onViewportChange?.(viewport.zoom)}
      className="decisionos-flow"
    >
      <Background variant={BackgroundVariant.Dots} gap={24} size={1.1} color="#22272f" />
    </ReactFlow>
  );
}

function CanvasGraphWithProvider(props: CanvasGraphProps, ref: React.Ref<CanvasGraphHandle>) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#090b0e]">
      <ReactFlowProvider>
        <GraphInner {...props} ref={ref} />
      </ReactFlowProvider>
      {props.searchQuery?.trim() && !props.items.some((i) => (i.label + ' ' + i.detail).toLowerCase().includes(props.searchQuery!.trim().toLowerCase())) && (
        <div className="pointer-events-none absolute left-1/2 top-6 z-10 -translate-x-1/2 rounded-lg border border-line bg-surface/90 px-4 py-2 font-mono text-2xs text-fg-muted shadow-xl backdrop-blur-md">
          No graph nodes matching &quot;{props.searchQuery}&quot;
        </div>
      )}
    </div>
  );
}

/** Tiny stable-wrapper shims so node/edge components keep identity across renders. */
function memoNode<T extends React.ComponentType<any>>(Component: T): T {
  return React.memo(Component) as unknown as T;
}
function memoEdge<T extends React.ComponentType<any>>(Component: T): T {
  return React.memo(Component) as unknown as T;
}

export const CanvasGraph = React.forwardRef<CanvasGraphHandle, CanvasGraphProps>(CanvasGraphWithProvider);

export default CanvasGraph;
