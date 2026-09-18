import { twMerge } from 'tailwind-merge';

type ClassValue = string | undefined | null | false;

export function cn(...classes: ClassValue[]): string {
  return twMerge(classes.filter(Boolean).join(' '));
}