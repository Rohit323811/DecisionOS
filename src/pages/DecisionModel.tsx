import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRightIcon,
  DownloadIcon,
  RotateCcwIcon,
  SearchIcon,
  Share2Icon } from
'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { Toolbar, ToolbarDivider, ToolbarSpacer } from '../components/ui/Toolbar';
import { Button, IconButton } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { Badge, StatusDot } from '../components/ui/Badge';
import { Tooltip } from '../components/ui/Tooltip';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/States';
import { useToast } from '../components/ui/Toast';
import { ModelSection } from '../components/model/ModelSection';
import { ItemEditor } from '../components/model/ItemEditor';
import { useDecision } from '../contexts/DecisionContext';
import { ItemKind, KIND_LABEL, KIND_ORDER, Origin } from '../types/decision';
import { KIND_META } from '../utils/kindMeta';
import { cn } from '../utils/cn';

type Filter = 'all' | Origin;

export function DecisionModel() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { model, updateItem, removeItem, addItem, reset } = useDecision();

  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    if (!model) navigate('/new', { replace: true });
  }, [model, navigate]);

  const items = model?.items ?? [];

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (filter !== 'all' && i.origin !== filter) return false;
      if (!q) return true;
      return (i.label + ' ' + i.detail).toLowerCase().includes(q);
    });
  }, [items, filter, query]);

  const originCount = (o: Origin) => items.filter((i) => i.origin === o).length;
  const kindCount = (k: ItemKind) => items.filter((i) => i.kind === k).length;
  const edges = items.reduce((n, i) => n + (i.affects?.length ?? 0), 0);
  const lowConfidence = items.filter((i) => i.confidence === 'low').length;

  const selected = items.find((i) => i.id === selectedId) ?? null;

  const scrollTo = (kind: ItemKind) => {
    document.getElementById(`section-${kind}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!model) return null;

  return (
    <div className="min-h-full w-full bg-bg">
      <TopBar
        center={
        <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-fg">{model.title}</p>
            <p className="truncate font-mono text-2xs text-fg-muted">
              {items.length} nodes <span className="text-[#3b4149]">·</span> {edges} edges{' '}
              <span className="text-[#3b4149]">·</span> draft
            </p>
          </div>
        }
        right={
        <>
            <Tooltip content="Export model as JSON">
              <IconButton
              label="Export model"
              onClick={() => toast('Model exported', { detail: 'decision-model.json', tone: 'success' })}>
              
                <DownloadIcon className="h-4 w-4" />
              </IconButton>
            </Tooltip>
            <Tooltip content="Share a read-only link">
              <IconButton
              label="Share model"
              onClick={() => toast('Read-only link copied to clipboard', { tone: 'success' })}>
              
                <Share2Icon className="h-4 w-4" />
              </IconButton>
            </Tooltip>
            <Tooltip content="Discard and start over">
              <IconButton
              label="Start over"
              onClick={() => {
                reset();
                navigate('/new');
              }}>
              
                <RotateCcwIcon className="h-4 w-4" />
              </IconButton>
            </Tooltip>
            <ToolbarDivider />
            <Button size="sm" variant="primary" onClick={() => setReviewOpen(true)}>
              Explore model
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </>
        } />
      

      <Toolbar sticky className="top-14">
        <Tabs
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
          items={[
          { id: 'all', label: 'All', count: items.length },
          { id: 'user', label: 'From you', count: originCount('user') },
          { id: 'inferred', label: 'Inferred', count: originCount('inferred') },
          { id: 'unknown', label: 'Unknown', count: originCount('unknown') }]
          } />
        
        <ToolbarSpacer />
        <div className="relative hidden w-[240px] sm:block">
          <SearchIcon
            aria-hidden
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-muted" />
          
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter nodes"
            aria-label="Filter nodes"
            className="h-8 w-full rounded border border-line bg-[#0d0f12] pl-8 pr-3 text-[13px] text-fg placeholder:text-fg-muted transition-colors duration-150 ease-out hover:border-line-strong focus:border-accent focus:outline-none" />
          
        </div>
        <span className="hidden font-mono text-2xs tabular-nums text-fg-muted md:inline">
          {visible.length}/{items.length} shown
        </span>
      </Toolbar>

      <main className="mx-auto w-full max-w-[1280px] px-6 py-10">
        {/* Model summary — the one thing that should win the page */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="grid grid-cols-1 gap-x-14 gap-y-8 lg:grid-cols-12">
          
          <div className="lg:col-span-8">
            <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] text-fg">
              {model.title}
            </h1>
            <p className="mt-4 border-l border-line pl-4 text-[14px] leading-relaxed text-fg-muted">
              “{model.prompt}”
            </p>
            <p className="mt-5 max-w-[70ch] text-[15px] leading-relaxed text-fg-secondary">
              {model.summary}
            </p>
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-xl border border-line bg-surface">
              <div className="border-b border-line px-4 py-2.5">
                <span className="font-mono text-2xs uppercase tracking-[0.14em] text-fg-muted">
                  Composition
                </span>
              </div>
              <ul>
                {KIND_ORDER.map((kind) => {
                  const meta = KIND_META[kind];
                  const Icon = meta.icon;
                  return (
                    <li key={kind}>
                      <button
                        onClick={() => scrollTo(kind)}
                        className="flex w-full items-center gap-2.5 border-b border-line px-4 py-2.5 text-left transition-colors duration-150 ease-out last:border-b-0 hover:bg-[#14171b]">
                        
                        <Icon className={cn('h-3.5 w-3.5 shrink-0', meta.color)} />
                        <span className="text-[13px] text-fg-secondary">{KIND_LABEL[kind]}</span>
                        <span className="ml-auto font-mono text-[13px] tabular-nums text-fg">
                          {kindCount(kind)}
                        </span>
                      </button>
                    </li>);

                })}
              </ul>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone="accent" mono>
                <StatusDot tone="accent" /> {originCount('user')} from you
              </Badge>
              <Badge mono>{originCount('inferred')} inferred</Badge>
              <Badge tone="unknown" mono>
                {originCount('unknown')} unknown
              </Badge>
              {lowConfidence > 0 &&
              <Badge tone="warning" mono>
                  {lowConfidence} low confidence
                </Badge>
              }
            </div>
          </div>
        </motion.section>

        {/* Review notice */}
        <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-line bg-surface px-4 py-3">
          <StatusDot tone="warning" pulse />
          <p className="text-[13px] text-fg-secondary">
            Review before exploring. Everything inferred is a reading of your words, not a fact.
          </p>
          <button
            onClick={() => setFilter('inferred')}
            className="ml-auto font-mono text-2xs text-accent transition-colors duration-150 ease-out hover:text-[#5fd6c7]">
            
            review {originCount('inferred')} inferred →
          </button>
        </div>

        {visible.length === 0 ?
        <div className="mt-10">
            <EmptyState
            title="Nothing matches this view"
            description="No nodes match the current provenance filter and search term."
            action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setFilter('all');
                setQuery('');
              }}>
              
                  Clear filters
                </Button>
            } />
          
          </div> :

        <div className="mt-12 space-y-14">
            {KIND_ORDER.map((kind) => {
            const kindItems = visible.filter((i) => i.kind === kind);
            const total = kindCount(kind);
            if (kindItems.length === 0 && total === 0 && (filter !== 'all' || query)) return null;
            return (
              <ModelSection
                key={kind}
                kind={kind}
                items={kindItems}
                totalInKind={total}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onAdd={(k) => {
                  const id = addItem(k);
                  setSelectedId(id);
                  toast('Node added', { detail: `A new ${k} was added to the model.` });
                }}
                affectsCount={(item) => item.affects?.length ?? 0} />);


          })}
          </div>
        }
      </main>

      <ItemEditor
        item={selected}
        allItems={items}
        onChange={updateItem}
        onDelete={(id) => {
          removeItem(id);
          toast('Node removed', { detail: 'Links pointing at it were cleaned up.', tone: 'warning' });
        }}
        onClose={() => setSelectedId(null)} />
      

      <Modal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        title="Lock the model and start exploring"
        description="Exploration is deterministic. Once locked, changing a variable propagates the same way every time."
        footer={
        <>
            <Button size="sm" variant="ghost" onClick={() => setReviewOpen(false)}>
              Keep editing
            </Button>
            <Button
            size="sm"
            variant="primary"
            onClick={() => {
              setReviewOpen(false);
              toast('Model locked', {
                detail: 'The exploration workspace is the next step in this flow.',
                tone: 'success'
              });
            }}>
            
              Lock and explore
            </Button>
          </>
        }>
        
        <ul className="space-y-2.5">
          {[
          { label: 'Nodes in model', value: `${items.length}` },
          { label: 'Dependency edges', value: `${edges}` },
          { label: 'Unresolved unknowns', value: `${originCount('unknown')}` },
          { label: 'Low-confidence inferences', value: `${lowConfidence}` }].
          map((row) =>
          <li
            key={row.label}
            className="flex items-center justify-between border-b border-line pb-2.5 last:border-b-0">
            
              <span className="text-[13px] text-fg-secondary">{row.label}</span>
              <span className="font-mono text-[13px] tabular-nums text-fg">{row.value}</span>
            </li>
          )}
        </ul>
        <p className="mt-4 text-[13px] leading-relaxed text-fg-muted">
          Unknowns are not blockers. They stay in the model as ranges, and the exploration view shows
          how much of the outcome depends on them.
        </p>
      </Modal>
    </div>);

}