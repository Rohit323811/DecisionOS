import React from 'react';
import { cn } from '../../utils/cn';

export function Skeleton({ className }: {className?: string;}) {
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
    </div>);

}

export function Spinner({ className }: {className?: string;}) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block h-4 w-4 animate-spin rounded-full border-[1.5px] border-current border-t-transparent',
        className
      )} />);


}

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false






}: {icon?: React.ReactNode;title: string;description?: string;action?: React.ReactNode;compact?: boolean;}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-line text-center',
        compact ? 'px-5 py-8' : 'px-8 py-14'
      )}>
      
      {icon && <div className="mb-3 text-fg-muted">{icon}</div>}
      <p className="text-sm font-medium text-fg-secondary">{title}</p>
      {description &&
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-fg-muted">{description}</p>
      }
      {action && <div className="mt-4">{action}</div>}
    </div>);

}