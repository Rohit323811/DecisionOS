import React, { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRightIcon, CornerDownLeftIcon } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/FormControls';
import { Dropdown } from '../components/ui/Dropdown';
import { StatusDot } from '../components/ui/Badge';
import { Tooltip } from '../components/ui/Tooltip';
import { useDecision } from '../contexts/DecisionContext';
import { exampleDecisions } from '../data/exampleDecisions';
import { KIND_LABEL, KIND_ORDER } from '../types/decision';
import { KIND_META } from '../utils/kindMeta';

const MIN_CHARS = 40;
const IDEAL_CHARS = 120;

const GUIDANCE = [
{
  title: 'Include the conflict',
  body: 'The friction between two things you want is what the model is built around.'
},
{
  title: 'Name what is fixed',
  body: 'Deadlines, obligations and commitments you cannot move become constraints.'
},
{
  title: 'Leave the uncertainty in',
  body: '“I’m not sure whether…” is signal. Unknowns are modelled, not guessed.'
}];


export function DecisionInput() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { prompt, setPrompt } = useDecision();

  useEffect(() => {
    const key = params.get('example');
    if (key) {
      const match = exampleDecisions.find((d) => d.id === key);
      if (match) setPrompt(match.prompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chars = prompt.trim().length;
  const words = prompt.trim() ? prompt.trim().split(/\s+/).length : 0;
  const ready = chars >= MIN_CHARS;

  const status = useMemo(() => {
    if (chars === 0) return { tone: 'neutral' as const, text: 'waiting for input' };
    if (chars < MIN_CHARS)
    return { tone: 'warning' as const, text: `${MIN_CHARS - chars} more characters to analyze` };
    if (chars < IDEAL_CHARS)
    return { tone: 'accent' as const, text: 'analyzable — more context sharpens the model' };
    return { tone: 'positive' as const, text: 'enough context for a full model' };
  }, [chars]);

  const analyze = () => {
    if (!ready) return;
    navigate('/analyzing');
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') analyze();
  };

  return (
    <div className="min-h-full w-full bg-bg">
      <TopBar
        center={
        <span className="font-mono text-2xs text-fg-muted">
            session<span className="text-[#3b4149]">/</span>
            <span className="text-fg-secondary">new-model</span>
          </span>
        }
        right={
        <Button size="sm" variant="ghost" onClick={() => navigate('/')}>
            Cancel
          </Button>
        } />
      

      <main className="mx-auto w-full max-w-[1180px] px-6 py-12">
        <div className="grid grid-cols-1 gap-x-14 gap-y-12 lg:grid-cols-12">
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="lg:col-span-8">
            
            <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-fg">
              Describe the situation
            </h1>
            <p className="mt-2.5 max-w-[60ch] text-[15px] leading-relaxed text-fg-secondary">
              Write it the way you would explain it to someone who already knows you. Contradictions
              are useful — leave them in.
            </p>

            <div className="mt-8 overflow-hidden rounded-xl border border-line bg-surface">
              <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                <span className="font-mono text-2xs uppercase tracking-[0.14em] text-fg-muted">
                  Situation
                </span>
                <span className="font-mono text-2xs tabular-nums text-fg-muted">
                  {words} words <span className="text-[#3b4149]">·</span> {chars} chars
                </span>
              </div>

              <Textarea
                autoFocus
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="I want to become a contractor, but because of college I can’t properly handle my contractor tasks."
                rows={9}
                aria-label="Describe your decision"
                className="rounded-none border-0 bg-transparent px-4 py-4 text-[15px] leading-[1.7] focus:border-0" />
              

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-[#0d0f12] px-4 py-3">
                <span className="inline-flex items-center gap-2">
                  <StatusDot tone={status.tone} />
                  <span className="font-mono text-2xs text-fg-muted">{status.text}</span>
                </span>

                <div className="flex items-center gap-3">
                  <Tooltip content="Runs interpretation only. Nothing is decided for you." side="top">
                    <span className="hidden items-center gap-1.5 font-mono text-2xs text-fg-muted sm:inline-flex">
                      <kbd className="rounded border border-line px-1 py-0.5">⌘</kbd>
                      <kbd className="rounded border border-line px-1 py-0.5">
                        <CornerDownLeftIcon className="h-2.5 w-2.5" />
                      </kbd>
                    </span>
                  </Tooltip>
                  <Button variant="primary" onClick={analyze} disabled={!ready}>
                    Analyze
                    <ArrowRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-10">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-fg-secondary">
                  Start from an example
                </h2>
                <Dropdown
                  className="w-[240px]"
                  options={exampleDecisions.map((d) => ({ value: d.id, label: d.title }))}
                  onChange={(v) => {
                    const match = exampleDecisions.find((d) => d.id === v);
                    if (match) setPrompt(match.prompt);
                  }}
                  triggerLabel="Load example decision"
                  align="right" />
                
              </div>

              <ul className="mt-4">
                {exampleDecisions.map((d) =>
                <li key={d.id}>
                    <button
                    onClick={() => setPrompt(d.prompt)}
                    className="group w-full border-t border-line py-4 text-left transition-colors duration-150 ease-out hover:bg-[#101216]">
                    
                      <div className="flex items-start justify-between gap-6">
                        <div className="min-w-0">
                          <p className="text-[14px] font-medium text-fg">{d.title}</p>
                          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-fg-muted">
                            “{d.prompt}”
                          </p>
                        </div>
                        <span className="mt-1 shrink-0 font-mono text-2xs text-fg-muted opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100">
                          use →
                        </span>
                      </div>
                    </button>
                  </li>
                )}
              </ul>
            </div>
          </motion.section>

          <aside className="lg:col-span-4">
            <div className="rounded-xl border border-line bg-surface p-5">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-fg-secondary">
                What analysis produces
              </h2>
              <ul className="mt-4 space-y-3">
                {KIND_ORDER.map((kind) => {
                  const meta = KIND_META[kind];
                  const Icon = meta.icon;
                  return (
                    <li key={kind} className="flex items-center gap-2.5">
                      <Icon className={`h-3.5 w-3.5 shrink-0 ${meta.color}`} />
                      <span className="text-[13px] text-fg-secondary">{KIND_LABEL[kind]}</span>
                      <span className="ml-auto font-mono text-2xs text-[#3b4149]">—</span>
                    </li>);

                })}
              </ul>
              <p className="mt-5 border-t border-line pt-4 font-mono text-2xs leading-relaxed text-fg-muted">
                counts are determined by your situation, not by a template
              </p>
            </div>

            <div className="mt-6">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-fg-secondary">
                Writing guidance
              </h2>
              <dl className="mt-3">
                {GUIDANCE.map((g) =>
                <div key={g.title} className="border-t border-line py-3.5">
                    <dt className="text-[13px] font-medium text-fg">{g.title}</dt>
                    <dd className="mt-1 text-[13px] leading-relaxed text-fg-muted">{g.body}</dd>
                  </div>
                )}
              </dl>
            </div>
          </aside>
        </div>
      </main>
    </div>);

}