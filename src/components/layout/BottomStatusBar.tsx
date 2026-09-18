import { HelpCircleIcon, LayersIcon, MousePointerIcon } from 'lucide-react';
import { ModelEdge, ModelItem } from '../../types/decision';

interface BottomStatusBarProps {
  items: ModelItem[];
  edges: ModelEdge[];
  activeScenarioTitle?: string;
  zoom: number;
  selectedNodeLabel?: string | null;
  onResetView?: () => void;
}

export function BottomStatusBar({
  items,
  edges,
  activeScenarioTitle = 'Current situation',
  zoom,
  selectedNodeLabel,
  onResetView
}: BottomStatusBarProps) {
  const variablesCount = items.filter((i) => i.kind === 'variable' || i.kind === 'input' || i.kind === 'computed').length;
  const unknownCount = items.filter((i) => i.kind === 'unknown' || i.origin === 'unknown').length;
  const assumptionCount = items.filter((i) => i.kind === 'assumption').length;

  return (
    <footer className="sticky bottom-0 z-20 flex h-9 items-center justify-between border-t border-line bg-bg/95 px-4 font-mono text-2xs text-fg-muted backdrop-blur-md select-none shrink-0">
      {/* Left section: Model stats summary */}
      <div className="flex items-center gap-2">
        <span className="text-fg-secondary font-medium">
          {variablesCount} variables
        </span>
        <span className="text-[#3b4149]">·</span>
        <span className="text-fg-secondary font-medium">
          {edges.length} relationships
        </span>
        <span className="text-[#3b4149]">·</span>
        <span className="text-amber-400 font-medium">
          {unknownCount} unknowns
        </span>
        <span className="text-[#3b4149]">·</span>
        <span className="text-indigo-300 font-medium">
          {assumptionCount} assumptions
        </span>
      </div>

      {/* Center section: Selected node or scenario hint */}
      <div className="hidden sm:flex items-center gap-2">
        {selectedNodeLabel ? (
          <span className="flex items-center gap-1.5 text-accent font-medium bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
            <MousePointerIcon className="h-3 w-3" /> Focus: {selectedNodeLabel}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-fg-muted">
            <LayersIcon className="h-3 w-3 text-accent" /> Active State: <span className="text-fg-secondary">{activeScenarioTitle}</span>
          </span>
        )}
      </div>

      {/* Right section: Zoom %, shortcuts hint, view reset */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1 text-fg-muted">
          <HelpCircleIcon className="h-3 w-3 text-fg-muted" /> Drag to pan · Alt+Scroll zoom
        </span>

        <span className="text-[#3b4149]">|</span>

        <button
          onClick={onResetView}
          className="hover:text-fg text-fg-secondary transition-colors"
        >
          Zoom: {Math.round(zoom * 100)}%
        </button>
      </div>
    </footer>
  );
}
