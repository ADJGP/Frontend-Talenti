import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSalary(min: number, max: number, currency: string = 'USD'): string {
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';
  const formatK = (val: number) => {
    if (val >= 1000) {
      return `${Math.round(val / 1000)}k`;
    }
    return val.toLocaleString();
  };
  return `${symbol}${formatK(min)} - ${symbol}${formatK(max)} / yr`;
}

export function getMatchScoreColor(score: number): {
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  progressBg: string;
  label: string;
} {
  if (score >= 95) {
    return {
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
      badgeText: 'text-emerald-700 dark:text-emerald-300',
      badgeBorder: 'border-emerald-200 dark:border-emerald-800/60',
      progressBg: 'bg-emerald-500',
      label: 'Exceptional Match',
    };
  }
  if (score >= 88) {
    return {
      badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40',
      badgeText: 'text-indigo-700 dark:text-indigo-300',
      badgeBorder: 'border-indigo-200 dark:border-indigo-800/60',
      progressBg: 'bg-indigo-600',
      label: 'Strong Match',
    };
  }
  if (score >= 80) {
    return {
      badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
      badgeText: 'text-blue-700 dark:text-blue-300',
      badgeBorder: 'border-blue-200 dark:border-blue-800/60',
      progressBg: 'bg-blue-500',
      label: 'Good Match',
    };
  }
  return {
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-200 dark:border-amber-800/60',
    progressBg: 'bg-amber-500',
    label: 'Moderate Match',
  };
}
