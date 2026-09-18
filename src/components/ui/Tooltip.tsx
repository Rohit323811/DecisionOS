import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export function Tooltip({
  content,
  children,
  side = 'top',
  className





}: {content: React.ReactNode;children: React.ReactNode;side?: 'top' | 'bottom' | 'right';className?: string;}) {
  const [open, setOpen] = useState(false);

  const position =
  side === 'top' ?
  'bottom-full left-1/2 -translate-x-1/2 mb-2' :
  side === 'bottom' ?
  'top-full left-1/2 -translate-x-1/2 mt-2' :
  'left-full top-1/2 -translate-y-1/2 ml-2';

  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}>
      
      {children}
      <AnimatePresence>
        {open &&
        <motion.span
          role="tooltip"
          initial={{ opacity: 0, y: side === 'bottom' ? -3 : 3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: side === 'bottom' ? -3 : 3 }}
          transition={{ duration: 0.14, ease: [0.23, 1, 0.32, 1] }}
          className={cn(
            'pointer-events-none absolute z-50 w-max max-w-[260px] rounded border border-line-strong',
            'bg-elevated px-2.5 py-1.5 text-left text-[12px] leading-snug text-fg-secondary shadow-pop',
            position
          )}>
          
            {content}
          </motion.span>
        }
      </AnimatePresence>
    </span>);

}