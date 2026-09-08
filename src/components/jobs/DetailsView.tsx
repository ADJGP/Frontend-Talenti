import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2,
  MapPin,
  Sparkles,
  Bookmark,
  Share2,
  Send,
  CheckCircle2,
  Users,
  ShieldCheck,
  Check,
  Clock,
  ArrowUpRight,
  Briefcase,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { useJobStore } from '../../store/useJobStore';
import { useTranslation } from '../../i18n';
import { formatSalary, getMatchScoreColor, cn } from '../../utils';
import type { Job } from '../../types';

interface DetailsViewProps {
  job: Job | null;
  isLoading?: boolean;
}

export function DetailsView({ job, isLoading }: DetailsViewProps) {
  const { t } = useTranslation();
  const setApplyModalOpen = useJobStore((state) => state.setApplyModalOpen);
  const savedJobIds = useJobStore((state) => state.savedJobIds);
  const toggleSaveJob = useJobStore((state) => state.toggleSaveJob);
  const appliedJobs = useJobStore((state) => state.appliedJobs);

  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="h-full p-6 space-y-6 overflow-y-auto">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-2xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mb-3">
          <Briefcase className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
          {t.selectRolePrompt}
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xs">
          {t.selectRoleSub}
        </p>
      </div>
    );
  }

  const isSaved = savedJobIds.includes(job.id);
  const application = appliedJobs[job.id];
  const matchStyle = getMatchScoreColor(job.matchScore);

  const getLocalizedMatchLabel = (score: number) => {
    if (score >= 95) return t.exceptionalMatch;
    if (score >= 88) return t.strongMatch;
    if (score >= 80) return t.goodMatch;
    return t.moderateMatch;
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  return (
    <div className="relative h-full flex flex-col bg-white/40 dark:bg-slate-900/40 backdrop-blur-xs overflow-hidden">
      {/* Sticky Top Header with Primary Actions */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-6 py-4 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-bold text-white shadow-sm',
              job.companyLogoBg
            )}
          >
            {job.companyLogoText}
          </div>
          <div className="min-w-0 space-y-0.5">
            <h1 className="truncate text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {job.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {job.company}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-slate-400" />
                {job.location}
              </span>
              <span>•</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
              </span>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Share button */}
          <button
            onClick={handleShare}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors cursor-pointer"
            title={t.shareTooltip}
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
          </button>

          {/* Bookmark Button */}
          <button
            onClick={() => toggleSaveJob(job.id)}
            className={cn(
              'flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors cursor-pointer',
              isSaved
                ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
            )}
            title={isSaved ? t.removeSavedTitle : t.saveJobTitle}
          >
            <Bookmark className={cn('h-3.5 w-3.5', isSaved && 'fill-current')} />
            <span className="hidden sm:inline">{isSaved ? t.savedBtn : t.saveBtn}</span>
            <kbd className="hidden lg:inline text-[10px] text-slate-400 font-mono">S</kbd>
          </button>

          {/* Quick Apply CTA */}
          <Button
            onClick={() => setApplyModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-medium cursor-pointer"
          >
            {application ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <span>{t.appliedBadge} ({application.status})</span>
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                <span>{t.quickApplyBtn}</span>
                <kbd className="hidden sm:inline rounded bg-indigo-800/60 px-1 py-0.2 text-[10px] font-mono text-indigo-200">
                  A
                </kbd>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Scrollable Content Body with AnimatePresence */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="space-y-6"
          >
            {/* Match Score Deep Dive Card */}
            <div className="rounded-2xl border border-indigo-100 dark:border-indigo-950/80 bg-gradient-to-br from-indigo-50/60 via-white to-slate-50 dark:from-indigo-950/30 dark:via-slate-900/60 dark:to-slate-900 p-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-100/80 dark:border-indigo-900/40 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold',
                      matchStyle.badgeBg,
                      matchStyle.badgeText
                    )}
                  >
                    {job.matchScore}%
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {getLocalizedMatchLabel(job.matchScore)} {t.forYourProfile}
                      </h4>
                      <Badge variant="indigo" className="text-[10px]">
                        {t.aiEvaluated}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t.compatibilityDesc}
                    </p>
                  </div>
                </div>

                {/* Micro match bars */}
                <div className="flex items-center gap-4 text-xs">
                  <div className="space-y-1 text-center">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{t.skillsScore}</span>
                    <p className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {job.matchBreakdown.skillsMatch}%
                    </p>
                  </div>
                  <div className="space-y-1 text-center">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{t.experienceScore}</span>
                    <p className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {job.matchBreakdown.experienceMatch}%
                    </p>
                  </div>
                  <div className="space-y-1 text-center">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{t.salaryFitScore}</span>
                    <p className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {job.matchBreakdown.salaryFit}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Match Highlights list */}
              <div className="mt-4 space-y-2">
                <span className="text-[11px] font-semibold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">
                  {t.keyFactorsTitle}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
                  {job.matchHighlights.map((hl, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                      <span>{hl}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Metadata Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 p-3">
                <span className="text-[11px] text-slate-400 block font-medium">{t.departmentLabel}</span>
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-0.5 block">
                  {job.department}
                </span>
              </div>
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 p-3">
                <span className="text-[11px] text-slate-400 block font-medium">{t.experienceLevelLabel}</span>
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-0.5 block">
                  {job.experienceLevel}
                </span>
              </div>
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 p-3">
                <span className="text-[11px] text-slate-400 block font-medium">{t.workplaceLabel}</span>
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-0.5 block">
                  {job.workplaceType}
                </span>
              </div>
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 p-3">
                <span className="text-[11px] text-slate-400 block font-medium">{t.applicantsLabel}</span>
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-0.5 block">
                  {job.applicantsCount} {t.candidatesUnit}
                </span>
              </div>
            </div>

            {/* Required Skills & Tech Stack */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t.coreTechTitle}
              </h3>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-800 dark:text-slate-200 shadow-2xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Role Overview */}
            <div className="space-y-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t.roleOverviewTitle}
              </h3>
              <p className="whitespace-pre-line">{job.description}</p>
            </div>

            {/* Responsibilities */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t.responsibilitiesTitle}
              </h3>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {job.responsibilities.map((resp, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-2 shrink-0" />
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Requirements */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t.requirementsTitle}
              </h3>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {job.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Benefits */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t.benefitsTitle}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {job.benefits.map((b, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/50 dark:bg-slate-900/50 p-3 text-slate-700 dark:text-slate-300"
                  >
                    <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hiring Manager & Company Meta */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200/80 dark:border-slate-800/80 pt-6">
              {/* Hiring Manager Card */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 p-4">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                  {t.hiringManagerTitle}
                </span>
                <div className="flex items-center gap-3">
                  <img
                    src={job.hiringManager.avatar}
                    alt={job.hiringManager.name}
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-indigo-500/20"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {job.hiringManager.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {job.hiringManager.role}
                    </p>
                    {job.hiringManager.responseRate && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                        <Clock className="h-3 w-3" />
                        {job.hiringManager.responseRate}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Company Details */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 p-4 space-y-2 text-xs">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  {t.aboutCompanyTitle} {job.company}
                </span>
                <p className="text-slate-600 dark:text-slate-400">{job.tagline}</p>
                <div className="flex flex-wrap items-center gap-3 text-slate-500 dark:text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {job.companySize}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {job.headquarters}
                  </span>
                </div>
                <div className="pt-1">
                  <a
                    href={job.companyWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    {t.visitCompanyProfile}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom Quick Apply Bar in Details */}
            <div className="rounded-2xl bg-slate-100 dark:bg-slate-850 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {t.readyToLeapTitle}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.readyToLeapSub}
                </p>
              </div>
              <Button
                onClick={() => setApplyModalOpen(true)}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 shadow-sm cursor-pointer"
              >
                {application ? t.reviewSubmittedBtn : t.quickApplyNowBtn}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
