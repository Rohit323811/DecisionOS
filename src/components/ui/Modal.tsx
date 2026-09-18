import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon } from 'lucide-react';
import { IconButton } from './Button';

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer







}: {open: boolean;onClose: () => void;title: string;description?: string;children?: React.ReactNode;footer?: React.ReactNode;}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open &&
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />
        
          <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          className="relative w-full max-w-lg overflow-hidden rounded-xl border border-line-strong bg-elevated shadow-panel">
          
            <header className="flex items-start justify-between gap-6 border-b border-line px-5 py-4">
              <div>
                <h2 className="text-[15px] font-semibold text-fg">{title}</h2>
                {description &&
              <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">{description}</p>
              }
              </div>
              <IconButton label="Close" size="sm" onClick={onClose}>
                <XIcon className="h-4 w-4" />
              </IconButton>
            </header>
            {children && <div className="px-5 py-4">{children}</div>}
            {footer &&
          <footer className="flex items-center justify-end gap-2 border-t border-line bg-[#121418] px-5 py-3">
                {footer}
              </footer>
          }
          </motion.div>
        </div>
      }
    </AnimatePresence>);

}