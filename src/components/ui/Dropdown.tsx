import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface DropdownOption {
  value: string;
  label: string;
  description?: string;
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select',
  align = 'left',
  className,
  triggerLabel








}: {options: DropdownOption[];value?: string;onChange: (value: string) => void;placeholder?: string;align?: 'left' | 'right';className?: string;triggerLabel?: string;}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-9 w-full items-center justify-between gap-3 rounded-md border border-line bg-[#0d0f12]',
          'px-3 text-[13px] text-fg transition-colors duration-150 ease-out hover:border-line-strong'
        )}>
        
        <span className={cn('truncate', !selected && 'text-fg-muted')}>
          {triggerLabel ?? selected?.label ?? placeholder}
        </span>
        <ChevronDownIcon
          aria-hidden
          className={cn(
            'h-4 w-4 shrink-0 text-fg-muted transition-transform duration-150 ease-out',
            open && 'rotate-180'
          )} />
        
      </button>

      <AnimatePresence>
        {open &&
        <motion.ul
          role="listbox"
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
          className={cn(
            'absolute z-40 mt-1.5 max-h-72 w-full min-w-[220px] overflow-auto rounded-md border border-line-strong',
            'bg-elevated p-1 shadow-pop',
            align === 'right' ? 'right-0' : 'left-0'
          )}>
          
            {options.map((o) =>
          <li key={o.value}>
                <button
              type="button"
              role="option"
              aria-selected={o.value === value}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-start gap-2 rounded px-2 py-1.5 text-left',
                'transition-colors duration-150 ease-out hover:bg-[#1b1f25]'
              )}>
              
                  <CheckIcon
                aria-hidden
                className={cn(
                  'mt-0.5 h-3.5 w-3.5 shrink-0 text-accent',
                  o.value === value ? 'opacity-100' : 'opacity-0'
                )} />
              
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] text-fg">{o.label}</span>
                    {o.description &&
                <span className="mt-0.5 block text-[12px] leading-snug text-fg-muted">
                        {o.description}
                      </span>
                }
                  </span>
                </button>
              </li>
          )}
          </motion.ul>
        }
      </AnimatePresence>
    </div>);

}