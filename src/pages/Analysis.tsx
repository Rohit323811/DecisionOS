import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckIcon } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { Button } from '../components/ui/Button';
import { useDecision } from '../contexts/DecisionContext';
import { ItemKind } from '../types/decision';
import { cn } from '../utils/cn';

const STAGE_MS = 780;

export function Analysis() {
  const navigate = useNavigate();
  const { prompt, buildModelFor, commitModel } = useDecision();
  const [stage, setStage] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const model = useMemo(() => buildModelFor(prompt), [prompt, buildModelFor]);

  const count = (kind: ItemKind) => model.items.filter((i) => i.kind === kind).length;
  const edges = model.items.reduce((n, i) => n + (i.affects?.length ?? 0), 0);

  const stages = useMemo(
    () => [
    { label: 'Analyzing decision', result: 'situation parsed' },
    { label: 'Identifying goals', result: `${count('goal')} goals` },
    { label: 'Finding variables', result: `${count('variable')} variables` },
    {
      label: 'Detecting constraints',
      result: `${count('constraint')} constraints · ${count('unknown')} unknowns`
    },
    { label: 'Mapping dependencies', result: `${edges} edges` },
    { label: 'Building model', result: `${model.items.length} nodes` }],

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [model]
  );

  useEffect(() => {
    if (!prompt.trim()) {
      navigate('/new', { replace: true });
      return;
    }
    const tick = window.setInterval(() => setElapsed((e) => e + 100), 100);
    const step = window.setInterval(() => setStage((s) => s + 1), STAGE_MS);
    return () => {
      window.clearInterval(tick);
      window.clearInterval(step);
    };
  }, [prompt, navigate]);

  useEffect(() => {
    if (stage < stages.length) return;
    commitModel(model);
    const t = window.setTimeout(() => navigate('/model', { replace: true }), 420);
    return () => window.clearTimeout(t);
  }, [stage, stages.length, commitModel, model, navigate]);

  const progress = Math.min(stage / stages.length, 1);

  return (
    <div className="min-h-full w-full bg-bg">
      <TopBar
        center={
        <span className="font-mono text-2xs text-fg-muted">
            session<span className="text-[#3b4149]">/</span>
            <span className="text-fg-secondary">analysis</span>
          </span>
        }
        right={
        <span className="font-mono text-2xs tabular-nums text-fg-muted">
            {(elapsed / 1000).toFixed(1)}s
          </span>
        } />
      

      <div className="h-px w-full bg-line">
        <motion.div
          className="h-px bg-accent"
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }} />
        
      </div>

      <main className="mx-auto w-full max-w-[720px] px-6 py-16">
        <p className="font-mono text-2xs uppercase tracking-[0.16em] text-fg-muted">
          Interpreting situation
        </p>
        <p className="mt-4 border-l border-line pl-4 text-[15px] leading-relaxed text-fg-secondary">
          “{prompt}”
        </p>

        <ol className="mt-12">
          {stages.map((s, i) => {
            const done = i < stage;
            const active = i === stage;
            return (
              <li key={s.label} className="relative flex gap-4 pb-7 last:pb-0">
                {i < stages.length - 1 &&
                <span
                  aria-hidden
                  className={cn(
                    'absolute left-[9px] top-6 h-[calc(100%-12px)] w-px transition-colors duration-300 ease-out',
                    done ? 'bg-accent/40' : 'bg-line'
                  )} />

                }

                <span
                  className={cn(
                    'relative z-10 mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border bg-bg transition-colors duration-200 ease-out',
                    done ?
                    'border-accent/60 text-accent' :
                    active ?
                    'border-accent text-accent' :
                    'border-line text-fg-muted'
                  )}>
                  
                  {done ?
                  <CheckIcon className="h-3 w-3" /> :
                  active ?
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> :

                  <span className="h-1 w-1 rounded-full bg-[#333940]" />
                  }
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-4">
                    <span
                      className={cn(
                        'text-[15px] transition-colors duration-200 ease-out',
                        done ? 'text-fg-secondary' : active ? 'text-fg' : 'text-fg-muted'
                      )}>
                      
                      {s.label}
                    </span>

                    <AnimatePresence>
                      {done &&
                      <motion.span
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                        className="shrink-0 font-mono text-2xs tabular-nums text-accent">
                        
                          {s.result}
                        </motion.span>
                      }
                    </AnimatePresence>
                  </div>

                  {active &&
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    className="mt-2 h-px w-full overflow-hidden bg-line">
                    
                      <motion.div
                      className="h-px w-1/3 bg-accent/70"
                      animate={{ x: ['-100%', '320%'] }}
                      transition={{ duration: STAGE_MS / 1000, ease: 'linear', repeat: Infinity }} />
                    
                    </motion.div>
                  }
                </div>
              </li>);

          })}
        </ol>

        <div className="mt-14 flex items-center justify-between border-t border-line pt-5">
          <p className="max-w-[46ch] font-mono text-2xs leading-relaxed text-fg-muted">
            interpretation is generated · propagation is computed · nothing is recommended
          </p>
          <Button size="sm" variant="ghost" onClick={() => navigate('/new')}>
            Cancel
          </Button>
        </div>
      </main>
    </div>);

}