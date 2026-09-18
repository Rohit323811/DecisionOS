import {
  CalculatorIcon,
  CircleDashedIcon,
  CompassIcon,
  GitBranchIcon,
  LockIcon,
  QuoteIcon,
  SlidersHorizontalIcon,
  TargetIcon,
  TrendingUpIcon
} from 'lucide-react';
import type { ComponentType } from 'react';
import { ItemKind } from '../types/decision';
import { BadgeTone } from '../components/ui/Badge';

export interface KindMeta {
  icon: ComponentType<{ className?: string }>;
  /** Text/stroke color class */
  color: string;
  /** Faint fill used behind icons and graph nodes */
  fill: string;
  tone: BadgeTone;
  abbr: string;
  borderStyle?: string;
  headerBg?: string;
}

export const KIND_META: Record<ItemKind, KindMeta> = {
  decision: {
    icon: CompassIcon,
    color: 'text-accent',
    fill: 'bg-[#102422] border-[#2c4a47]',
    tone: 'accent',
    abbr: 'DC',
    headerBg: 'bg-[#102422]'
  },
  option: {
    icon: GitBranchIcon,
    color: 'text-[#5fd6c7]',
    fill: 'bg-[#101f1d] border-[#2c4a47]',
    tone: 'accent',
    abbr: 'OP',
    headerBg: 'bg-[#101f1d]'
  },
  input: {
    icon: SlidersHorizontalIcon,
    color: 'text-fg',
    fill: 'bg-[#181b20] border-line-strong',
    tone: 'neutral',
    abbr: 'IN',
    headerBg: 'bg-[#181b20]'
  },
  variable: {
    icon: SlidersHorizontalIcon,
    color: 'text-fg-secondary',
    fill: 'bg-[#16181d] border-line',
    tone: 'neutral',
    abbr: 'VR',
    headerBg: 'bg-[#16181d]'
  },
  computed: {
    icon: CalculatorIcon,
    color: 'text-[#a78bfa]',
    fill: 'bg-[#1a162b] border-[#4c3a70]',
    tone: 'neutral',
    abbr: 'CP',
    headerBg: 'bg-[#1a162b]'
  },
  goal: {
    icon: TargetIcon,
    color: 'text-positive',
    fill: 'bg-[#111c14] border-[#2b4331]',
    tone: 'positive',
    abbr: 'GL',
    headerBg: 'bg-[#111c14]'
  },
  constraint: {
    icon: LockIcon,
    color: 'text-negative',
    fill: 'bg-[#1e1413] border-[#4a2e2b]',
    tone: 'negative',
    abbr: 'CN',
    headerBg: 'bg-[#1e1413]'
  },
  impact: {
    icon: TrendingUpIcon,
    color: 'text-[#f97316]',
    fill: 'bg-[#221711] border-[#522a15]',
    tone: 'warning',
    abbr: 'IM',
    headerBg: 'bg-[#221711]'
  },
  assumption: {
    icon: QuoteIcon,
    color: 'text-warning',
    fill: 'bg-[#1e1810] border-[#4a3b23]',
    tone: 'warning',
    abbr: 'AS',
    headerBg: 'bg-[#1e1810]'
  },
  unknown: {
    icon: CircleDashedIcon,
    color: 'text-unknown',
    fill: 'bg-transparent border-dashed border-[#3a4049]',
    tone: 'unknown',
    abbr: 'UK',
    borderStyle: 'border-dashed border-[#3a4049]',
    headerBg: 'bg-[#14161b]'
  }
};
