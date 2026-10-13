import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Briefcase,
  Building2,
  ChevronRight,
  Loader2,
  Plus,
  Send,
  TrendingUp,
  Users,
} from 'lucide-react';
import { isUuid } from '../../services/api';
import { useTranslation } from '../../i18n';
import { useAuthStore } from '../../store/useAuthStore';
import {
  RECRUITER_STATUSES,
  useCloseOffer,
  useCompany,
  useCompanyMembers,
  useCompanyMetrics,
  useCompanyOffers,
  useCreateCompany,
  useCreateOffer,
  useOfferApplications,
  usePublishOffer,
  useRecruiterCompanyId,
  useSetRecruiterCompanyId,
  useTransitionApplication,
} from '../../hooks/useRecruiter';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';
import type { ApplicationStatus } from '../../types';

const MODALITIES = ['remote', 'hybrid', 'onsite'] as const;
const EMPLOYMENT_TYPES = [
  'full_time',
  'part_time',
  'contract',
  'temporary',
  'internship',
] as const;

function useStatusLabels() {
  const { t } = useTranslation();
  return {
    submitted: t.statusSubmitted,
    in_review: t.statusInReview,
    interviewing: t.statusInterviewing,
    offered: t.statusOffered,
    hired: t.statusHired,
    rejected: t.statusRejected,
    withdrawn: t.statusWithdrawn,
  } as Record<ApplicationStatus, string>;
}

