import { useEffect, useMemo, useState } from 'react';
import {
  FileCheck,
  TrendingUp,
  User,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Briefcase,
  AlertCircle,
  Loader2,
  Save,
} from 'lucide-react';
import { useJobStore } from '../../store/useJobStore';
import { useTranslation } from '../../i18n';
import { useJobs } from '../../hooks/useJobs';
import { useMyApplications, useWithdrawApplication } from '../../hooks/useApply';
import {
  useCreateProfile,
  useMySkills,
  useProfile,
  useResponseRate,
  useSalaryRadar,
  useSkillCatalog,
  useSkillGap,
  useUpdateProfile,
} from '../../hooks/useProfile';
import { formatSalary } from '../../utils';
import { initialsFor, logoBackgroundFor } from '../../services/jobAdapter';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';
import type { ApplicationStatus } from '../../types';

/** Reusable "could not load" block. */
function ErrorBlock({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border border-dashed border-rose-200 dark:border-rose-900/50 p-8 text-center space-y-3">
      <AlertCircle className="mx-auto h-7 w-7 text-rose-500" />
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
        {t.commonErrorTitle}
      </p>
      {message && <p className="text-xs text-slate-500">{message}</p>}
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          {t.commonRetry}
        </Button>
      )}
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  );
}

// --------------------------------------------------------------------------- //
// Applications tracker (GET /applications)
// --------------------------------------------------------------------------- //

