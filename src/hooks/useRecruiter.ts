// Recruiter surface hooks (F7) — company, offers, applicants and company metrics.
//
// Consumes the endpoints unlocked by the backend's applied suggestions:
//   - S-09: company members may advance an application's status.
//   - S-18: `GET /analytics/offer-demand-ratio` no longer 500s.
//
// The company id is kept in the UI store (localStorage) because the backend has
// no "my companies" endpoint; a recruiter creates one or pastes a known UUID.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '../services/analyticsApi';
import { applicationsApi } from '../services/applicationsApi';
import { companiesApi } from '../services/companiesApi';
import { jobsApi } from '../services/jobsApi';
import { useJobStore } from '../store/useJobStore';
import type {
  CompanyCreateDto,
  JobOfferCreateDto,
} from '../services/talentiTypes';
import type { ApplicationStatus } from '../types';

/** Statuses a recruiter may move an application to (the candidate keeps `withdrawn`). */
export const RECRUITER_STATUSES: ApplicationStatus[] = [
  'in_review',
  'interviewing',
  'offered',
  'hired',
  'rejected',
];

/** The acting recruiter's company id (persisted locally; see module note). */
export function useRecruiterCompanyId(): string | null {
  return useJobStore((state) => state.recruiterCompanyId);
}

export function useSetRecruiterCompanyId() {
  return useJobStore((state) => state.setRecruiterCompanyId);
}

/** `GET /companies/{id}` — the selected company's public profile. */
export function useCompany(companyId: string | null) {
  return useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companiesApi.get(companyId as string),
    enabled: Boolean(companyId),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

/** `POST /companies` — create a company (the caller becomes its owner). */
export function useCreateCompany() {
  const setRecruiterCompanyId = useSetRecruiterCompanyId();
  return useMutation({
    mutationFn: (payload: CompanyCreateDto) => companiesApi.create(payload),
    onSuccess: (company) => setRecruiterCompanyId(company.id),
  });
}

/** `GET /companies/{id}/members` — the roster (member only). */
export function useCompanyMembers(companyId: string | null) {
  return useQuery({
    queryKey: ['company', companyId, 'members'],
    queryFn: () => companiesApi.members(companyId as string),
    enabled: Boolean(companyId),
    staleTime: 1000 * 60 * 5,
  });
}

/** `GET /job-offers?company_id=` — the company's offers (drafts included for members). */
export function useCompanyOffers(companyId: string | null) {
  return useQuery({
    queryKey: ['company', companyId, 'offers'],
    queryFn: () => jobsApi.listCompanyOffers(companyId as string),
    enabled: Boolean(companyId),
    staleTime: 1000 * 30,
  });
}

export function useCreateOffer(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: JobOfferCreateDto) => jobsApi.createOffer(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: ['company', companyId, 'offers']}),
  });
}

export function usePublishOffer(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (offerId: string) => jobsApi.publishOffer(offerId),
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: ['company', companyId, 'offers']}),
  });
}

export function useCloseOffer(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (offerId: string) => jobsApi.closeOffer(offerId),
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: ['company', companyId, 'offers']}),
  });
}

/** `GET /applications?job_offer_id=` — one offer's applicants (member only). */
export function useOfferApplications(offerId: string | null) {
  return useQuery({
    queryKey: ['offer', offerId, 'applications'],
    queryFn: () => applicationsApi.listForOffer(offerId as string),
    enabled: Boolean(offerId),
    staleTime: 1000 * 20,
  });
}

/** `PATCH /applications/{id}/status` — advance the funnels (S-09). */
export function useTransitionApplication(offerId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      applicationId,
      status,
    }: {
      applicationId: string;
      status: ApplicationStatus;
    }) => applicationsApi.transitionStatus(applicationId, status),
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: ['offer', offerId, 'applications']}),
  });
}

/** Company metrics (stages 4/5) — scope is derived server-side from the caller. */
export function useCompanyMetrics(enabled: boolean) {
  const vacancies = useQuery({
    queryKey: ['company-metrics', 'vacancies'],
    queryFn: () => analyticsApi.companyVacancies(),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
  const funnel = useQuery({
    queryKey: ['company-metrics', 'funnel'],
    queryFn: () => analyticsApi.companyFunnel(),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
  const timeToHire = useQuery({
    queryKey: ['company-metrics', 'time-to-hire'],
    queryFn: () => analyticsApi.companyTimeToHire(),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
  const timeInStage = useQuery({
    queryKey: ['company-metrics', 'time-in-stage'],
    queryFn: () => analyticsApi.companyTimeInStage(),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
  const salaryBenchmark = useQuery({
    queryKey: ['company-metrics', 'salary-benchmark'],
    queryFn: () => analyticsApi.companySalaryBenchmark(),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
  // S-18: this metric used to answer 500 (`max(a,b)`); now returns real rows.
  const offerDemand = useQuery({
    queryKey: ['company-metrics', 'offer-demand-ratio'],
    queryFn: () => analyticsApi.companyOfferDemandRatio(),
    enabled,
    staleTime: 1000 * 60 * 5,
  });

  return { vacancies, funnel, timeToHire, timeInStage, salaryBenchmark, offerDemand };
}
