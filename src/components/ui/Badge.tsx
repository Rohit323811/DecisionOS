import React from 'react';
import { cn } from '../../utils/cn';
import { Origin } from '../../types/decision';

export type BadgeTone =
'neutral' |
'accent' |
'positive' |
'warning' |
'negative' |
'unknown';

const TONES: Record<BadgeTone, string> = {
  neutral: 'border-line text-fg-secondary bg-[#141719]',
  accent: 'border-[#2c4a47] text-accent bg-[#101f1d]',
  positive: 'border-[#2b4331] text-positive bg-[#111c14]',
  warning: 'border-[#4a3b23] text-warning bg-[#1e1810]',
  negative: 'border-[#4a2e2b] text-negative bg-[#1e1413]',
  unknown: 'border-dashed border-[#3a4049] text-unknown bg-transparent'
};

export function Badge({
  tone = 'neutral',
  children,
  className,
  mono = false





}: {tone?: BadgeTone;children: React.ReactNode;className?: string;mono?: boolean;}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-2xs leading-none',
        mono ? 'font-mono tracking-tight' : 'font-medium tracking-wide',
        TONES[tone],
        className
      )}>
      
      {children}
    </span>);

}

export function StatusDot({
  tone = 'neutral',
  pulse = false,
  className




}: {tone?: BadgeTone;pulse?: boolean;className?: string;}) {
  const color: Record<BadgeTone, string> = {
    neutral: 'bg-fg-muted',
    accent: 'bg-accent',
    positive: 'bg-positive',
    warning: 'bg-warning',
    negative: 'bg-negative',
    unknown: 'bg-unknown'
  };
  return (
    <span className={cn('relative inline-flex h-1.5 w-1.5', className)}>
      {pulse &&
      <span
        className={cn('absolute inset-0 animate-ping rounded-full opacity-60', color[tone])}
        aria-hidden />

      }
      <span className={cn('relative h-1.5 w-1.5 rounded-full', color[tone])} />
    </span>);

}

const ORIGIN_TONE: Record<Origin, BadgeTone> = {
  user: 'accent',
  inferred: 'neutral',
  unknown: 'unknown'
};

const ORIGIN_TEXT: Record<Origin, string> = {
  user: 'from you',
  inferred: 'inferred',
  unknown: 'unknown'
};

export function OriginBadge({ origin }: {origin: Origin;}) {
  return (
    <Badge tone={ORIGIN_TONE[origin]} mono>
      {origin === 'inferred' && <StatusDot tone="neutral" />}
      {ORIGIN_TEXT[origin]}
    </Badge>);

}