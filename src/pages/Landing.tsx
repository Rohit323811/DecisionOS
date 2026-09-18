import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRightIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { TopBar } from '../components/layout/TopBar';
import { GraphPreview } from '../components/graph/GraphPreview';
import { contractorDecision } from '../data/exampleDecisions';
import { useDecision } from '../contexts/DecisionContext';

const LEGEND = [
{ label: 'Decision', color: '#3fbfb0' },
{ label: 'Variable', color: '#99a0a9' },
{ label: 'Dependency', color: '#5b636d' },
{ label: 'Consequence', color: '#e0a458' }];


const NOT_DOING = [
{
  title: 'It does not recommend',
  body: 'No score, no verdict, no “best option”. The model makes the structure of your situation legible; the judgement stays with you.'
},
{
  title: 'It does not hide uncertainty',
  body: 'Anything unknown stays visibly unknown and is carried through the model as a range rather than quietly filled in.'
},
{
  title: 'It does not drift',
  body: 'Once the model exists, behaviour is deterministic. The same change to the same variable produces the same propagation every time.'
}];


export function Landing() {
  const navigate = useNavigate();
  const { setPrompt } = useDecision();

  const tryExample = () => {
    setPrompt(contractorDecision.prompt);
    navigate('/new?example=contractor');
  };

  return (
    <div className="min-h-full w-full bg-bg">
      <TopBar
        right={
        <>
            <Link
            to="/new"
            className="hidden text-[13px] text-fg-secondary transition-colors duration-150 ease-out hover:text-fg sm:block">
            
              Examples
            </Link>
            <Button size="sm" variant="primary" onClick={() => navigate('/new')}>
              Model a decision
            </Button>
          </>
        } />
      

      <main className="mx-auto w-full max-w-[1180px] px-6">
        {/* Hero */}
        <section className="grid grid-cols-1 gap-x-16 gap-y-10 pb-16 pt-20 lg:grid-cols-12 lg:pt-28">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="lg:col-span-7">
            
            <h1 className="max-w-[16ch] text-[44px] font-semibold leading-[1.04] tracking-[-0.03em] text-fg sm:text-[60px]">
              Every decision creates consequences.
            </h1>
            <p className="mt-6 max-w-[52ch] text-[17px] leading-relaxed text-fg-secondary">
              DecisionOS turns messy decisions into models you can explore, stress-test, and
              understand.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button size="lg" variant="primary" onClick={() => navigate('/new')}>
                Model a decision
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="secondary" onClick={tryExample}>
                Try an example
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col justify-end lg:col-span-5">
            
            <p className="border-l border-line pl-5 text-[13px] leading-relaxed text-fg-muted">
              A decision is rarely one question. It is a set of goals competing for the same finite
              resources, held together by assumptions you have not written down.
            </p>
            <p className="mt-5 border-l border-accent/50 pl-5 font-mono text-[12px] leading-relaxed text-fg-secondary">
              The question DecisionOS answers is not
              <span className="text-fg-muted"> “what should I do”</span> — it is
              <span className="text-fg"> “if this changes, what else changes”</span>.
            </p>
          </motion.div>
        </section>

        {/* Graph — the product's visual identity */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
          className="overflow-hidden rounded-xl border border-line bg-surface"
          aria-label="Decision model preview">
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line px-4 py-2.5">
            <span className="font-mono text-2xs text-fg-secondary">
              model<span className="text-fg-muted">/</span>contracting-while-in-college
            </span>
            <span className="hidden font-mono text-2xs text-fg-muted sm:inline">
              12 nodes · 14 edges
            </span>
            <span className="ml-auto flex flex-wrap items-center gap-4">
              {LEGEND.map((l) =>
              <span key={l.label} className="inline-flex items-center gap-1.5">
                  <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: l.color }} />
                
                  <span className="font-mono text-2xs text-fg-muted">{l.label}</span>
                </span>
              )}
            </span>
          </div>

          <div className="grid-field px-4 py-6 sm:px-8 sm:py-10">
            <GraphPreview />
          </div>

          <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
            <span className="font-mono text-2xs text-fg-muted">
              hover a node to trace its dependencies
            </span>
            <button
              onClick={tryExample}
              className="inline-flex items-center gap-1.5 font-mono text-2xs text-accent transition-colors duration-150 ease-out hover:text-[#5fd6c7]">
              
              open this model
              <ArrowRightIcon className="h-3 w-3" />
            </button>
          </div>
        </motion.section>

        {/* Principle */}
        <section className="grid grid-cols-1 gap-x-16 gap-y-10 py-24 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <h2 className="text-[26px] font-semibold leading-snug tracking-[-0.02em] text-fg sm:text-[30px]">
              AI determines <span className="text-accent">what</span> should be modeled.
              <br />
              A deterministic system determines <span className="text-accent">how</span> the model
              behaves.
            </h2>
            <p className="mt-6 max-w-[48ch] text-[15px] leading-relaxed text-fg-secondary">
              Language models are good at reading a messy paragraph and naming the goals, variables
              and constraints hiding inside it. They are unreliable at arithmetic and at staying
              consistent. So DecisionOS splits the work: interpretation is generated, propagation is
              computed.
            </p>
          </div>

          <div className="lg:col-span-6">
            <dl>
              {NOT_DOING.map((row) =>
              <div key={row.title} className="border-t border-line py-5">
                  <dt className="text-[14px] font-medium text-fg">{row.title}</dt>
                  <dd className="mt-1.5 text-[13px] leading-relaxed text-fg-muted">{row.body}</dd>
                </div>
              )}
            </dl>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-4 px-6 py-6">
          <span className="font-mono text-2xs text-fg-muted">DecisionOS · modeling environment</span>
          <button
            onClick={() => navigate('/new')}
            className="font-mono text-2xs text-fg-secondary transition-colors duration-150 ease-out hover:text-fg">
            
            start a model →
          </button>
        </div>
      </footer>
    </div>);

}