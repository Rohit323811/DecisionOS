import React, { useId } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

const FIELD_BASE =
'w-full bg-[#0d0f12] border border-line rounded-md text-fg placeholder:text-fg-muted ' +
'transition-colors duration-150 ease-out hover:border-line-strong focus:border-accent focus:outline-none ' +
'focus-visible:outline-none disabled:opacity-45';

export function Label({
  children,
  htmlFor,
  hint




}: {children: React.ReactNode;htmlFor?: string;hint?: string;}) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-3">
      <label
        htmlFor={htmlFor}
        className="text-[11px] font-medium uppercase tracking-[0.12em] text-fg-secondary">
        
        {children}
      </label>
      {hint && <span className="font-mono text-2xs text-fg-muted">{hint}</span>}
    </div>);

}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export function Input({ label, hint, className, id, ...props }: InputProps) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <div className="w-full">
      {label &&
      <Label htmlFor={fieldId} hint={hint}>
          {label}
        </Label>
      }
      <input id={fieldId} className={cn(FIELD_BASE, 'h-10 px-3 text-sm', className)} {...props} />
    </div>);

}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export function Textarea({ label, hint, className, id, ...props }: TextareaProps) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <div className="w-full">
      {label &&
      <Label htmlFor={fieldId} hint={hint}>
          {label}
        </Label>
      }
      <textarea
        id={fieldId}
        className={cn(FIELD_BASE, 'resize-none px-3 py-2.5 text-sm leading-relaxed', className)}
        {...props} />
      
    </div>);

}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: {value: string;label: string;}[];
}

export function Select({ label, options, className, id, ...props }: SelectProps) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <div className="w-full">
      {label && <Label htmlFor={fieldId}>{label}</Label>}
      <div className="relative">
        <select
          id={fieldId}
          className={cn(FIELD_BASE, 'h-9 appearance-none pl-3 pr-9 text-sm', className)}
          {...props}>
          
          {options.map((o) =>
          <option key={o.value} value={o.value} className="bg-elevated">
              {o.label}
            </option>
          )}
        </select>
        <ChevronDownIcon
          aria-hidden
          className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
        
      </div>
    </div>);

}

export function Toggle({
  checked,
  onChange,
  label,
  description





}: {checked: boolean;onChange: (v: boolean) => void;label: string;description?: string;}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group flex w-full items-start gap-3 text-left">
      
      <span
        className={cn(
          'mt-0.5 flex h-[18px] w-8 shrink-0 items-center rounded-full border p-[2px] transition-colors duration-150 ease-out',
          checked ? 'border-[#2c4a47] bg-[#173330]' : 'border-line bg-[#0d0f12]'
        )}>
        
        <span
          className={cn(
            'h-3 w-3 rounded-full transition-transform duration-150 ease-out',
            checked ? 'translate-x-[14px] bg-accent' : 'translate-x-0 bg-fg-muted'
          )} />
        
      </span>
      <span className="min-w-0">
        <span className="block text-sm text-fg">{label}</span>
        {description &&
        <span className="mt-0.5 block text-[13px] leading-snug text-fg-muted">{description}</span>
        }
      </span>
    </button>);

}

export function Slider({
  value,
  min,
  max,
  step = 1,
  unit,
  label,
  onChange








}: {value: number;min: number;max: number;step?: number;unit?: string;label: string;onChange: (v: number) => void;}) {
  const pct = (value - min) / (max - min) * 100;
  return (
    <div className="w-full">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-fg-secondary">
          {label}
        </span>
        <span className="font-mono text-[13px] tabular-nums text-fg">
          {value}
          {unit && <span className="ml-1 text-fg-muted">{unit}</span>}
        </span>
      </div>
      <div className="relative h-4">
        <div className="absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[#1d2127]" />
        <div
          className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-accent/70"
          style={{ width: `${pct}%` }} />
        
        <input
          type="range"
          aria-label={label}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full cursor-pointer appearance-none bg-transparent
            [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-[#0a0b0d]
            [&::-webkit-slider-thumb]:bg-accent [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5
            [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-accent" />




        
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-2xs text-fg-muted">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>);

}