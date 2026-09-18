import React from 'react';
import { cn } from '../../utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:
  'bg-accent text-[#04100e] font-semibold hover:bg-[#4fd3c3] active:bg-[#36a89b] border border-transparent',
  secondary:
  'bg-elevated text-fg border border-line-strong hover:border-[#3d444d] hover:bg-[#1a1e23] active:bg-[#15181d]',
  ghost: 'bg-transparent text-fg-secondary border border-transparent hover:text-fg hover:bg-[#15181d]',
  danger:
  'bg-transparent text-negative border border-[#43302e] hover:bg-[#1e1516] hover:border-[#5a3c39]'
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded',
  md: 'h-10 px-4 text-sm gap-2 rounded-md',
  lg: 'h-12 px-6 text-[15px] gap-2.5 rounded-md'
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap select-none',
        'transition-[background-color,border-color,color,transform] duration-150 ease-out',
        'active:translate-y-px disabled:opacity-40 disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}>
      
      {loading &&
      <span
        aria-hidden
        className="mr-0.5 h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />

      }
      {children}
    </button>);

}

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: 'sm' | 'md';
  active?: boolean;
}

export function IconButton({
  label,
  size = 'md',
  active = false,
  className,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      aria-pressed={props['aria-pressed'] ?? (active || undefined)}
      className={cn(
        'inline-flex items-center justify-center rounded border transition-colors duration-150 ease-out',
        size === 'sm' ? 'h-7 w-7' : 'h-9 w-9',
        active ?
        'border-[#2c4a47] bg-[#12211f] text-accent' :
        'border-transparent text-fg-muted hover:text-fg hover:bg-[#191d22]',
        'disabled:opacity-35 disabled:pointer-events-none',
        className
      )}
      {...props}>
      
      {children}
    </button>);

}