import { Search, X, ArrowUpDown } from 'lucide-react';
import { useJobStore } from '../../store/useJobStore';
import { useTranslation } from '../../i18n';
import type { SortOption, WorkplaceType } from '../../types';
import type { JobOffersFacetsDto } from '../../services/talentiTypes';

interface FilterBarProps {
  totalCount: number;
  facets?: JobOffersFacetsDto;
}

const WORK_MODE_VALUE: Record<Exclude<WorkplaceType, 'All'>, string> = {
  Remote: 'remote',
  Hybrid: 'hybrid',
  'On-site': 'onsite',
};

export function FilterBar({ totalCount, facets }: FilterBarProps) {
  const { t } = useTranslation();
  const filters = useJobStore((state) => state.filters);
  const setFilters = useJobStore((state) => state.setFilters);
  const resetFilters = useJobStore((state) => state.resetFilters);

  const workplaceOptions: { value: WorkplaceType; label: string }[] = [
    { value: 'All', label: t.workplaceAll },
    { value: 'Remote', label: t.workplaceRemote },
    { value: 'Hybrid', label: t.workplaceHybrid },
    { value: 'On-site', label: t.workplaceOnsite },
  ];

  // Real counts straight from the backend facet panel.
  const workModeCount = (value: WorkplaceType) =>
    value === 'All'
      ? facets?.work_modes.reduce((sum, row) => sum + row.count, 0) ?? undefined
      : facets?.work_modes.find((row) => row.value === WORK_MODE_VALUE[value])?.count;

  const categories = facets?.categories ?? [];
  const hasSearch = filters.search.trim().length > 0;

  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.categoryId !== null ||
    filters.workplaceType !== 'All' ||
    filters.minSalary > 0 ||
    filters.onlySaved ||
    filters.onlyApplied;

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'recent', label: t.sortRecent },
    ...(hasSearch ? [{ value: 'match' as SortOption, label: t.sortRelevance }] : []),
  ];

  return (
    <div className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 p-3 sm:p-4 space-y-3">
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          placeholder={t.filterPlaceholder}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-9 pr-8 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs transition-all"
        />
        {filters.search && (
          <button
            onClick={() => setFilters({ search: '' })}
            className="absolute right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Workplace Type Pills + Sort */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-[11px] font-medium text-slate-400 mr-1 hidden sm:inline">
          {t.workplace}
        </span>
        {workplaceOptions.map((opt) => {
          const active = filters.workplaceType === opt.value;
          const count = workModeCount(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => setFilters({ workplaceType: opt.value })}
              className={`rounded-lg px-2.5 py-1 font-medium transition-all cursor-pointer ${
                active
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {opt.label}
              {count !== undefined && (
                <span className={active ? 'ml-1 text-white/70' : 'ml-1 text-slate-400'}>
                  {count}
                </span>
              )}
            </button>
          );
        })}

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

        {/* Min salary (backend `min_salary`, whole currency units) */}
        <select
          value={filters.minSalary}
          onChange={(e) => setFilters({ minSalary: Number(e.target.value) })}
          aria-label={t.noSalaryFilter}
          className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
        >
          <option value={0}>{t.noSalaryFilter}</option>
          <option value={20000}>≥ $20k</option>
          <option value={50000}>≥ $50k</option>
          <option value={80000}>≥ $80k</option>
          <option value={120000}>≥ $120k</option>
        </select>

        {/* Sort selector (only backend-supported sorts) */}
        <div className="ml-auto flex items-center gap-1.5">
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters({ sortBy: e.target.value as SortOption })}
            aria-label="Sort job listings"
            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category facet pills + total & reset */}
      <div className="flex items-center justify-between pt-0.5 text-xs">
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          <button
            onClick={() => setFilters({ categoryId: null })}
            className={`whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
              filters.categoryId === null
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {t.workplaceAll}
          </button>
          {categories.map((category) => {
            const active = filters.categoryId === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setFilters({ categoryId: active ? null : category.id })}
                className={`whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {category.name ?? '—'}
                <span className={active ? 'ml-1 text-white/60' : 'ml-1 text-slate-400'}>
                  {category.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Total found & reset */}
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            {totalCount} {totalCount === 1 ? t.roleSingleCount : t.rolesCount}
          </span>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              {t.resetFilters}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
