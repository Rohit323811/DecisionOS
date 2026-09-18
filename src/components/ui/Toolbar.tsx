import React from 'react';
import { cn } from '../../utils/cn';

export function Toolbar({
  children,
  className,
  sticky = false




}: {children: React.ReactNode;className?: string;sticky?: boolean;}) {
  return (
    <div
      className={cn(
        'flex h-12 items-center gap-2 border-b border-line bg-surface/90 px-4 backdrop-blur-sm',
        sticky && 'sticky top-0 z-30',
        className
      )}>
      
      {children}
    </div>);

}

export function ToolbarGroup({
  children,
  className



}: {children: React.ReactNode;className?: string;}) {
  return <div className={cn('flex items-center gap-1', className)}>{children}</div>;
}

export function ToolbarDivider() {
  return <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-line" />;
}

export function ToolbarSpacer() {
  return <span className="flex-1" />;
}