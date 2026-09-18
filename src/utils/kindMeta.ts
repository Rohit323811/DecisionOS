import {
  CircleDashedIcon,
  GitBranchIcon,
  LockIcon,
  QuoteIcon,
  SlidersHorizontalIcon,
  TargetIcon } from
'lucide-react';
import type { ComponentType } from 'react';
import { ItemKind } from '../types/decision';
import { BadgeTone } from '../components/ui/Badge';

export interface KindMeta {
  icon: ComponentType<{className?: string;}>;
  /** Text/stroke color class */
  color: string;
  /** Faint fill used behind icons and graph nodes */
  fill: string;
  tone: BadgeTone;
  abbr: string;
}

export const KIND_META: Record<ItemKind, KindMeta> = {
  goal: {
    icon: TargetIcon,
    color: 'text-positive',
    fill: 'bg-[#111c14] border-[#2b4331]',
    tone: 'positive',
    abbr: 'GL'
  },
  option: {
    icon: GitBranchIcon,
    color: 'text-accent',
    fill: 'bg-[#101f1d] border-[#2c4a47]',
    tone: 'accent',
    abbr: 'OP'
  },
  variable: {
    icon: SlidersHorizontalIcon,
    color: 'text-fg',
    fill: 'bg-[#181b20] border-line-strong',
    tone: 'neutral',
    abbr: 'VR'
  },
  constraint: {
    icon: LockIcon,
    color: 'text-negative',
    fill: 'bg-[#1e1413] border-[#4a2e2b]',
    tone: 'negative',
    abbr: 'CN'
  },
  unknown: {
    icon: CircleDashedIcon,
    color: 'text-unknown',
    fill: 'bg-transparent border-dashed border-[#3a4049]',
    tone: 'unknown',
    abbr: 'UK'
  },
  assumption: {
    icon: QuoteIcon,
    color: 'text-warning',
    fill: 'bg-[#1e1810] border-[#4a3b23]',
    tone: 'warning',
    abbr: 'AS'
  }
};