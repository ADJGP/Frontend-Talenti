import type { MouseEvent } from 'react';
import { motion } from 'motion/react';
import { MapPin, Bookmark, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { useJobStore } from '../../store/useJobStore';
import { useTranslation } from '../../i18n';
import { formatSalary, getMatchScoreColor, cn } from '../../utils';
import type { Job } from '../../types';

export interface ListCardProps {
  key?: string;
  job: Job;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function ListCard({ job, isSelected, onSelect }: ListCardProps) {
  const { t } = useTranslation();
  const savedJobIds = useJobStore((state) => state.savedJobIds);
  const toggleSaveJob = useJobStore((state) => state.toggleSaveJob);
  const appliedJobs = useJobStore((state) => state.appliedJobs);
  const isSaved = savedJobIds.includes(job.id);
  const application = appliedJobs[job.id];
  const matchStyle = job.matchScore !== undefined ? getMatchScoreColor(job.matchScore) : null;
  const salaryLabel = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);
  const skills = job.skills ?? [];

  const handleClick = () => {
    // Check for native View Transitions API
    const doc = document as unknown as { startViewTransition?: (cb: () => void) => void };
    if (typeof doc.startViewTransition === 'function') {
      doc.startViewTransition(() => {
        onSelect(job.id);
      });
    } else {
      onSelect(job.id);
    }
  };

  const handleBookmark = (e: MouseEvent) => {
    e.stopPropagation();
    toggleSaveJob(job.id);
  };

  return (
    <motion.div
      id={`job-card-${job.id}`}
      layout="position"
      onClick={handleClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={cn(
        'group relative rounded-xl border p-4 transition-all duration-150 cursor-pointer select-none',
        isSelected
          ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-sm ring-1 ring-indigo-500/20'
          : 'border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
      )}
    >
      {/* Active Left Indicator Bar */}
      {isSelected && (
        <motion.div
          layoutId="active-indicator"
          className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-indigo-600 dark:bg-indigo-400"
          transition={{ type: 'spring', stiffness: 450, damping: 35 }}
        />
      )}

      {/* Top Header: Logo, Title, Bookmark */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Company Logo Badge */}
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-xs transition-transform group-hover:scale-105',
              job.companyLogoBg
            )}
          >
            {job.companyLogoText}
          </div>

          <div className="min-w-0 space-y-0.5">
            <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {job.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                {job.company}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                {job.location}
              </span>
            </div>
          </div>
        </div>

        {/* Save Bookmark Action */}
        <button
          onClick={handleBookmark}
          className={cn(
            'shrink-0 rounded-lg p-1.5 transition-colors',
            isSaved
              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50'
              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800'
          )}
          title={isSaved ? t.removeSavedTitle : t.saveJobTitle}
        >
          <Bookmark className={cn('h-4 w-4', isSaved && 'fill-current')} />
        </button>
      </div>

      {/* Middle: Salary & Match Badge */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
        <div
          className={cn(
            'text-xs font-semibold',
            salaryLabel
              ? 'text-slate-900 dark:text-slate-100'
              : 'text-slate-400 dark:text-slate-500 font-normal italic'
          )}
        >
          {salaryLabel || t.salaryUndisclosed}
        </div>

        {/* Match Score Badge — only when the backend provides a score */}
        {matchStyle && (
          <div
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
              matchStyle.badgeBg,
              matchStyle.badgeText,
              matchStyle.badgeBorder
            )}
          >
            <Sparkles className="h-3 w-3 shrink-0" />
            <span>
              {job.matchScore}% {t.matchLabel}
            </span>
          </div>
        )}
      </div>

      {/* Footer: Tags & Status */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex flex-wrap items-center gap-1.5">
          {job.workplaceType && (
            <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-medium text-slate-600 dark:text-slate-300">
              {job.workplaceType}
            </span>
          )}
          {job.employmentType && (
            <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-medium text-slate-600 dark:text-slate-300">
              {job.employmentType}
            </span>
          )}
          {job.experienceLevel && (
            <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-medium text-slate-600 dark:text-slate-300">
              {job.experienceLevel}
            </span>
          )}
          {skills.slice(0, 2).map((skill) => (
            <span
              key={skill}
              className="rounded-md bg-slate-100/70 dark:bg-slate-800/60 px-1.5 py-0.5 text-[10px] text-slate-500 dark:text-slate-400 hidden sm:inline"
            >
              {skill}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {application ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-3 w-3" />
              {t.appliedBadge}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <Clock className="h-2.5 w-2.5" />
              {job.postedAt}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
