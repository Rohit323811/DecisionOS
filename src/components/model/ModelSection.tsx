import React from 'react';
import { PlusIcon } from 'lucide-react';
import { ItemKind, KIND_DESCRIPTION, KIND_LABEL, ModelItem } from '../../types/decision';
import { KIND_META } from '../../utils/kindMeta';
import { NodeCard } from '../ui/NodeCard';
import { EmptyState } from '../ui/States';
import { Button } from '../ui/Button';

/**
 * Renders one kind of node. Count is entirely content-driven: the grid reflows
 * from 1 item to 20+ without the section changing shape.
 */
export function ModelSection({
  kind,
  items,
  totalInKind,
  selectedId,
  onSelect,
  onAdd,
  affectsCount








}: {kind: ItemKind;items: ModelItem[];totalInKind: number;selectedId: string | null;onSelect: (id: string) => void;onAdd: (kind: ItemKind) => void;affectsCount: (item: ModelItem) => number;}) {
  const meta = KIND_META[kind];
  const Icon = meta.icon;
  const filtered = totalInKind !== items.length;

  return (
    <section id={`section-${kind}`} className="scroll-mt-28">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-line pb-3">
        <div className="flex items-center gap-2.5">
          <Icon className={`h-4 w-4 ${meta.color}`} />
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">{KIND_LABEL[kind]}</h2>
          <span className="font-mono text-[13px] tabular-nums text-fg-muted">
            {items.length}
            {filtered && <span className="text-[#3b4149]">/{totalInKind}</span>}
          </span>
        </div>
        <button
          onClick={() => onAdd(kind)}
          className="inline-flex items-center gap-1.5 font-mono text-2xs text-fg-muted transition-colors duration-150 ease-out hover:text-accent">
          
          <PlusIcon className="h-3 w-3" />
          add
        </button>
      </header>

      <p className="mt-2.5 max-w-[68ch] text-[13px] leading-relaxed text-fg-muted">
        {KIND_DESCRIPTION[kind]}
      </p>

      <div className="mt-4">
        {items.length === 0 ?
        <EmptyState
          compact
          title={filtered ? `No ${KIND_LABEL[kind].toLowerCase()} match this filter` : `No ${KIND_LABEL[kind].toLowerCase()} yet`}
          description={
          filtered ?
          'Clear the provenance filter to see the rest of this section.' :
          'The analysis did not find any. Add one if you know it belongs here.'
          }
          action={
          !filtered &&
          <Button size="sm" variant="secondary" onClick={() => onAdd(kind)}>
                  <PlusIcon className="h-3.5 w-3.5" />
                  Add {kind}
                </Button>

          } /> :


        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {items.map((item, i) =>
          <NodeCard
            key={item.id}
            item={item}
            index={i}
            affectsCount={affectsCount(item)}
            selected={selectedId === item.id}
            onClick={() => onSelect(item.id)} />

          )}
          </div>
        }
      </div>
    </section>);

}