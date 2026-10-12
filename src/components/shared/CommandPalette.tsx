import { useState, useMemo, useEffect, useRef, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  ArrowRight,
  Sun,
  Moon,
  Bookmark,
  MapPin,
  X,
} from 'lucide-react';
import { useJobStore } from '../../store/useJobStore';
import { useJobs } from '../../hooks/useJobs';
import { getMatchScoreColor } from '../../utils';
import type { Job } from '../../types';

export function CommandPalette() {
  const isCommandPaletteOpen = useJobStore((state) => state.isCommandPaletteOpen);
  const setCommandPaletteOpen = useJobStore((state) => state.setCommandPaletteOpen);
  const setSelectedJobId = useJobStore((state) => state.setSelectedJobId);
  const setActiveNav = useJobStore((state) => state.setActiveNav);
  const setFilters = useJobStore((state) => state.setFilters);
  const resetFilters = useJobStore((state) => state.resetFilters);
  const theme = useJobStore((state) => state.theme);
  const setTheme = useJobStore((state) => state.setTheme);

  // Real offers loaded from GET /job-offers (same query the feed uses).
  const { data } = useJobs();
  const jobs = useMemo(() => data?.jobs ?? [], [data]);

  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  // Actions list
  const actions = useMemo(() => {
    return [
      {
        id: 'action-remote',
        title: 'Filter: Remote Only',
        category: 'Quick Filter',
        icon: MapPin,
        execute: () => {
          setActiveNav('jobs');
          setFilters({ workplaceType: 'Remote' });
        },
      },
      {
        id: 'action-saved',
        title: 'View: Saved Bookmarked Jobs',
        category: 'Navigation',
        icon: Bookmark,
        execute: () => {
          setActiveNav('saved');
        },
      },
      {
        id: 'action-theme',
        title: `Switch Theme to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
        category: 'System',
        icon: theme === 'dark' ? Sun : Moon,
        execute: () => {
          setTheme(theme === 'dark' ? 'light' : 'dark');
        },
      },
      {
        id: 'action-reset',
        title: 'Reset All Job Filters',
        category: 'Quick Filter',
        icon: X,
        execute: () => {
          resetFilters();
        },
      },
    ];
  }, [theme, setActiveNav, setFilters, resetFilters, setTheme]);

  // Matching jobs based on query (over the offers currently loaded from the API)
  const matchingJobs = useMemo(() => {
    if (!search.trim()) return jobs.slice(0, 5);
    const q = search.toLowerCase();
    return jobs
      .filter(
        (job) =>
          job.title.toLowerCase().includes(q) ||
          job.company.toLowerCase().includes(q) ||
          (job.skills ?? []).some((s) => s.toLowerCase().includes(q)) ||
          job.location.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [jobs, search]);

  // Combined items for keyboard navigation
  const allItems = useMemo(() => {
    const items: Array<
      | { type: 'job'; data: Job }
      | { type: 'action'; data: (typeof actions)[0] }
    > = [];

    matchingJobs.forEach((job) => items.push({ type: 'job', data: job }));
    actions
      .filter((a) => !search || a.title.toLowerCase().includes(search.toLowerCase()))
      .forEach((action) => items.push({ type: 'action', data: action }));

    return items;
  }, [matchingJobs, actions, search]);

  // Keyboard navigation within list
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < allItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : allItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = allItems[selectedIndex];
      if (current) {
        if (current.type === 'job') {
          setSelectedJobId(current.data.id);
          setActiveNav('jobs');
        } else {
          current.data.execute();
        }
        setCommandPaletteOpen(false);
      }
    }
  };

  if (!isCommandPaletteOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setCommandPaletteOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.15 }}
          className="relative z-10 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
        >
          {/* Search Header */}
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 px-4 py-3.5">
            <Search className="h-5 w-5 text-indigo-500 shrink-0" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search jobs, skills, companies, or actions..."
              className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
            />
            <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              ESC
            </div>
          </div>

          {/* Results List */}
          <div className="max-h-[380px] overflow-y-auto p-2">
            {allItems.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">
                No matching jobs or commands found for &ldquo;{search}&rdquo;
              </div>
            ) : (
              <div className="space-y-1">
                {matchingJobs.length > 0 && (
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Opportunities
                  </div>
                )}
                {allItems.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  if (item.type === 'job') {
                    const job = item.data;
                    const matchStyle =
                      job.matchScore !== undefined ? getMatchScoreColor(job.matchScore) : null;
                    return (
                      <div
                        key={job.id}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        onClick={() => {
                          setSelectedJobId(job.id);
                          setActiveNav('jobs');
                          setCommandPaletteOpen(false);
                        }}
                        className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-100'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white ${job.companyLogoBg}`}
                          >
                            {job.companyLogoText}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                              {job.title}
                            </p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                              {job.company} • {job.location}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          {matchStyle && (
                            <span
                              className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold ${matchStyle.badgeBg} ${matchStyle.badgeText}`}
                            >
                              {job.matchScore}%
                            </span>
                          )}
                          <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                        </div>
                      </div>
                    );
                  }

                  // Action item
                  const action = item.data;
                  const Icon = action.icon;
                  return (
                    <div
                      key={action.id}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => {
                        action.execute();
                        setCommandPaletteOpen(false);
                      }}
                      className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-100'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {action.title}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        {action.category}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Guide */}
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/70 px-4 py-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-white dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] border border-slate-200 dark:border-slate-700">
                  ↑
                </kbd>
                <kbd className="rounded bg-white dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] border border-slate-200 dark:border-slate-700">
                  ↓
                </kbd>{' '}
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-white dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] border border-slate-200 dark:border-slate-700">
                  ↵
                </kbd>{' '}
                select
              </span>
            </div>
            <span className="font-mono text-[11px] text-indigo-500 font-semibold">
              Cmd+K
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
