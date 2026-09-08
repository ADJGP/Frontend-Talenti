import { useState, type FormEvent } from 'react';
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useJobStore } from '../../store/useJobStore';
import { useApply } from '../../hooks/useApply';
import { formatSalary } from '../../utils';
import type { Job } from '../../types';
import { Send, FileText, CheckCircle2, Sparkles, Building2 } from 'lucide-react';

interface ApplyModalProps {
  job: Job | null;
}

export function ApplyModal({ job }: ApplyModalProps) {
  const isApplyModalOpen = useJobStore((state) => state.isApplyModalOpen);
  const setApplyModalOpen = useJobStore((state) => state.setApplyModalOpen);
  const appliedJobs = useJobStore((state) => state.appliedJobs);

  const [fullName, setFullName] = useState('Alex Vance');
  const [email, setEmail] = useState('alex.vance@techinnovator.io');
  const [phone, setPhone] = useState('+1 (415) 890-2341');
  const [resumeName, setResumeName] = useState('Alex_Vance_Staff_Engineer_Resume.pdf');
  const [coverNote, setCoverNote] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const applyMutation = useApply();

  if (!job) return null;

  const alreadyApplied = Boolean(appliedJobs[job.id]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    applyMutation.mutate(
      {
        jobId: job.id,
        appliedAt: 'Just now',
        fullName,
        email,
        phone,
        resumeFileName: resumeName,
        coverNote,
        status: 'Screening',
      },
      {
        onSuccess: () => {
          setIsSuccess(true);
          setTimeout(() => {
            setIsSuccess(false);
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
              Quick 1-Click Application
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {job.title} at {job.company}
            </p>
          </div>
        </div>
      </DialogHeader>

      <DialogContent>
        {isSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Application Submitted!
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
              Your verified talent profile and resume were directly dispatched to{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {job.hiringManager.name}
              </span>{' '}
              ({job.hiringManager.role}).
            </p>
          </div>
        ) : (
          <form id="apply-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Quick Match Banner */}
            <div className="flex items-center justify-between rounded-xl bg-indigo-50/80 dark:bg-indigo-950/50 p-3 border border-indigo-100 dark:border-indigo-900/60">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-medium text-indigo-950 dark:text-indigo-200">
                  Profile Compatibility: <strong className="font-bold">{job.matchScore}% Match</strong>
                </span>
              </div>
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
              </span>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Full Name
                </label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Resume Upload Pill */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Attached Resume
              </label>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-medium text-slate-900 dark:text-slate-100 block">
                      {resumeName}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Auto-tailored for {job.department} • 148 KB
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const newName = prompt('Enter resume file name or upload title:', resumeName);
                    if (newName) setResumeName(newName);
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium"
                >
                  Change
                </button>
              </div>
            </div>

            {/* Pitch / Note */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Brief Introduction Note (Optional)
              </label>
              <textarea
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                placeholder={`Hi ${job.hiringManager.name.split(' ')[0]}, I would love to connect about ${job.company}'s engineering initiatives...`}
                rows={3}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs resize-none"
              />
            </div>
          </form>
        )}
      </DialogContent>

      {!isSuccess && (
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setApplyModalOpen(false)}
            disabled={applyMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="apply-form"
            disabled={applyMutation.isPending}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {applyMutation.isPending ? (
              <span>Submitting Application...</span>
            ) : alreadyApplied ? (
              <span>Update Application</span>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                <span>Submit Quick Application</span>
              </>
            )}
          </Button>
        </DialogFooter>
      )}
    </Dialog>
  );
}
