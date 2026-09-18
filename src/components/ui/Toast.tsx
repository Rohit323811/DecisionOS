import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangleIcon, CheckIcon, InfoIcon, XIcon } from 'lucide-react';

type ToastTone = 'info' | 'success' | 'warning';

interface ToastItem {
  id: number;
  message: string;
  detail?: string;
  tone: ToastTone;
}

interface ToastApi {
  toast: (message: string, opts?: {detail?: string;tone?: ToastTone;}) => void;
}

const ToastContext = createContext<ToastApi>({ toast: () => undefined });

export function useToast() {
  return useContext(ToastContext);
}

const ICONS: Record<ToastTone, React.ComponentType<{className?: string;}>> = {
  info: InfoIcon,
  success: CheckIcon,
  warning: AlertTriangleIcon
};

const TONE_COLOR: Record<ToastTone, string> = {
  info: 'text-accent',
  success: 'text-positive',
  warning: 'text-warning'
};

export function ToastProvider({ children }: {children: React.ReactNode;}) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback<ToastApi['toast']>(
    (message, opts) => {
      const id = Date.now() + Math.random();
      setItems((prev) => [...prev.slice(-2), { id, message, detail: opts?.detail, tone: opts?.tone ?? 'info' }]);
      window.setTimeout(() => dismiss(id), 3600);
    },
    [dismiss]
  );

  const api = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-[340px] flex-col gap-2">
        <AnimatePresence initial={false}>
          {items.map((t) => {
            const Icon = ICONS[t.tone];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                className="pointer-events-auto flex items-start gap-3 rounded-md border border-line-strong bg-elevated px-3.5 py-3 shadow-pop">
                
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${TONE_COLOR[t.tone]}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-fg">{t.message}</p>
                  {t.detail &&
                  <p className="mt-0.5 text-[12px] leading-snug text-fg-muted">{t.detail}</p>
                  }
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="text-fg-muted transition-colors duration-150 ease-out hover:text-fg">
                  
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              </motion.div>);

          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>);

}