export function ApplicationsView() {
  const { t } = useTranslation();
  const setSelectedJobId = useJobStore((state) => state.setSelectedJobId);
  const setActiveNav = useJobStore((state) => state.setActiveNav);
  const { data, isLoading, error, refetch } = useMyApplications();
  const { data: jobsData } = useJobs();
  const withdraw = useWithdrawApplication();

  // S-04: the backend added `job_offer_title`/`company_name` to
  // `ApplicationSummary`, but `GET /applications` still returns them as `null`
  // (verified 2026-10-13: `ApplicationsPage.from_rows` does not populate them).
  // We prefer the embedded values when present and fall back to the offers
  // already loaded from the API — never an extra per-row request (no N+1).
  const jobsById = useMemo(() => {
    const map = new Map<string, { title: string; company: string; logoBg: string; logoText: string }>();
    for (const job of jobsData?.jobs ?? []) {
      map.set(job.id, {
        title: job.title,
        company: job.company,
        logoBg: job.companyLogoBg,
        logoText: job.companyLogoText,
      });
    }
    return map;
  }, [jobsData]);

  const statusLabels: Record<ApplicationStatus, string> = {
    submitted: t.statusSubmitted,
    in_review: t.statusInReview,
    interviewing: t.statusInterviewing,
    offered: t.statusOffered,
    hired: t.statusHired,
    rejected: t.statusRejected,
    withdrawn: t.statusWithdrawn,
  };

  const items = data?.items ?? [];
  const canWithdraw = (status: string) =>
    !['withdrawn', 'rejected', 'hired'].includes(status);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          {t.applicationsTitle}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {t.applicationsSub}
        </p>
      </div>

      {isLoading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorBlock
          message={error instanceof Error ? error.message : undefined}
          onRetry={() => refetch()}
        />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
            <FileCheck className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            {t.noAppsTitle}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">{t.noAppsSub}</p>
          <Button
            onClick={() => setActiveNav('jobs')}
            className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {t.browseJobsBtn}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {items.map((app) => {
            const job = jobsById.get(app.job_offer_id);
            const title =
              app.job_offer_title ??
              job?.title ??
              `${t.viewRoleBtn} · ${app.job_offer_id.slice(0, 8)}`;
            const companyName = app.company_name ?? job?.company ?? '—';
            const logoSeed = app.company_name ?? job?.company;
            const logoBg =
              job?.logoBg ?? (logoSeed ? logoBackgroundFor(logoSeed) : 'bg-slate-400');
            const logoText = job?.logoText ?? (logoSeed ? initialsFor(logoSeed) : '–');
            return (
              <div
                key={app.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-xs ${logoBg}`}
                  >
                    {logoText}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {companyName} • {t.appliedOn}{' '}
                      {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {t.statusLabel}{' '}
                    {statusLabels[app.status as ApplicationStatus] ?? app.status}
                  </span>

                  {canWithdraw(app.status) && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={withdraw.isPending}
                      onClick={() => withdraw.mutate(app.id)}
                    >
                      {withdraw.isPending ? t.withdrawingBtn : t.withdrawBtn}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedJobId(app.job_offer_id);
                      setActiveNav('jobs');
                    }}
                  >
                    {t.viewRoleBtn}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------- //
// Career insights (self-service analytics — stages 4/5)
// --------------------------------------------------------------------------- //

export function DashboardInsightsView() {
  const { t } = useTranslation();
  const setActiveNav = useJobStore((state) => state.setActiveNav);
  const salaryRadar = useSalaryRadar();
  const skillGap = useSkillGap();
  const responseRate = useResponseRate();

  const radarGroups = salaryRadar.data ?? [];
  const gaps = skillGap.data ?? [];
  const rate = responseRate.data;

  const isLoading = salaryRadar.isLoading || skillGap.isLoading || responseRate.isLoading;
  const isError = salaryRadar.isError && skillGap.isError && responseRate.isError;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {t.insightsTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.insightsSubtitle}
          </p>
        </div>
        <Button
          onClick={() => setActiveNav('jobs')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {t.exploreMatchedBtn}
        </Button>
      </div>

      {isError ? (
        <ErrorBlock
          onRetry={() => {
            salaryRadar.refetch();
            skillGap.refetch();
            responseRate.refetch();
          }}
        />
      ) : (
        <>
          {/* Response rate KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium">{t.insightsResponseRate}</span>
                <TrendingUp className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                {isLoading ? '…' : rate?.response_rate != null ? `${rate.response_rate}%` : '—'}
              </div>
              <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {rate
                  ? `${t.insightsResponsesCount}: ${rate.responses} / ${t.insightsApplicationsCount}: ${rate.applications}`
                  : t.insightsNoData}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium">{t.insightsMatchedOffers}</span>
                <DollarSign className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                {isLoading ? '…' : radarGroups.reduce((sum, g) => sum + g.matched_offers, 0)}
              </div>
              <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {t.insightsSalaryRadar}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium">{t.insightsSkillGap}</span>
                <ShieldCheck className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                {isLoading ? '…' : gaps.length}
              </div>
              <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {t.profileSkillsLabel}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium">{t.insightsApplicationsCount}</span>
                <Briefcase className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                {isLoading ? '…' : rate?.applications ?? 0}
              </div>
              <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {rate?.window_days ? `≤ ${rate.window_days} días` : ''}
              </div>
            </div>
          </div>

          {/* Salary radar (§1.1.1) */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              {t.insightsSalaryRadar}
            </h3>
            {isLoading ? (
              <Skeleton className="h-28 w-full rounded-xl" />
            ) : radarGroups.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.insightsNoData}</p>
            ) : (
              radarGroups.map((group) => (
                <div key={group.salary_currency} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {group.salary_currency}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {group.matched_offers} {t.insightsMatchedOffers}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {group.percentiles.map((p) => (
                      <div
                        key={p.percentile}
                        className="rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/60 dark:bg-slate-900/50 p-3"
                      >
                        <span className="text-[11px] text-slate-400 block">
                          {t.insightsPercentile} {p.percentile}
                        </span>
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-0.5 block">
                          {formatSalary(
                            Math.round((p.salary_min_cents ?? 0) / 100),
                            Math.round((p.salary_max_cents ?? 0) / 100),
                            group.salary_currency
                          ) || t.salaryUndisclosed}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Skill gap (§1.1.2) */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
              {t.insightsSkillGap}
            </h3>
            {isLoading ? (
              <Skeleton className="h-24 w-full rounded-xl" />
            ) : gaps.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.insightsNoData}</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {gaps.map((skill) => (
                  <div key={skill.skill_id} className="flex items-center justify-between py-2.5">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {skill.name}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {skill.offers} {t.insightsOffersDemand}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------- //
// Candidate profile (GET|POST /profiles, PATCH /profiles/me, PUT /profiles/skills)
// --------------------------------------------------------------------------- //

interface ProfileFormState {
  headline: string;
  bio: string;
  phone: string;
  location: string;
  experience_years: number;
  is_open_to_work: boolean;
  resume_url: string;
}

const EMPTY_FORM: ProfileFormState = {
  headline: '',
  bio: '',
  phone: '',
  location: '',
  experience_years: 0,
  is_open_to_work: true,
  resume_url: '',
};

export function ProfileView() {
  const { t } = useTranslation();
  const { data: profile, isLoading, error, refetch } = useProfile();
  const { data: mySkills } = useMySkills();
  const { data: catalog } = useSkillCatalog();
  const createProfile = useCreateProfile();
  const updateProfile = useUpdateProfile();

  const [form, setForm] = useState<ProfileFormState>(EMPTY_FORM);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Load the fetched profile / skills into the editable form.
  useEffect(() => {
    if (profile) {
      setForm({
        headline: profile.headline ?? '',
        bio: profile.bio ?? '',
        phone: profile.phone ?? '',
        location: profile.location ?? '',
        experience_years: profile.experience_years ?? 0,
        is_open_to_work: profile.is_open_to_work,
        resume_url: profile.resume_url ?? '',
      });
    }
  }, [profile]);

  useEffect(() => {
    if (mySkills) setSelectedSlugs(mySkills.map((s) => s.slug));
  }, [mySkills]);

  const toggleSkill = (slug: string) => {
    setSelectedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug].slice(0, 50)
    );
  };

  const handleSave = async () => {
    setFormError(null);
    if (!form.headline.trim()) {
      setFormError(t.profileHeadline);
      return;
    }
    try {
      if (profile) {
        await updateProfile.mutateAsync({
          headline: form.headline.trim(),
          bio: form.bio.trim() || null,
          phone: form.phone.trim() || null,
          location: form.location.trim() || null,
          experience_years: Number(form.experience_years) || 0,
          is_open_to_work: form.is_open_to_work,
          resume_url: form.resume_url.trim() || null,
        });
      } else {
        await createProfile.mutateAsync({
          headline: form.headline.trim(),
          bio: form.bio.trim() || null,
          phone: form.phone.trim() || null,
          location: form.location.trim() || null,
          experience_years: Number(form.experience_years) || 0,
          is_open_to_work: form.is_open_to_work,
          resume_url: form.resume_url.trim() || null,
        });
      }
      setSavedAt(Date.now());
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t.commonErrorTitle);
    }
  };

  const isSaving = createProfile.isPending || updateProfile.isPending;

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full overflow-y-auto p-6 max-w-4xl mx-auto">
        <ErrorBlock message={error.message} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {t.profileTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.profileSub}</p>
        </div>
        {profile && (
          <Badge variant="success" className="gap-1">
            <ShieldCheck className="h-3 w-3" />
            {t.verifiedCandidateBadge}
          </Badge>
        )}
      </div>

      {!profile && (
        <div className="rounded-2xl border border-dashed border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 text-xs text-indigo-900 dark:text-indigo-200">
          <strong className="font-semibold">{t.profileNoProfileTitle}. </strong>
          {t.profileNoProfileSub}
        </div>
      )}

      {/* Editable profile card */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <User className="h-6 w-6" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.compatibilityDesc}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {t.profileHeadline} *
            </label>
            <Input
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
              maxLength={200}
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {t.profileBioLabel}
            </label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 shadow-2xs resize-none placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {t.profilePhone}
            </label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              maxLength={40}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {t.profileLocationLabel}
            </label>
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              maxLength={120}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {t.profileExperienceYears}
            </label>
            <Input
              type="number"
              min={0}
              max={50}
              value={form.experience_years}
              onChange={(e) => setForm({ ...form, experience_years: Number(e.target.value) })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {t.profileResumeUrl}
            </label>
            <Input
              value={form.resume_url}
              onChange={(e) => setForm({ ...form, resume_url: e.target.value })}
              placeholder="https://…"
            />
          </div>

          <label className="flex items-center gap-2 sm:col-span-2 text-xs text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={form.is_open_to_work}
              onChange={(e) => setForm({ ...form, is_open_to_work: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            {t.profileOpenToWork}
          </label>
        </div>

        {formError && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {formError}
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {profile ? t.profileSaveBtn : t.profileCreateBtn}
          </Button>
          {savedAt && !isSaving && (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {t.profileSaved}
            </span>
          )}
        </div>
      </div>

      {/* Declared skills (PUT /profiles/skills) */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {t.profileSkillsLabel}
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">{selectedSlugs.length}/50</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(catalog ?? []).map((skill) => {
            const active = selectedSlugs.includes(skill.slug);
            return (
              <button
                key={skill.skill_id}
                type="button"
                onClick={() => toggleSkill(skill.slug)}
                className={`rounded-lg border px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:text-slate-300'
                }`}
              >
                {skill.name}
              </button>
            );
          })}
          {!catalog?.length && (
            <p className="text-xs text-slate-500 dark:text-slate-400">{t.insightsNoData}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------- //
// Settings (unchanged)
// --------------------------------------------------------------------------- //

export function SettingsView() {
  const theme = useJobStore((state) => state.theme);
  const setTheme = useJobStore((state) => state.setTheme);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Application Preferences &amp; Settings
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure search thresholds, theme, and instant notifications
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 text-sm shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3">
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">
              Appearance Theme
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
              Current mode: {theme}
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(['light', 'dark', 'system'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setTheme(mode)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer capitalize ${
                  theme === mode
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between p-4">
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">
              Split View Keyboard Shortcuts
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enable J / K navigation and A (Apply) shortcut
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            Enabled
          </span>
        </div>
      </div>
    </div>
  );
}

