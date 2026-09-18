import React from 'react';
import { PlusIcon, Trash2Icon, XIcon } from 'lucide-react';
import { ModelItem, ORIGIN_LABEL, Origin } from '../../types/decision';
import { KIND_META } from '../../utils/kindMeta';
import { SidePanel } from '../ui/SidePanel';
import { Button, IconButton } from '../ui/Button';
import { Input, Label, Slider, Textarea, Toggle } from '../ui/FormControls';
import { Dropdown } from '../ui/Dropdown';
import { Badge } from '../ui/Badge';

const ORIGIN_OPTIONS: {value: Origin;label: string;description: string;}[] = [
{ value: 'user', label: ORIGIN_LABEL.user, description: 'Stated directly in your situation.' },
{
  value: 'inferred',
  label: ORIGIN_LABEL.inferred,
  description: 'Derived by the analysis — confirm or correct it.'
},
{
  value: 'unknown',
  label: ORIGIN_LABEL.unknown,
  description: 'Carried through the model as a range, not a fact.'
}];


export function ItemEditor({
  item,
  allItems,
  onChange,
  onDelete,
  onClose






}: {item: ModelItem | null;allItems: ModelItem[];onChange: (id: string, patch: Partial<ModelItem>) => void;onDelete: (id: string) => void;onClose: () => void;}) {
  const meta = item ? KIND_META[item.kind] : null;
  const Icon = meta?.icon;

  const affects = item?.affects ?? [];
  const candidates = allItems.filter((i) => i.id !== item?.id && !affects.includes(i.id));

  return (
    <SidePanel
      open={!!item}
      onClose={onClose}
      width={460}
      title={item?.label ?? ''}
      eyebrow={
      item && Icon ?
      <>
            <span
          className={`flex h-5 w-5 items-center justify-center rounded border ${meta!.fill}`}>
          
              <Icon className={`h-3 w-3 ${meta!.color}`} />
            </span>
            <span className="font-mono text-2xs uppercase tracking-[0.14em] text-fg-muted">
              {item.kind} <span className="text-[#3b4149]">·</span> {item.id}
            </span>
          </> :
      null
      }
      footer={
      item ?
      <>
            <Button
          size="sm"
          variant="danger"
          onClick={() => {
            onDelete(item.id);
            onClose();
          }}>
          
              <Trash2Icon className="h-3.5 w-3.5" />
              Remove node
            </Button>
            <Button size="sm" variant="primary" onClick={onClose}>
              Done
            </Button>
          </> :
      null
      }>
      
      {item &&
      <div className="space-y-7">
          <Input
          label="Label"
          value={item.label}
          onChange={(e) => onChange(item.id, { label: e.target.value })} />
        

          <Textarea
          label="Description"
          rows={4}
          value={item.detail}
          onChange={(e) => onChange(item.id, { detail: e.target.value })} />
        

          <div>
            <Label>Provenance</Label>
            <Dropdown
            options={ORIGIN_OPTIONS}
            value={item.origin}
            onChange={(v) => onChange(item.id, { origin: v as Origin })} />
          
            <p className="mt-2 text-[12px] leading-relaxed text-fg-muted">
              Provenance changes how the model treats this node — unknowns propagate as ranges.
            </p>
          </div>

          {item.range &&
        <div className="rounded-lg border border-line bg-[#0d0f12] p-4">
              <Slider
            label="Current value"
            value={item.range.value}
            min={item.range.min}
            max={item.range.max}
            step={item.range.step ?? 1}
            unit={item.range.unit}
            onChange={(v) =>
            onChange(item.id, { range: { ...item.range!, value: v } })
            } />
          
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4">
                <Input
              label="Min"
              type="number"
              value={item.range.min}
              onChange={(e) =>
              onChange(item.id, { range: { ...item.range!, min: Number(e.target.value) } })
              } />
            
                <Input
              label="Max"
              type="number"
              value={item.range.max}
              onChange={(e) =>
              onChange(item.id, { range: { ...item.range!, max: Number(e.target.value) } })
              } />
            
              </div>
            </div>
        }

          {item.confidence &&
        <div>
              <Label>Confidence in this inference</Label>
              <Dropdown
            options={[
            { value: 'high', label: 'High' },
            { value: 'medium', label: 'Medium' },
            { value: 'low', label: 'Low — verify before relying on it' }]
            }
            value={item.confidence}
            onChange={(v) => onChange(item.id, { confidence: v as ModelItem['confidence'] })} />
          
            </div>
        }

          <div>
            <Label hint={`${affects.length} linked`}>Affects</Label>
            {affects.length === 0 ?
          <p className="rounded-md border border-dashed border-line px-3 py-3 text-[13px] text-fg-muted">
                Not linked to anything yet. Links define how change propagates.
              </p> :

          <ul className="space-y-1.5">
                {affects.map((id) => {
              const target = allItems.find((i) => i.id === id);
              if (!target) return null;
              const tMeta = KIND_META[target.kind];
              return (
                <li
                  key={id}
                  className="flex items-center gap-2 rounded-md border border-line bg-[#0d0f12] px-2.5 py-2">
                  
                      <tMeta.icon className={`h-3.5 w-3.5 shrink-0 ${tMeta.color}`} />
                      <span className="min-w-0 flex-1 truncate text-[13px] text-fg-secondary">
                        {target.label}
                      </span>
                      <span className="font-mono text-2xs text-fg-muted">{target.kind}</span>
                      <IconButton
                    size="sm"
                    label={`Unlink ${target.label}`}
                    onClick={() =>
                    onChange(item.id, { affects: affects.filter((a) => a !== id) })
                    }>
                    
                        <XIcon className="h-3.5 w-3.5" />
                      </IconButton>
                    </li>);

            })}
              </ul>
          }

            {candidates.length > 0 &&
          <div className="mt-2.5 flex items-center gap-2">
                <PlusIcon aria-hidden className="h-3.5 w-3.5 shrink-0 text-fg-muted" />
                <Dropdown
              className="flex-1"
              triggerLabel="Link to another node"
              options={candidates.map((c) => ({
                value: c.id,
                label: c.label,
                description: c.kind
              }))}
              onChange={(v) => onChange(item.id, { affects: [...affects, v] })} />
            
              </div>
          }
          </div>

          {item.facts && item.facts.length > 0 &&
        <div>
              <Label>Extracted facts</Label>
              <div className="flex flex-wrap gap-1.5">
                {item.facts.map((f) =>
            <Badge key={f.label} mono>
                    {f.label} = {f.value}
                  </Badge>
            )}
              </div>
            </div>
        }

          <div className="border-t border-line pt-5">
            <Toggle
            checked={item.origin !== 'unknown'}
            onChange={(v) => onChange(item.id, { origin: v ? 'inferred' : 'unknown' })}
            label="Include in propagation"
            description="Unknown nodes still appear in the model but do not drive computed outcomes." />
          
          </div>
        </div>
      }
    </SidePanel>);

}