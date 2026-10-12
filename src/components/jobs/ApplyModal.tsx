import { useState, type FormEvent } from 'react';
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { useJobStore } from '../../store/useJobStore';
import { useApply } from '../../hooks/useApply';
import { useAuthStore } from '../../store/useAuthStore';
import { useTranslation } from '../../i18n';
import { ApiError } from '../../services/api';
import { formatSalary } from '../../utils';
import type { Job } from '../../types';
import { Send, CheckCircle2, AlertCircle, LogIn } from 'lucide-react';

interface ApplyModalProps {
  job: Job | null;
}

/** Map the backend failure to a user-facing message. */
function applyErrorMessage(error: unknown, t: ReturnType<typeof useTranslation>['t']): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return t.commonBackendOffline;
    if (error.status === 409) return t.errorAlreadyApplied;
    if (error.status === 400) return error.detail ?? t.errorQuota;
    if (error.status === 403) return error.detail ?? t.errorCompanyInactive;
    if (error.status === 429) {
      return error.retryAfter
        ? `${t.commonErrorTitle} (${error.retryAfter}s)`
        : t.commonErrorTitle;
    }
    return error.detail ?? t.commonErrorTitle;
  }
  return error instanceof Error ? error.message : t.commonErrorTitle;
}

export function ApplyModal({ job }: ApplyModalProps) {
  const { t } = useTranslation();
  const isApplyModalOpen = useJobStore((state) => state.isApplyModalOpen);
  const setApplyModalOpen = useJobStore((state) => state.setApplyModalOpen);
  const setAuthOpen = useJobStore((state) => state.setAuthOpen);
  const appliedJobs = useJobStore((state) => state.appliedJobs);
  const status = useAuthStore((state) => state.status);

  const [coverNote, setCoverNote] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const applyMutation = useApply();

  if (!job) return null;

  const isAuthenticated = status === 'authenticated';
  const application = appliedJobs[job.id];
  const salaryLabel = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    applyMutation.mutate(
      {jobOfferId: job.id, coverLetter: coverNote.trim() || null},
      {
        onSuccess: () => {
          setIsSuccess(true);
          setTimeout(() => {
            setIsSuccess(false);
            setCoverNote('');
            setApplyModalOpen(false);
          }, 1800);
        },
      }
    );
  };

  return (
    <Dialog
      open={isApplyModalOpen}
      onOpenChange={(open) => {
        if (!applyMutation.isPending) {
          setApplyModalOpen(open);
          setIsSuccess(false);
        }
      }}
      maxWidth="lg"
    >
      <DialogHeader onClose={() => setApplyModalOpen(false)}>
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-xs ${job.companyLogoBg}`}
          >
            {job.companyLogoText}
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {t.quickApplyBtn}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {job.title} · {job.company}
            </p>
          </div>
        </div>
      </DialogHeader>

      <DialogContent>
        {!isAuthenticated ? (
          <div className="flex flex-col items-center justify-center space-y-3 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <LogIn className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {t.authRequiredTitle}
            </h3>
            <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
              {t.authRequiredSub}
            </p>
            <Button
              onClick={() => {
                setApplyModalOpen(false);
                setAuthOpen(true);
              }}
              className="mt-1 bg-indigo-600 text-white hover:bg-indigo-700"
            >
              {t.authSignIn}
            </Button>
          </div>
        ) : isSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {t.appSubmittedTitle}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
              {t.appSubmittedDesc}{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {job.company}
              </span>
              .
            </p>
          </div>
        ) : (
          <form id="apply-form" onSubmit={handleSubmit} className="space-y-4">
            {salaryLabel && (
              <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/80 p-3 dark:border-indigo-900/60 dark:bg-indigo-950/50">
                <span className="text-xs font-medium text-indigo-950 dark:text-indigo-200">
                  {t.statusLabel}{' '}
                  <strong className="font-bold">
                    {application ? application.status : t.quickApplyNowBtn}
                  </strong>
                </span>
                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                  {salaryLabel}
                </span>
              </div>
            )}

            <p className="text-xs text-slate-500 dark:text-slate-400">{t.applyIdentityNote}</p>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {t.introNoteLabel}
              </label>
              <textarea
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                placeholder={t.introNotePlaceholder}
                rows={4}
                maxLength={10000}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 shadow-2xs resize-none placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            {applyMutation.isError && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{applyErrorMessage(applyMutation.error, t)}</span>
              </div>
            )}
          </form>
        )}
      </DialogContent>

      {isAuthenticated && !isSuccess && (
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setApplyModalOpen(false)}
            disabled={applyMutation.isPending}
          >
            {t.cancelBtn}
          </Button>
          <Button
            type="submit"
            form="apply-form"
            disabled={applyMutation.isPending || Boolean(application)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {applyMutation.isPending ? (
              <span>{t.submittingApplicationBtn}</span>
            ) : application ? (
              <span>{t.applyAlreadyApplied}</span>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                <span>{t.submitApplicationBtn}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      )}
    </Dialog>
  );
}
