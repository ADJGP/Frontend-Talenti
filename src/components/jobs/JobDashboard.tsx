import { useMemo } from 'react';
import { useJobs, useJobDetail } from '../../hooks/useJobs';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useJobStore } from '../../store/useJobStore';
import { FilterBar } from './FilterBar';
import { ListCard } from './ListCard';
import { DetailsView } from './DetailsView';
import { MobileDetailDrawer } from './MobileDetailDrawer';
import { Skeleton } from '../ui/skeleton';
import { Briefcase, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';

export function JobDashboard() {
  const { data, isLoading, error, refetch } = useJobs();
  const selectedJobId = useJobStore((state) => state.selectedJobId);
  const setSelectedJobId = useJobStore((state) => state.setSelectedJobId);
  const setMobileDetailOpen = useJobStore((state) => state.setMobileDetailOpen);
  const resetFilters = useJobStore((state) => state.resetFilters);

  const jobs = useMemo(() => data?.jobs || [], [data]);

  // Hook up keyboard shortcuts: J, K, A, S, Cmd+K, ?
  useKeyboardShortcuts({ jobs });

  // Get active selected job
  const activeJob = useMemo(() => {
    if (!jobs.length) return null;
    return jobs.find((j) => j.id === selectedJobId) || jobs[0];
  }, [jobs, selectedJobId]);

  // Fetch full detail for the active job
  const { data: detailJob, isLoading: isDetailLoading } = useJobDetail(
    activeJob ? activeJob.id : null
  );

  const handleSelectJob = (id: string) => {
    setSelectedJobId(id);
    // On mobile screens, also open the full-screen drawer
    if (window.innerWidth < 1024) {
      setMobileDetailOpen(true);
    }
  };

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Left Column: Job List & Filters */}
      <section className="flex flex-col w-full lg:w-[420px] xl:w-[460px] shrink-0 border-r border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 h-full overflow-hidden">
        {/* Filter controls */}
        <FilterBar totalCount={jobs.length} />

        {/* Scrollable Job Cards List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {isLoading ? (
            // Skeleton Screens for list cards
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 p-4 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center space-y-3">
              <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Failed to load job listings
              </p>
              <Button size="sm" onClick={() => refetch()}>
                Retry Fetch
              </Button>
            </div>
          ) : jobs.length === 0 ? (
            <div className="py-16 px-4 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                <Briefcase className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                No matching opportunities found
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Try loosening your filters or resetting to view all vetted positions.
              </p>
              <Button size="sm" variant="outline" onClick={resetFilters}>
                Clear All Filters
              </Button>
            </div>
          ) : (
            jobs.map((job) => (
              <ListCard
                key={job.id}
                job={job}
                isSelected={activeJob?.id === job.id}
                onSelect={handleSelectJob}
              />
            ))
          )}
        </div>
      </section>

      {/* Right Column: Dynamic Sticky Details Panel (Desktop) */}
      <section className="hidden lg:flex flex-1 h-full flex-col overflow-hidden bg-white dark:bg-slate-900/60">
        <DetailsView job={detailJob || activeJob} isLoading={isDetailLoading} />
      </section>

      {/* Mobile Drawer (Responsive Overlay on Phone & Tablet) */}
      <MobileDetailDrawer job={detailJob || activeJob} isLoading={isDetailLoading} />
    </div>
  );
}
