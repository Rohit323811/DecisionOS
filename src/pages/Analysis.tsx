import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangleIcon, CheckIcon, RotateCcwIcon } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { Button } from '../components/ui/Button';
import { StatusDot } from '../components/ui/Badge';
import { useDecision } from '../contexts/DecisionContext';
import { ItemKind } from '../types/decision';
import { cn } from '../utils/cn';

const STAGE_MS = 780;

export function Analysis() {
  const navigate = useNavigate();
  const {
    prompt,
    analysisStatus,
    analysisStage,
    analysisError,
    analysisMeta,
    draftModel,
    analyze,
    runDemo,
    cancelAnalysis,
  } = useDecision();
  const [stage, setStage] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startedRef = useRef(false);

  // Kick off the real analysis exactly once when arriving with a prompt.
  useEffect(() => {
    if (startedRef.current) return;
    if (!prompt.trim()) {
      navigate('/new', { replace: true });
      return;
    }
    startedRef.current = true;
    void analyze(prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const count = (kind: ItemKind) => draftModel?.items.filter((i) => i.kind === kind).length ?? null;
  const edgeCount = draftModel?.edges?.length ?? null;

  const stages = useMemo(
    () => [
      { label: 'Analyzing decision', result: 'situation parsed' },
      { label: 'Identifying goals', result: count('goal') !== null ? `${count('goal')} goals` : '…' },
      {
        label: 'Finding variables',
        result:
          count('input') !== null || count('variable') !== null
            ? `${(count('input') ?? 0) + (count('variable') ?? 0)} variables`
            : '…',
      },
      {
        label: 'Detecting constraints',
        result:
          count('constraint') !== null
            ? `${count('constraint')} constraints · ${count('unknown')} unknowns`
            : '…',
      },
      { label: 'Mapping dependencies', result: edgeCount !== null ? `${edgeCount} edges` : '…' },
      { label: 'Building model', result: draftModel ? `${draftModel.items.length} nodes` : '…' },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draftModel]
  );

  // Elapsed timer while a real analysis is running.
  useEffect(() => {
    if (analysisStatus !== 'analyzing') return;
    const tick = window.setInterval(() => setElapsed((e) => e + 100), 100);
    return () => window.clearInterval(tick);
  }, [analysisStatus]);

  // Visual stage ticker — held at the last real milestone reported by the service.
  useEffect(() => {
    if (analysisStatus !== 'analyzing') return;
    const step = window.setInterval(() => {
      setStage((s) => Math.min(Math.max(s + 1, analysisStage), stages.length - 1));
    }, STAGE_MS);
    return () => window.clearInterval(step);
  }, [analysisStatus, analysisStage, stages.length]);

  // Sync to real milestones as they arrive.
  useEffect(() => {
    if (analysisStage > stage) setStage(analysisStage);
  }, [analysisStage, stage]);

  // Done → model review. Errors stay on this page with recovery actions.
  useEffect(() => {
    if (analysisStatus !== 'done') return;
    const t = window.setTimeout(() => navigate('/review', { replace: true }), 420);
    return () => window.clearTimeout(t);
  }, [analysisStatus, navigate]);

  const failed = analysisStatus === 'error';
  const progress = Math.min((failed ? stage : stage + 1) / stages.length, 1);

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
          className={cn('h-px', failed ? 'bg-negative' : 'bg-accent')}
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

        {failed ? (
          <div className="mt-10 rounded-xl border border-negative/40 bg-[#1a1213] p-5">
            <div className="flex items-center gap-2">
              <AlertTriangleIcon className="h-4 w-4 text-negative" />
              <span className="font-mono text-2xs uppercase tracking-[0.14em] text-negative font-semibold">
                Analysis failed
              </span>
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-fg-secondary">
              {analysisError?.message ?? 'The analysis could not be completed.'}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-line pt-4">
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  startedRef.current = false;
                  setStage(0);
                  setElapsed(0);
                  void analyze(prompt);
                }}>
                <RotateCcwIcon className="h-3.5 w-3.5" />
                Retry analysis
              </Button>
              <Button size="sm" variant="secondary" onClick={() => runDemo(prompt)}>
                Continue with demo model
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { cancelAnalysis(); navigate('/new'); }}>
                Edit situation
              </Button>
            </div>
            <p className="mt-4 font-mono text-2xs leading-relaxed text-fg-muted">
              {analysisError?.hint ?? 'The demo model uses the same schema and runs without an API key.'}
            </p>
          </div>
        ) : (
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
                </li>
              );
            })}
          </ol>
        )}

        <div className="mt-14 flex items-center justify-between border-t border-line pt-5">
          <p className="flex items-center gap-2 font-mono text-2xs leading-relaxed text-fg-muted">
            <StatusDot
              tone={failed ? 'negative' : analysisStatus === 'done' ? 'positive' : 'accent'}
              pulse={analysisStatus === 'analyzing'} />
            {analysisStatus === 'done'
              ? 'model ready — review what was discovered'
              : failed
                ? 'nothing was changed — you can retry or fall back'
                : analysisMeta?.source === 'demo'
                  ? 'demo mode · interpretation is generated locally'
                  : 'interpretation is generated · propagation is computed · nothing is recommended'}
          </p>
          {!failed && (
            <Button size="sm" variant="ghost" onClick={() => { cancelAnalysis(); navigate('/new'); }}>
              Cancel
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
