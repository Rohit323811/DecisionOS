import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export function Tabs({
  items,
  value,
  onChange,
  className





}: {items: TabItem[];value: string;onChange: (id: string) => void;className?: string;}) {
  return (
    <div role="tablist" className={cn('flex items-center gap-1 overflow-x-auto', className)}>
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              'relative flex shrink-0 items-center gap-2 rounded px-3 py-1.5 text-[13px]',
              'transition-colors duration-150 ease-out',
              active ? 'text-fg' : 'text-fg-muted hover:text-fg-secondary'
            )}>
            
            {active &&
            <motion.span
              layoutId="tab-pill"
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="absolute inset-0 rounded border border-line-strong bg-elevated" />

            }
            <span className="relative">{item.label}</span>
            {item.count !== undefined &&
            <span
              className={cn(
                'relative font-mono text-2xs tabular-nums',
                active ? 'text-accent' : 'text-fg-muted'
              )}>
              
                {item.count}
              </span>
            }
          </button>);

      })}
    </div>);

}