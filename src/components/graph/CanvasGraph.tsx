import React, { useCallback, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRightIcon,
  HelpCircleIcon
} from 'lucide-react';
import { ItemKind, ModelEdge, ModelItem } from '../../types/decision';
import { KIND_META } from '../../utils/kindMeta';
import { cn } from '../../utils/cn';

interface CanvasGraphProps {
  items: ModelItem[];
  edges: ModelEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  hoveredNodeId: string | null;
  hoveredEdgeId: string | null;
  activePropagatingIds?: Set<string>;
  zoom: number;
  pan: { x: number; y: number };
  searchQuery?: string;
  kindFilter?: ItemKind | 'all';
  showFlowAnimation?: boolean;
  onSelectNode: (id: string | null) => void;
  onSelectEdge: (id: string | null) => void;
  onHoverNode: (id: string | null) => void;
  onHoverEdge: (id: string | null) => void;
  onNodeMove: (id: string, x: number, y: number) => void;
  onPanChange: (pan: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
}

const DEFAULT_NODE_WIDTH = 240;
const DEFAULT_NODE_HEIGHT = 110;

/** Default auto-layout helper if nodes do not have (x, y) */
function getDefaultPositions(items: ModelItem[]) {
  const kindColumns: Record<string, number> = {
    decision: 0,
    option: 1,
    input: 1,
    variable: 2,
    computed: 3,
    goal: 4,
    constraint: 4,
    impact: 4,
    assumption: 2,
    unknown: 1
  };

  const columnY: Record<number, number> = { 0: 100, 1: 80, 2: 80, 3: 80, 4: 80 };
  const X_SPACING = 310;
  const Y_SPACING = 150;
  const positions: Record<string, { x: number; y: number }> = {};

  items.forEach((item) => {
    if (typeof item.x === 'number' && typeof item.y === 'number') {
      positions[item.id] = { x: item.x, y: item.y };
      return;
    }
    const col = kindColumns[item.kind] ?? 2;
    const y = columnY[col] || 80;
    columnY[col] = y + Y_SPACING;
    positions[item.id] = { x: 100 + col * X_SPACING, y };
  });

  return positions;
}

export function CanvasGraph({
  items,
  edges,
  selectedNodeId,
  selectedEdgeId,
  hoveredNodeId,
  hoveredEdgeId,
  activePropagatingIds = new Set(),
  zoom,
  pan,
  searchQuery = '',
  kindFilter = 'all',
  showFlowAnimation = true,
  onSelectNode,
  onSelectEdge,
  onHoverNode,
  onHoverEdge,
  onNodeMove,
  onPanChange,
  onZoomChange
}: CanvasGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Node position map
  const positions = useMemo(() => getDefaultPositions(items), [items]);

  // Upstream (parents) and Downstream (children) sets
  const { upstreamSet, downstreamSet, activeEdgesSet } = useMemo(() => {
    const focusId = selectedNodeId || hoveredNodeId;
    const upstream = new Set<string>();
    const downstream = new Set<string>();
    const activeEdges = new Set<string>();

    if (!focusId) return { upstreamSet: upstream, downstreamSet: downstream, activeEdgesSet: activeEdges };

    // Find direct and transitive upstream (parents)
    function findParents(id: string) {
      edges.forEach((e) => {
        if (e.to === id && !upstream.has(e.from)) {
          upstream.add(e.from);
          activeEdges.add(e.id);
          findParents(e.from);
        }
      });
    }

    // Find direct and transitive downstream (children)
    function findChildren(id: string) {
      edges.forEach((e) => {
        if (e.from === id && !downstream.has(e.to)) {
          downstream.add(e.to);
          activeEdges.add(e.id);
          findChildren(e.to);
        }
      });
    }

    findParents(focusId);
    findChildren(focusId);

    // Also include edges connected directly to focusId
    edges.forEach((e) => {
      if (e.from === focusId || e.to === focusId) {
        activeEdges.add(e.id);
      }
    });

    return { upstreamSet: upstream, downstreamSet: downstream, activeEdgesSet: activeEdges };
  }, [selectedNodeId, hoveredNodeId, edges]);

  // Selected edge nodes
  const selectedEdgeObj = useMemo(() => {
    return edges.find((e) => e.id === selectedEdgeId) ?? null;
  }, [edges, selectedEdgeId]);

  // Canvas panning handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('.graph-node')) return;
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    },
    [pan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        onPanChange({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
      } else if (draggingNodeId) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const currentX = (e.clientX - rect.left - pan.x) / zoom - dragOffset.x;
        const currentY = (e.clientY - rect.top - pan.y) / zoom - dragOffset.y;
        onNodeMove(draggingNodeId, Math.round(currentX), Math.round(currentY));
      }
    },
    [isPanning, startPan, draggingNodeId, dragOffset, pan, zoom, onPanChange, onNodeMove]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setDraggingNodeId(null);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.08 : 0.08;
        const newZoom = Math.min(Math.max(zoom + delta, 0.4), 2.0);
        onZoomChange(Number(newZoom.toFixed(2)));
      } else {
        onPanChange({ x: pan.x - e.deltaX, y: pan.y - e.deltaY });
      }
    },
    [zoom, pan, onZoomChange, onPanChange]
  );

  // Node drag start
  const handleNodeDragStart = (e: React.MouseEvent, node: ModelItem) => {
    e.stopPropagation();
    const pos = positions[node.id] || { x: 0, y: 0 };
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickX = (e.clientX - rect.left - pan.x) / zoom;
    const clickY = (e.clientY - rect.top - pan.y) / zoom;
    setDragOffset({ x: clickX - pos.x, y: clickY - pos.y });
    setDraggingNodeId(node.id);
    onSelectNode(node.id);
  };

  // Helper for generating smooth SVG Bezier path between nodes
  function calculateEdgePath(fromId: string, toId: string) {
    const fromPos = positions[fromId];
    const toPos = positions[toId];
    if (!fromPos || !toPos) return '';

    const startX = fromPos.x + DEFAULT_NODE_WIDTH;
    const startY = fromPos.y + DEFAULT_NODE_HEIGHT / 2;
    const endX = toPos.x;
    const endY = toPos.y + DEFAULT_NODE_HEIGHT / 2;

    const dx = Math.max(40, Math.abs(endX - startX) * 0.5);
    return `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;
  }

  // Deselect on backdrop click
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
      onSelectNode(null);
      onSelectEdge(null);
    }
  };

  const q = searchQuery.trim().toLowerCase();

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleCanvasClick}
      className={cn(
        'relative h-full w-full overflow-hidden select-none bg-[#090b0e] cursor-grab active:cursor-grabbing',
        isPanning && 'cursor-grabbing'
      )}
      style={{
        backgroundImage: `radial-gradient(circle, #22272f 1.2px, transparent 1.2px)`,
        backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`
      }}
    >
      {/* Container SVG and HTML nodes transformed by Pan/Zoom */}
      <div
        className="absolute left-0 top-0 h-full w-full origin-0 pointer-events-none"
        style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${zoom})`
        }}
      >
        {/* SVG layer for edges and connection arrows */}
        <svg className="absolute left-0 top-0 h-[5000px] w-[5000px] overflow-visible pointer-events-none">
          <defs>
            <marker
              id="arrow-default"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#3a414b" />
            </marker>
            <marker
              id="arrow-active"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#3fbfb0" />
            </marker>
            <marker
              id="arrow-downstream"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#34d399" />
            </marker>
          </defs>

          <g className="pointer-events-auto">
            {edges.map((edge) => {
              const pathD = calculateEdgePath(edge.from, edge.to);
              if (!pathD) return null;

              const isFocus = selectedNodeId || hoveredNodeId;
              const isSelected = selectedEdgeId === edge.id;
              const isHovered = hoveredEdgeId === edge.id;
              const isEdgeConnectedToFocus =
                selectedNodeId === edge.from ||
                selectedNodeId === edge.to ||
                hoveredNodeId === edge.from ||
                hoveredNodeId === edge.to;
              const isPathActive = activeEdgesSet.has(edge.id);
              const isPropagating = activePropagatingIds.has(edge.from) || activePropagatingIds.has(edge.to);

              const isDimmed =
                isFocus && !isPathActive && !isEdgeConnectedToFocus && !isSelected && !isHovered;

              let strokeColor = '#2b313a';
              let strokeWidth = 1.5;
              let marker = 'url(#arrow-default)';

              if (isSelected || isHovered) {
                strokeColor = '#3fbfb0';
                strokeWidth = 2.5;
                marker = 'url(#arrow-active)';
              } else if (isPathActive || isEdgeConnectedToFocus) {
                strokeColor = '#34d399';
                strokeWidth = 2;
                marker = 'url(#arrow-downstream)';
              } else if (isPropagating) {
                strokeColor = '#f59e0b';
                strokeWidth = 2.5;
              }

              return (
                <g key={edge.id} className="group">
                  {/* Invisible wide hit target for easy edge clicking */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={16}
                    className="cursor-pointer pointer-events-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEdge(edge.id);
                      onSelectNode(null);
                    }}
                    onMouseEnter={() => onHoverEdge(edge.id)}
                    onMouseLeave={() => onHoverEdge(null)}
                  />

                  {/* Main visible connection path */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={edge.relationshipType === 'constrains' ? '4 4' : undefined}
                    markerEnd={marker}
                    className={cn(
                      'transition-[stroke,stroke-width,opacity] duration-200 ease-out pointer-events-none',
                      isDimmed && 'opacity-20'
                    )}
                  />

                  {/* Flow animation dots along path */}
                  {showFlowAnimation && (isPathActive || isSelected || isPropagating) && !isDimmed && (
                    <circle r={3} fill={isPropagating ? '#f59e0b' : strokeColor}>
                      <animateMotion path={pathD} dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* HTML Nodes layer */}
        <div className="absolute left-0 top-0 pointer-events-auto">
          {items.map((node) => {
            const meta = KIND_META[node.kind] ?? KIND_META.variable;
            const Icon = meta.icon;
            const pos = positions[node.id] || { x: 100, y: 100 };

            const isSelected = selectedNodeId === node.id;
            const isHovered = hoveredNodeId === node.id;
            const isUpstream = upstreamSet.has(node.id);
            const isDownstream = downstreamSet.has(node.id);
            const isPropagating = activePropagatingIds.has(node.id);

            const isFocusActive = Boolean(selectedNodeId || hoveredNodeId);
            const isRelated = isSelected || isHovered || isUpstream || isDownstream;
            const isEdgeRelated =
              selectedEdgeObj && (selectedEdgeObj.from === node.id || selectedEdgeObj.to === node.id);

            const matchesQuery = !q || (node.label + ' ' + node.detail).toLowerCase().includes(q);
            const matchesKind = kindFilter === 'all' || node.kind === kindFilter;

            const isDimmed = (isFocusActive && !isRelated) || (selectedEdgeObj && !isEdgeRelated) || !matchesQuery || !matchesKind;

            const isUnknown = node.kind === 'unknown' || node.origin === 'unknown';

            // Distinct node highlight borders
            let borderClass = meta.fill;
            if (isSelected) {
              borderClass = 'border-accent bg-[#102422] shadow-[0_0_20px_rgba(63,191,176,0.25)] ring-1 ring-accent';
            } else if (isUpstream) {
              borderClass = 'border-[#3b82f6] bg-[#0f172a] shadow-[0_0_12px_rgba(59,130,246,0.15)]';
            } else if (isDownstream) {
              borderClass = 'border-[#34d399] bg-[#064e3b]/30 shadow-[0_0_12px_rgba(52,211,153,0.15)]';
            } else if (isHovered) {
              borderClass = 'border-line-strong bg-[#14171c]';
            } else if (isUnknown) {
              borderClass = 'border-dashed border-[#475569] bg-[#0f1217]';
            }

            return (
              <motion.div
                key={node.id}
                onMouseDown={(e) => handleNodeDragStart(e, node)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode(node.id);
                  onSelectEdge(null);
                }}
                onMouseEnter={() => onHoverNode(node.id)}
                onMouseLeave={() => onHoverNode(null)}
                style={{
                  transform: `translate3d(${pos.x}px, ${pos.y}px, 0px)`,
                  width: DEFAULT_NODE_WIDTH
                }}
                className={cn(
                  'graph-node absolute top-0 left-0 cursor-grab active:cursor-grabbing rounded-xl border p-3.5 shadow-lg backdrop-blur-sm transition-all duration-150 ease-out',
                  borderClass,
                  isDimmed ? 'opacity-25 filter grayscale-[30%]' : 'opacity-100',
                  isPropagating && 'animate-pulse ring-2 ring-amber-400'
                )}
              >
                {/* Header row: Kind badge + Title + Source indicator */}
                <div className="flex items-center justify-between gap-2 border-b border-line/60 pb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded border text-2xs', meta.fill)}>
                      <Icon className={cn('h-3 w-3', meta.color)} />
                    </span>
                    <span className="font-mono text-2xs uppercase tracking-wider text-fg-muted truncate">
                      {node.kind}
                    </span>
                  </div>

                  {/* Value tag / badge */}
                  {node.value !== undefined ? (
                    <span className="font-mono text-2xs font-semibold px-2 py-0.5 rounded bg-surface border border-line text-accent truncate">
                      {String(node.value)}
                    </span>
                  ) : node.range ? (
                    <span className="font-mono text-2xs font-semibold px-2 py-0.5 rounded bg-surface border border-line text-fg truncate">
                      {node.range.value} {node.range.unit}
                    </span>
                  ) : isUnknown ? (
                    <span className="font-mono text-2xs px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-1">
                      <HelpCircleIcon className="h-2.5 w-2.5" /> Unknown
                    </span>
                  ) : null}
                </div>

                {/* Node Title */}
                <h3 className="mt-2 text-[13.5px] font-semibold text-fg leading-snug line-clamp-2">
                  {node.label}
                </h3>

                {/* Short description */}
                <p className="mt-1 text-2xs text-fg-muted line-clamp-2 leading-relaxed">
                  {node.detail}
                </p>

                {/* Footer metadata: Upstream/Downstream indicators */}
                <div className="mt-2.5 flex items-center justify-between pt-1.5 border-t border-line/40 text-2xs font-mono text-fg-muted">
                  <span className="capitalize text-fg-secondary">
                    {node.origin === 'user' ? 'User specified' : node.origin === 'inferred' ? 'AI inferred' : 'Unknown source'}
                  </span>
                  {node.affects && node.affects.length > 0 && (
                    <span className="flex items-center gap-1 text-accent">
                      <ArrowRightIcon className="h-2.5 w-2.5" /> {node.affects.length}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Floating empty search state if query matches nothing */}
      {q && !items.some((i) => (i.label + ' ' + i.detail).toLowerCase().includes(q)) && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 rounded-lg border border-line bg-surface/90 px-4 py-2 backdrop-blur-md font-mono text-2xs text-fg-muted shadow-xl">
          No graph nodes matching "{searchQuery}"
        </div>
      )}
    </div>
  );
}
