import { Search, X, ArrowUpDown } from 'lucide-react';
import { useJobStore } from '../../store/useJobStore';
import { useTranslation } from '../../i18n';
import type { Department, WorkplaceType, SortOption } from '../../types';

interface FilterBarProps {
  totalCount: number;
}

export function FilterBar({ totalCount }: FilterBarProps) {
  const { t } = useTranslation();
  const filters = useJobStore((state) => state.filters);
  const setFilters = useJobStore((state) => state.setFilters);
  const resetFilters = useJobStore((state) => state.resetFilters);

  const departments: Department[] = ['All', 'Engineering', 'Design', 'Product', 'Data & AI', 'DevOps'];
  const workplaceOptions: { value: WorkplaceType; label: string }[] = [
    { value: 'All', label: t.workplaceAll },
    { value: 'Remote', label: t.workplaceRemote },
    { value: 'Hybrid', label: t.workplaceHybrid },
    { value: 'On-site', label: t.workplaceOnsite },
  ];

  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.department !== 'All' ||
    filters.workplaceType !== 'All' ||
    filters.experienceLevel !== 'All' ||
    filters.minSalary > 0 ||
    filters.onlySaved ||
    filters.onlyApplied;

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

      {/* Workplace Type and Department Pills */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-[11px] font-medium text-slate-400 mr-1 hidden sm:inline">
          {t.workplace}
        </span>
        {workplaceOptions.map((opt) => {
          const active = filters.workplaceType === opt.value;
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
            </button>
          );
        })}

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

        {/* Sort selector */}
        <div className="ml-auto flex items-center gap-1.5">
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters({ sortBy: e.target.value as SortOption })}
            aria-label="Sort job listings"
            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="match">{t.sortHighestMatch}</option>
            <option value="recent">{t.sortRecent}</option>
            <option value="salary-high">{t.sortSalaryHigh}</option>
            <option value="salary-low">{t.sortSalaryLow}</option>
          </select>
        </div>
      </div>

      {/* Secondary filter strip: Departments & Clear */}
      <div className="flex items-center justify-between pt-0.5 text-xs">
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          {departments.map((dept) => {
            const active = filters.department === dept;
            const deptLabel = dept === 'All' ? t.workplaceAll : dept;
            return (
              <button
                key={dept}
                onClick={() => setFilters({ department: dept })}
                className={`whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {deptLabel}
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