function ErrorBlock({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border border-dashed border-rose-200 dark:border-rose-900/50 p-6 text-center space-y-3">
      <AlertCircle className="mx-auto h-6 w-6 text-rose-500" />
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

/** Company selection: paste a known UUID or create a new company (F7 bootstrap). */
function CompanySetup() {
  const { t } = useTranslation();
  const setRecruiterCompanyId = useSetRecruiterCompanyId();
  const createCompany = useCreateCompany();
  const [companyIdInput, setCompanyIdInput] = useState('');
  const [form, setForm] = useState({
    name: '',
    slug: '',
    industry: '',
    location: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleUseExisting = () => {
    const value = companyIdInput.trim();
    if (!isUuid(value)) {
      setError(t.recruiterCompanyIdInvalid);
      return;
    }
    setError(null);
    setRecruiterCompanyId(value);
  };

  const handleCreate = async () => {
    setError(null);
    if (!form.name.trim() || !form.slug.trim()) {
      setError(t.recruiterCompanyRequired);
      return;
    }
    try {
      await createCompany.mutateAsync({
        name: form.name.trim(),
        slug: form.slug.trim(),
        industry: form.industry.trim() || null,
        location: form.location.trim() || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.commonErrorTitle);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          {t.recruiterSetupTitle}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {t.recruiterSetupSub}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 space-y-3 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {t.recruiterUseExistingTitle}
        </h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={companyIdInput}
            onChange={(e) => setCompanyIdInput(e.target.value)}
            placeholder={t.recruiterCompanyIdPlaceholder}
          />
          <Button onClick={handleUseExisting} variant="outline" className="shrink-0">
            {t.recruiterUseCompanyBtn}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 space-y-3 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {t.recruiterCreateCompanyTitle}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {t.recruiterCompanyName} *
            </label>
            <Input
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
              maxLength={200}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {t.recruiterCompanySlug} *
            </label>
            <Input
              value={form.slug}
              onChange={(e) => setForm({...form, slug: e.target.value})}
              placeholder="mi_empresa"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {t.recruiterCompanyIndustry}
            </label>
            <Input
              value={form.industry}
              onChange={(e) => setForm({...form, industry: e.target.value})}
              maxLength={150}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {t.recruiterCompanyLocation}
            </label>
            <Input
              value={form.location}
              onChange={(e) => setForm({...form, location: e.target.value})}
              maxLength={150}
            />
          </div>
        </div>
        <Button
          onClick={handleCreate}
          disabled={createCompany.isPending}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {createCompany.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {createCompany.isPending ? t.recruiterCreatingBtn : t.recruiterCreateCompanyBtn}
        </Button>
      </div>
    </div>
  );
}

/** Applicants of one offer + status advancement (backend S-09). */
function OfferApplicants({ offerId }: { offerId: string }) {
  const { t } = useTranslation();
  const statusLabels = useStatusLabels();
  const { data, isLoading, error, refetch } = useOfferApplications(offerId);
  const transition = useTransitionApplication(offerId);
  const items = data?.items ?? [];

  if (isLoading) return <Skeleton className="h-24 w-full rounded-xl" />;
  if (error) return <ErrorBlock message={error.message} onRetry={() => refetch()} />;
  if (!items.length) {
    return <p className="text-xs text-slate-500 dark:text-slate-400">{t.recruiterNoApplicants}</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((app) => (
        <div
          key={app.id}
          className="flex flex-col gap-2 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/60 dark:bg-slate-900/50 p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
                <Users className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {t.recruiterCandidateLabel} · {app.candidate_id.slice(0, 8)}
                </p>
                <p className="text-[11px] text-slate-400">
                  {t.appliedOn} {new Date(app.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Badge variant="indigo" className="shrink-0 text-[11px]">
              {statusLabels[app.status as ApplicationStatus] ?? app.status}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mr-1">
              {t.recruiterAdvanceLabel}
            </span>
            {RECRUITER_STATUSES.filter((status) => status !== app.status).map((status) => (
              <button
                key={status}
                type="button"
                disabled={transition.isPending}
                onClick={() =>
                  transition.mutate({applicationId: app.id, status})
                }
                className="rounded-lg border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-50 cursor-pointer dark:border-slate-800 dark:text-slate-300 dark:hover:text-indigo-300"
              >
                {statusLabels[status]}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Create-offer form + the company's offers, with publish/close/applicants. */
function OffersPanel({ companyId }: { companyId: string }) {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useCompanyOffers(companyId);
  const createOffer = useCreateOffer(companyId);
  const publishOffer = usePublishOffer(companyId);
  const closeOffer = useCloseOffer(companyId);
  const [openOfferId, setOpenOfferId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error2, setError2] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category_id: '',
    modality: 'remote',
    employment_type: 'full_time',
    location: '',
    salary_min: '',
    salary_max: '',
    salary_currency: 'USD',
  });

  const offers = data?.items ?? [];
  const employmentLabels: Record<string, string> = {
    full_time: t.employmentFullTime,
    part_time: t.employmentPartTime,
    contract: t.employmentContract,
    temporary: t.employmentTemporary,
    internship: t.employmentInternship,
  };

  const handleCreate = async () => {
    setError2(null);
    if (!form.title.trim() || !form.description.trim() || !isUuid(form.category_id.trim())) {
      setError2(t.recruiterOfferRequired);
      return;
    }
    try {
      await createOffer.mutateAsync({
        company_id: companyId,
        category_id: form.category_id.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        modality: form.modality,
        employment_type: form.employment_type,
        location: form.location.trim() || null,
        salary_min_cents: form.salary_min ? Number(form.salary_min) * 100 : null,
        salary_max_cents: form.salary_max ? Number(form.salary_max) * 100 : null,
        salary_currency: form.salary_currency.trim() || null,
      });
      setShowForm(false);
      setForm({...form, title: '', description: '', category_id: ''});
    } catch (err) {
      setError2(err instanceof Error ? err.message : t.commonErrorTitle);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xs">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-indigo-500" />
          {t.recruiterOffersTitle}
        </h3>
        <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-3.5 w-3.5" />
          {t.recruiterNewOfferBtn}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-slate-200/70 dark:border-slate-800/70 p-4 space-y-3 bg-slate-50/60 dark:bg-slate-900/50">
          {error2 && (
            <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error2}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {t.recruiterOfferTitle} *
              </label>
              <Input
                value={form.title}
                onChange={(e) => setForm({...form, title: e.target.value})}
                maxLength={200}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {t.recruiterOfferCategoryId} *
              </label>
              <Input
                value={form.category_id}
                onChange={(e) => setForm({...form, category_id: e.target.value})}
                placeholder="00000000-0000-0000-0000-000000000000"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {t.recruiterOfferLocation}
              </label>
              <Input
                value={form.location}
                onChange={(e) => setForm({...form, location: e.target.value})}
                maxLength={150}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {t.recruiterOfferModality}
              </label>
              <select
                value={form.modality}
                onChange={(e) => setForm({...form, modality: e.target.value})}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              >
                {MODALITIES.map((m) => (
                  <option key={m} value={m}>
                    {m === 'remote'
                      ? t.workplaceRemote
                      : m === 'hybrid'
                        ? t.workplaceHybrid
                        : t.workplaceOnsite}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {t.recruiterOfferEmploymentType}
              </label>
              <select
                value={form.employment_type}
                onChange={(e) => setForm({...form, employment_type: e.target.value})}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              >
                {EMPLOYMENT_TYPES.map((e) => (
                  <option key={e} value={e}>
                    {employmentLabels[e]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {t.recruiterOfferSalaryMin}
              </label>
              <Input
                type="number"
                min={0}
                value={form.salary_min}
                onChange={(e) => setForm({...form, salary_min: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {t.recruiterOfferSalaryMax}
              </label>
              <Input
                type="number"
                min={0}
                value={form.salary_max}
                onChange={(e) => setForm({...form, salary_max: e.target.value})}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {t.recruiterOfferDescription} *
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({...form, description: e.target.value})}
                rows={4}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 resize-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
          <Button
            onClick={handleCreate}
            disabled={createOffer.isPending}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {createOffer.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {t.recruiterCreateOfferBtn}
          </Button>
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-20 w-full rounded-xl" />
      ) : error ? (
        <ErrorBlock message={error.message} onRetry={() => refetch()} />
      ) : offers.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{t.recruiterNoOffers}</p>
      ) : (
        <div className="space-y-2">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-3 space-y-2"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {offer.title}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {offer.company_name ?? '—'} · {offer.status}
                    {offer.modality ? ` · ${offer.modality}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {offer.status === 'draft' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={publishOffer.isPending}
                      onClick={() => publishOffer.mutate(offer.id)}
                    >
                      <Send className="h-3.5 w-3.5" />
                      {t.recruiterPublishBtn}
                    </Button>
                  )}
                  {offer.status === 'published' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={closeOffer.isPending}
                      onClick={() => closeOffer.mutate(offer.id)}
                    >
                      {t.recruiterCloseBtn}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setOpenOfferId((current) => (current === offer.id ? null : offer.id))
                    }
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                    {t.recruiterViewApplicantsBtn}
                  </Button>
                </div>
              </div>
              {openOfferId === offer.id && <OfferApplicants offerId={offer.id} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Company metrics (stages 4/5): vacancies, funnel, time-to-hire, demand, benchmark. */
function CompanyMetrics() {
  const { t } = useTranslation();
  const { vacancies, funnel, timeToHire, timeInStage, salaryBenchmark, offerDemand } =
    useCompanyMetrics(true);

  const isLoading =
    vacancies.isLoading || funnel.isLoading || timeToHire.isLoading ||
    timeInStage.isLoading || salaryBenchmark.isLoading || offerDemand.isLoading;
  const isError =
    vacancies.isError && funnel.isError && timeToHire.isError &&
    timeInStage.isError && salaryBenchmark.isError && offerDemand.isError;

  if (isError) {
    return (
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
          {t.recruiterMetricsTitle}
        </h3>
        <ErrorBlock />
      </div>
    );
  }

  const tth = timeToHire.data;

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xs">
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-indigo-500" />
        {t.recruiterMetricsTitle}
      </h3>

      {isLoading ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : (
        <>
          {/* Vacancies by status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(vacancies.data ?? []).map((row) => (
              <div
                key={row.status}
                className="rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/60 dark:bg-slate-900/50 p-3"
              >
                <span className="text-[11px] text-slate-400 block capitalize">{row.status}</span>
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {row.count}
                </span>
              </div>
            ))}
          </div>

          {/* Time to hire */}
          <div className="flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-300">
            <span>
              {t.recruiterTimeToHire}:{' '}
              <strong className="font-mono">
                {tth?.avg_days != null ? `${tth.avg_days.toFixed(1)} d` : '—'}
              </strong>
            </span>
            <span>
              {t.recruiterMedianDays}:{' '}
              <strong className="font-mono">
                {tth?.median_days != null ? `${tth.median_days.toFixed(1)} d` : '—'}
              </strong>
            </span>
            <span>
              {t.recruiterHires}: <strong className="font-mono">{tth?.hires ?? 0}</strong>
            </span>
          </div>

          {/* Funnel */}
          {(funnel.data ?? []).length > 0 && (
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t.recruiterFunnel}
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {(funnel.data ?? []).map((row) => (
                  <div key={row.stage} className="flex items-center justify-between py-1.5">
                    <span className="capitalize text-slate-700 dark:text-slate-300">
                      {row.stage}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {row.entered} →{' '}
                      {row.conversion_rate != null
                        ? `${(row.conversion_rate * 100).toFixed(0)}%`
                        : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Offer demand ratio (S-18) */}
          {(offerDemand.data ?? []).length > 0 && (
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t.recruiterOfferDemand}
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {(offerDemand.data ?? []).map((row) => (
                  <div key={row.job_offer_id} className="flex items-center justify-between py-1.5">
                    <span className="truncate text-slate-700 dark:text-slate-300">{row.title}</span>
                    <span className="text-slate-500 dark:text-slate-400 font-mono">
                      {row.unique_applicants} / {row.ratio.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Salary benchmark */}
          {(salaryBenchmark.data ?? []).length > 0 && (
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t.recruiterSalaryBenchmark}
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {(salaryBenchmark.data ?? []).map((row) => (
                  <div key={row.job_offer_id} className="flex items-center justify-between py-1.5">
                    <span className="truncate text-slate-700 dark:text-slate-300">{row.title}</span>
                    <span
                      className={
                        row.delta_pct >= 0
                          ? 'text-emerald-600 dark:text-emerald-400 font-mono'
                          : 'text-rose-600 dark:text-rose-400 font-mono'
                      }
                    >
                      {row.delta_pct >= 0 ? '+' : ''}
                      {row.delta_pct.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Time in stage */}
          {(timeInStage.data ?? []).length > 0 && (
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t.recruiterTimeInStage}
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {(timeInStage.data ?? []).map((row) => (
                  <div key={row.stage} className="flex items-center justify-between py-1.5">
                    <span className="capitalize text-slate-700 dark:text-slate-300">
                      {row.stage}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-mono">
                      {row.avg_days != null ? `${row.avg_days.toFixed(1)} d` : '—'} ({row.samples})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Recruiter board (F7): company context, offers, applicants (funnel advance via
 * backend S-09) and company analytics (S-18 among them).
 */
export function RecruiterView() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const companyId = useRecruiterCompanyId();
  const setRecruiterCompanyId = useSetRecruiterCompanyId();
  const company = useCompany(companyId);
  const members = useCompanyMembers(companyId);

  const canManage = useMemo(
    () => Boolean(user?.roles.some((role) => role === 'recruiter' || role === 'admin')),
    [user]
  );

  if (!canManage) {
    return (
      <div className="h-full overflow-y-auto p-6 max-w-3xl mx-auto">
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-10 text-center space-y-2">
          <Building2 className="mx-auto h-7 w-7 text-slate-400" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {t.recruiterNeedRoleTitle}
          </p>
          <p className="text-xs text-slate-500">{t.recruiterNeedRoleSub}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {t.recruiterTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.recruiterSub}
          </p>
        </div>
        {companyId && (
          <div className="flex items-center gap-2">
            <Badge variant="indigo" className="gap-1">
              <Building2 className="h-3 w-3" />
              {company.data?.name ?? t.recruiterCompanyLoading}
            </Badge>
            <Button size="sm" variant="outline" onClick={() => setRecruiterCompanyId(null)}>
              {t.recruiterSwitchCompanyBtn}
            </Button>
          </div>
        )}
      </div>

      {!companyId ? (
        <CompanySetup />
      ) : (
        <>
          {members.data && (
            <p className="text-[11px] text-slate-400">
              {t.recruiterMembersLabel}: {members.data.length}
            </p>
          )}
          <OffersPanel companyId={companyId} />
          <CompanyMetrics />
        </>
      )}
    </div>
  );
}
