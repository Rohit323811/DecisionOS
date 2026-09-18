import {
  ActivityIcon,
  FilterIcon,
  GridIcon,
  ListIcon,
  Maximize2Icon,
  RotateCcwIcon,
  SearchIcon,
  ZoomInIcon,
  ZoomOutIcon
} from 'lucide-react';
import { ItemKind } from '../../types/decision';
import { KIND_META } from '../../utils/kindMeta';
import { Tooltip } from '../ui/Tooltip';
import { cn } from '../../utils/cn';

interface GraphToolbarProps {
  zoom: number;
  searchQuery: string;
  kindFilter: ItemKind | 'all';
  showFlowAnimation: boolean;
  viewMode: 'canvas' | 'list';
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onResetLayout: () => void;
  onSearchChange: (query: string) => void;
  onKindFilterChange: (kind: ItemKind | 'all') => void;
  onToggleFlowAnimation: () => void;
  onToggleViewMode: () => void;
}

export function GraphToolbar({
  zoom,
  searchQuery,
  kindFilter,
  showFlowAnimation,
  viewMode,
  onZoomIn,
  onZoomOut,
  onFitView,
  onResetLayout,
  onSearchChange,
  onKindFilterChange,
  onToggleFlowAnimation,
  onToggleViewMode
}: GraphToolbarProps) {
  const FILTER_OPTIONS: (ItemKind | 'all')[] = [
    'all',
    'decision',
    'option',
    'input',
    'variable',
    'computed',
    'goal',
    'constraint',
    'impact',
    'assumption',
    'unknown'
  ];

  return (
    <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-line/80 bg-surface/90 p-1.5 shadow-2xl backdrop-blur-md select-none">
      {/* Zoom Controls */}
      <div className="flex items-center gap-0.5 rounded-lg border border-line bg-bg/80 p-0.5">
        <Tooltip content="Zoom Out (Alt+Scroll down)">
          <button
            onClick={onZoomOut}
            className="flex h-7 w-7 items-center justify-center rounded text-fg-secondary hover:bg-line hover:text-fg transition-colors"
            aria-label="Zoom Out"
          >
            <ZoomOutIcon className="h-3.5 w-3.5" />
          </button>
        </Tooltip>

        <span className="min-w-[40px] text-center font-mono text-2xs tabular-nums text-fg font-medium">
          {Math.round(zoom * 100)}%
        </span>

        <Tooltip content="Zoom In (Alt+Scroll up)">
          <button
            onClick={onZoomIn}
            className="flex h-7 w-7 items-center justify-center rounded text-fg-secondary hover:bg-line hover:text-fg transition-colors"
            aria-label="Zoom In"
          >
            <ZoomInIcon className="h-3.5 w-3.5" />
          </button>
        </Tooltip>
      </div>

      <Tooltip content="Fit all nodes in view">
        <button
          onClick={onFitView}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-line bg-bg/80 px-2.5 font-mono text-2xs text-fg-secondary hover:border-line-strong hover:text-fg transition-colors"
        >
          <Maximize2Icon className="h-3.5 w-3.5" /> Fit View
        </button>
      </Tooltip>

      <Tooltip content="Reset canvas pan and layout">
        <button
          onClick={onResetLayout}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-bg/80 text-fg-secondary hover:border-line-strong hover:text-fg transition-colors"
          aria-label="Reset Layout"
        >
          <RotateCcwIcon className="h-3.5 w-3.5" />
        </button>
      </Tooltip>

      <div className="h-4 w-px bg-line" />

      {/* Node Search Bar */}
      <div className="relative w-[180px]">
        <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search nodes..."
          className="h-8 w-full rounded-lg border border-line bg-bg/80 pl-8 pr-2.5 font-mono text-2xs text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
        />
      </div>

      <div className="h-4 w-px bg-line" />

      {/* Node Type Filter Select */}
      <div className="flex items-center gap-1">
        <FilterIcon className="h-3.5 w-3.5 text-fg-muted ml-1" />
        <select
          value={kindFilter}
          onChange={(e) => onKindFilterChange(e.target.value as ItemKind | 'all')}
          className="h-8 rounded-lg border border-line bg-bg/80 px-2 font-mono text-2xs text-fg-secondary hover:border-line-strong focus:border-accent focus:outline-none capitalize"
        >
          {FILTER_OPTIONS.map((kind) => {
            const meta = kind !== 'all' ? KIND_META[kind] : null;
            return (
              <option key={kind} value={kind} className="capitalize bg-surface text-fg">
                {kind === 'all' ? 'All Node Types' : `${meta?.abbr || ''} — ${kind}`}
              </option>
            );
          })}
        </select>
      </div>

      <div className="h-4 w-px bg-line" />

      {/* Toggle Relationship Flow Animation */}
      <Tooltip content="Toggle signal flow animations on active edges">
        <button
          onClick={onToggleFlowAnimation}
          className={cn(
            'flex h-8 items-center gap-1.5 rounded-lg border px-2.5 font-mono text-2xs transition-colors',
            showFlowAnimation
              ? 'border-accent/50 bg-[#102422] text-accent'
              : 'border-line bg-bg/80 text-fg-muted hover:text-fg'
          )}
        >
          <ActivityIcon className="h-3.5 w-3.5" /> Flow
        </button>
      </Tooltip>

      {/* View Mode Switcher (Canvas vs List) */}
      <Tooltip content={viewMode === 'canvas' ? 'Switch to List view' : 'Switch to Canvas view'}>
        <button
          onClick={onToggleViewMode}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-line bg-bg/80 px-2.5 font-mono text-2xs text-fg-secondary hover:border-accent hover:text-accent transition-colors"
        >
          {viewMode === 'canvas' ? (
            <>
              <ListIcon className="h-3.5 w-3.5" /> List
            </>
          ) : (
            <>
              <GridIcon className="h-3.5 w-3.5" /> Canvas
            </>
          )}
        </button>
      </Tooltip>
    </div>
  );
}
