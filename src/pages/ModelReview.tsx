import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRightIcon, SearchIcon, Trash2Icon } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { Button } from '../components/ui/Button';
import { Badge, StatusDot } from '../components/ui/Badge';
import { Dropdown } from '../components/ui/Dropdown';
import { ModelSection } from '../components/model/ModelSection';
import { ItemEditor } from '../components/model/ItemEditor';
import { useDecision } from '../contexts/DecisionContext';
import { ItemKind, KIND_ORDER, ModelItem, ORIGIN_LABEL, Origin } from '../types/decision';

const ORIGIN_FILTERS: { value: Origin | 'all'; label: string }[] = [
  { value: 'all', label: 'All provenance' },
  { value: 'user', label: ORIGIN_LABEL.user },
  { value: 'inferred', label: ORIGIN_LABEL.inferred },
  { value: 'unknown', label: ORIGIN_LABEL.unknown },
];

/**
 * Model Review — the checkpoint between AI extraction and the live workspace.
 * Everything shown is dynamic: sections render per kind present in the model,
 * counts come from the model itself, and every item can be edited, added or
 * removed before the graph workspace is opened.
 */
export function ModelReview() {
  const navigate = useNavigate();
  const {
    prompt,
    draftModel,
    analysisMeta,
    analysisError,
    updateDraftItem,
    removeDraftItem,
    addDraftItem,
    commitDraft,
    discardDraft,
    isDemoModel,
  } = useDecision();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [originFilter, setOriginFilter] = useState<Origin | 'all'>('all');
  const navigatingRef = useRef(false);

  // Guard: nothing to review (direct navigation / after discard) — sent back via effect.
  useEffect(() => {
    if (!draftModel && !navigatingRef.current) {
      navigate(analysisError ? '/analyzing' : '/new', { replace: true });
    }
  }, [draftModel, analysisError, navigate]);

  const items = draftModel?.items ?? [];
  const edges = draftModel?.edges ?? [];

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((i) => {
      const matchesQuery = !q || (i.label + ' ' + i.detail).toLowerCase().includes(q);
      const matchesOrigin = originFilter === 'all' || i.origin === originFilter;
      return matchesQuery && matchesOrigin;
    });
  }, [items, searchQuery, originFilter]);

  const byKind = useMemo(() => {
    const map = new Map<ItemKind, ModelItem[]>();
    KIND_ORDER.forEach((k) => map.set(k, []));
    filtered.forEach((i) => map.get(i.kind)?.push(i));
    return map;
  }, [filtered]);

  const selectedItem = items.find((i) => i.id === selectedId) ?? null;
  const warnings = analysisMeta?.warnings ?? [];

  const affectsCount = (item: ModelItem) => edges.filter((e) => e.from === item.id).length;

  const openWorkspace = () => {
    navigatingRef.current = true;
    commitDraft();
    navigate('/model');
  };

  const discard = () => {
    navigatingRef.current = true;
    discardDraft();
    navigate('/new');
  };

  if (!draftModel) return null;

  return (
    <div className="min-h-full w-full bg-bg pb-24">
      <TopBar
        center={
          <span className="font-mono text-2xs text-fg-muted">
            session<span className="text-[#3b4149]">/</span>
            <span className="text-fg-secondary">model-review</span>
          </span>
        }
        right={
          <Button size="sm" variant="ghost" onClick={discard}>
            <Trash2Icon className="h-3.5 w-3.5" />
            Discard
          </Button>
        } />

      <main className="mx-auto w-full max-w-[1180px] px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-2xs uppercase tracking-[0.16em] text-fg-muted">
              What the analysis found
            </span>
            {isDemoModel ? (
              <Badge tone="warning" mono>DEMO MODEL</Badge>
            ) : (
              <Badge tone="accent" mono>AI MODEL</Badge>
            )}
            <Badge tone="neutral" mono>{items.length} nodes</Badge>
            <Badge tone="neutral" mono>{edges.length} relationships</Badge>
          </div>

          <h1 className="mt-4 max-w-[24ch] text-[30px] font-semibold tracking-[-0.02em] text-fg">
            {draftModel?.title ?? 'Model review'}
          </h1>
          <p className="mt-3 max-w-[72ch] text-[15px] leading-relaxed text-fg-secondary">
            {draftModel?.summary}
          </p>
          <p className="mt-3 max-w-[72ch] border-l border-line pl-4 text-[13px] italic leading-relaxed text-fg-muted">
            “{prompt}”
          </p>

          {warnings.length > 0 && (
            <div className="mt-5 rounded-lg border border-warning/40 bg-[#1e1810] p-3.5">
              <span className="flex items-center gap-1.5 font-mono text-2xs font-semibold uppercase tracking-wider text-warning">
                <StatusDot tone="warning" /> {warnings.length} normalization warning{warnings.length === 1 ? '' : 's'}
              </span>
              <ul className="mt-2 space-y-1">
                {warnings.slice(0, 4).map((w) => (
                  <li key={w} className="font-mono text-2xs leading-relaxed text-fg-muted">· {w}</li>
                ))}
                {warnings.length > 4 && (
                  <li className="font-mono text-2xs text-fg-muted">· +{warnings.length - 4} more</li>
                )}
              </ul>
            </div>
          )}
        </motion.div>

        {/* Filters */}
        <div className="mt-9 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div className="relative w-[260px]">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search the model..."
              className="h-9 w-full rounded-md border border-line bg-[#0d0f12] pl-8 pr-3 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
            />
          </div>
          <Dropdown
            className="w-[200px]"
            value={originFilter}
            options={ORIGIN_FILTERS}
            onChange={(v) => setOriginFilter(v as Origin | 'all')}
            triggerLabel="Filter by provenance"
            align="right" />
        </div>

        {/* Dynamic kind sections */}
        <div className="mt-10 space-y-14">
          {KIND_ORDER.map((kind) => {
            const kindItems = byKind.get(kind) ?? [];
            const totalInKind = items.filter((i) => i.kind === kind).length;
            // Render sections that exist in the model, or that hold filtered-out items.
            if (totalInKind === 0 && kindItems.length === 0) return null;
            return (
              <ModelSection
                key={kind}
                kind={kind}
                items={kindItems}
                totalInKind={totalInKind}
                selectedId={selectedId}
                onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
                onAdd={(k) => {
                  const id = addDraftItem(k);
                  setSelectedId(id);
                }}
                affectsCount={affectsCount} />
            );
          })}
        </div>

        {items.length === 0 && (
          <div className="mt-16 rounded-xl border border-dashed border-line p-10 text-center">
            <p className="text-[15px] text-fg-secondary">Nothing left to review.</p>
            <p className="mt-2 text-[13px] text-fg-muted">
              Every node was removed. Discard this model or start a new analysis.
            </p>
            <Button className="mt-5" size="sm" variant="secondary" onClick={discard}>
              Back to input
            </Button>
          </div>
        )}
      </main>

      {/* Sticky confirm bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-3 px-6 py-3.5">
          <p className="font-mono text-2xs leading-relaxed text-fg-muted">
            confirm the structure before the workspace opens — every node stays editable later
          </p>
          <div className="flex items-center gap-2.5">
            <Button size="sm" variant="ghost" onClick={discard}>
              Discard
            </Button>
            <Button size="sm" variant="primary" onClick={openWorkspace} disabled={items.length === 0}>
              Open workspace
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Item editor */}
      <ItemEditor
        item={selectedItem}
        allItems={items}
        onChange={updateDraftItem}
        onDelete={(id) => {
          removeDraftItem(id);
          if (selectedId === id) setSelectedId(null);
        }}
        onClose={() => setSelectedId(null)} />
    </div>
  );
}

export default ModelReview;
