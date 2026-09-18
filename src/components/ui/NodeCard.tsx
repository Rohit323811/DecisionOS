import { ArrowRightIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { ModelItem } from '../../types/decision';
import { KIND_META } from '../../utils/kindMeta';
import { cn } from '../../utils/cn';
import { Badge, OriginBadge } from './Badge';

/**
 * The atomic unit of the model. Used in the review list, the graph inspector and
 * anywhere a single node needs to be represented. Density is content-driven:
 * a node with no facts and no links renders as two lines.
 */
export function NodeCard({
  item,
  affectsCount = 0,
  selected = false,
  dimmed = false,
  onClick,
  index = 0







}: {item: ModelItem;affectsCount?: number;selected?: boolean;dimmed?: boolean;onClick?: () => void;index?: number;}) {
  const meta = KIND_META[item.kind];
  const Icon = meta.icon;
  const isUnknown = item.kind === 'unknown' || item.origin === 'unknown';

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: dimmed ? 0.45 : 1, y: 0 }}
      transition={{
        duration: 0.22,
        ease: [0.23, 1, 0.32, 1],
        delay: Math.min(index * 0.03, 0.24)
      }}
      className={cn(
        'group relative w-full overflow-hidden rounded-lg border bg-surface p-4 text-left',
        'transition-[border-color,background-color] duration-150 ease-out',
        isUnknown ? 'border-dashed border-[#343a43]' : 'border-line',
        selected ?
        'border-accent/60 bg-[#101518]' :
        'hover:border-line-strong hover:bg-[#121519]'
      )}
      aria-pressed={selected}>
      
      <span
        aria-hidden
        className={cn(
          'absolute left-0 top-0 h-full w-px transition-opacity duration-150 ease-out',
          selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-60',
          'bg-accent'
        )} />
      

      <div className="flex items-start gap-3">
        <span
          className={cn(
            'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded border',
            meta.fill
          )}>
          
          <Icon className={cn('h-3.5 w-3.5', meta.color)} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h4 className="text-[14px] font-medium leading-snug text-fg">{item.label}</h4>
            <OriginBadge origin={item.origin} />
          </div>

          <p className="mt-1.5 text-[13px] leading-relaxed text-fg-secondary">{item.detail}</p>

          {(item.facts?.length || item.range || affectsCount > 0 || item.confidence) &&
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {item.range &&
            <span className="font-mono text-2xs text-fg-secondary">
                  <span className="text-fg">{item.range.value}</span>
                  <span className="text-fg-muted"> {item.range.unit}</span>
                  <span className="ml-1.5 text-fg-muted">
                    [{item.range.min}–{item.range.max}]
                  </span>
                </span>
            }
              {item.facts?.map((f) =>
            <span key={f.label} className="font-mono text-2xs text-fg-muted">
                  {f.label}
                  <span className="mx-1 text-[#3b4149]">=</span>
                  <span className="text-fg-secondary">{f.value}</span>
                </span>
            )}
              {item.confidence &&
            <Badge
              tone={
              item.confidence === 'low' ?
              'warning' :
              item.confidence === 'high' ?
              'neutral' :
              'neutral'
              }
              mono>
              
                  {item.confidence} confidence
                </Badge>
            }
              {affectsCount > 0 &&
            <span className="inline-flex items-center gap-1 font-mono text-2xs text-fg-muted">
                  <ArrowRightIcon className="h-3 w-3" />
                  affects {affectsCount}
                </span>
            }
            </div>
          }
        </div>
      </div>
    </motion.button>);

}