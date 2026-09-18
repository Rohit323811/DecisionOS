import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon } from 'lucide-react';
import { IconButton } from './Button';

export function SidePanel({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  width = 420








}: {open: boolean;onClose: () => void;title: string;eyebrow?: React.ReactNode;children: React.ReactNode;footer?: React.ReactNode;width?: number;}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open &&
      <div className="fixed inset-0 z-40">
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          onClick={onClose}
          className="absolute inset-0 bg-black/55" />
        
          <motion.aside
          role="dialog"
          aria-label={title}
          initial={{ x: width }}
          animate={{ x: 0 }}
          exit={{ x: width }}
          transition={{ duration: 0.26, ease: [0.23, 1, 0.32, 1] }}
          style={{ width }}
          className="absolute right-0 top-0 flex h-full max-w-[92vw] flex-col border-l border-line-strong bg-surface shadow-panel">
          
            <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div className="min-w-0">
                {eyebrow && <div className="mb-1.5 flex items-center gap-2">{eyebrow}</div>}
                <h2 className="text-[15px] font-semibold leading-snug text-fg">{title}</h2>
              </div>
              <IconButton label="Close panel" size="sm" onClick={onClose}>
                <XIcon className="h-4 w-4" />
              </IconButton>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
            {footer &&
          <footer className="flex items-center justify-between gap-2 border-t border-line bg-[#0d0f12] px-5 py-3">
                {footer}
              </footer>
          }
          </motion.aside>
        </div>
      }
    </AnimatePresence>);

}