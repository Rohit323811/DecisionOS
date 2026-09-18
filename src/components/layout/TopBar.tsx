import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

export function Wordmark({ className }: {className?: string;}) {
  return (
    <Link
      to="/"
      className={cn(
        'group inline-flex items-center gap-2.5 transition-opacity duration-150 ease-out hover:opacity-85',
        className
      )}>
      
      <span
        aria-hidden
        className="flex h-5 w-5 items-center justify-center rounded-sm border border-[#2c4a47] bg-[#101f1d]">
        
        <svg viewBox="0 0 12 12" className="h-3 w-3">
          <circle cx="2.5" cy="6" r="1.4" fill="#3fbfb0" />
          <circle cx="9.5" cy="2.5" r="1.1" fill="#647079" />
          <circle cx="9.5" cy="9.5" r="1.1" fill="#647079" />
          <path d="M3.6 5.4 L8.5 2.9 M3.6 6.6 L8.5 9.1" stroke="#3a4149" strokeWidth="0.8" />
        </svg>
      </span>
      <span className="text-[14px] font-semibold tracking-tight text-fg">
        Decision<span className="text-fg-secondary">OS</span>
      </span>
    </Link>);

}

export function TopBar({
  center,
  right,
  className




}: {center?: React.ReactNode;right?: React.ReactNode;className?: string;}) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 items-center gap-6 border-b border-line bg-bg/85 px-5 backdrop-blur-md',
        className
      )}>
      
      <Wordmark />
      <div className="min-w-0 flex-1">{center}</div>
      <div className="flex shrink-0 items-center gap-2">{right}</div>
    </header>);

}