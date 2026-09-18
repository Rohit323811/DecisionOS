import React from 'react';
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  HelpCircleIcon,
  LayersIcon,
  RefreshCwIcon,
  SlidersHorizontalIcon
} from 'lucide-react';
import { cn } from '../../utils/cn';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-[#191d22]', className)} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-12" />
      </div>
      <Skeleton className="mt-3.5 h-4 w-2/3" />
      <Skeleton className="mt-2 h-3 w-full" />
      <Skeleton className="mt-1.5 h-3 w-4/5" />
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block h-4 w-4 animate-spin rounded-full border-[1.5px] border-current border-t-transparent',
        className
      )}
    />
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-line text-center',
        compact ? 'px-5 py-8' : 'px-8 py-14'
      )}
    >
      {icon && <div className="mb-3 text-fg-muted">{icon}</div>}
      <p className="text-sm font-medium text-fg-secondary">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-fg-muted">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Loading model state */
export function LoadingModelState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-surface p-8 text-center space-y-3">
      <Spinner className="h-6 w-6 text-accent" />
      <h3 className="text-sm font-semibold text-fg">Constructing Decision Model...</h3>
      <p className="text-2xs text-fg-muted max-w-sm leading-relaxed">
        Extracting goals, options, variables, constraints, and dependencies from natural language input.
      </p>
    </div>
  );
}

/** Missing information required state */
export function MissingInfoState({ onResolve }: { onResolve?: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-5 text-center space-y-3">
      <HelpCircleIcon className="h-6 w-6 text-amber-400 mx-auto" />
      <h3 className="text-sm font-semibold text-amber-300">User Input Required</h3>
      <p className="text-2xs text-fg-muted max-w-sm mx-auto leading-relaxed">
        Certain variables require explicit quantitative bounds or values before propagation can run accurately.
      </p>
      {onResolve && (
        <button
          onClick={onResolve}
          className="rounded-lg bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 font-mono text-2xs font-semibold text-amber-300 hover:bg-amber-500/30"
        >
          Resolve Information Gaps
        </button>
      )}
    </div>
  );
}

/** Insufficient quantitative data for sensitivity state */
export function InsufficientDataState() {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface/50 p-6 text-center space-y-2.5 select-none">
      <SlidersHorizontalIcon className="h-6 w-6 text-fg-muted mx-auto" />
      <h4 className="text-xs font-semibold text-fg">Insufficient Quantitative Data</h4>
      <p className="text-2xs text-fg-muted max-w-md mx-auto leading-relaxed font-sans">
        Sensitivity analysis requires defined numeric ranges or formulaic relationships between variables. Currently, the model contains qualitative relationships that cannot be quantified without additional user estimates.
      </p>
    </div>
  );
}

/** AI Extraction Error State */
export function AIExtractionErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-center space-y-3">
      <AlertTriangleIcon className="h-6 w-6 text-red-400 mx-auto" />
      <h3 className="text-sm font-semibold text-red-300">Natural Language Extraction Failed</h3>
      <p className="text-2xs text-fg-muted max-w-md mx-auto leading-relaxed">
        The input text could not be parsed into a valid dependency graph. Try rephrasing with explicit goals or variables.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg bg-red-500/20 border border-red-500/40 px-3 py-1.5 font-mono text-2xs text-red-300 hover:bg-red-500/30 flex items-center gap-1.5 mx-auto"
        >
          <RefreshCwIcon className="h-3 w-3" /> Rephrase Input
        </button>
      )}
    </div>
  );
}

/** Empty Scenario State */
export function EmptyScenarioState({ onCreate }: { onCreate?: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface p-6 text-center space-y-3">
      <LayersIcon className="h-6 w-6 text-accent mx-auto" />
      <h3 className="text-sm font-semibold text-fg">No Alternative Scenarios Created</h3>
      <p className="text-2xs text-fg-muted max-w-sm mx-auto leading-relaxed">
        Create distinct scenario states to evaluate how varying parameter values affect downstream goals.
      </p>
      {onCreate && (
        <button
          onClick={onCreate}
          className="rounded-lg bg-accent/20 border border-accent/40 px-3 py-1.5 font-mono text-2xs text-accent hover:bg-accent/30 mx-auto"
        >
          Create First Scenario
        </button>
      )}
    </div>
  );
}

/** Saved State Indicator */
export function SavedStateIndicator() {
  return (
    <div className="inline-flex items-center gap-1.5 font-mono text-2xs text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
      <CheckCircle2Icon className="h-3 w-3 text-emerald-400" /> Model Persisted
    </div>
  );
}
