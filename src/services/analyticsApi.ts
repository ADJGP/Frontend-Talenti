// Self-service analytics (backend stages 4/5 — closed).
//
// These three metrics take the caller identity from the token, so they need no
// RBAC role and answer with `[]` / null when there is no data yet:
//   - GET /analytics/salary-radar
//   - GET /analytics/skill-gap?top_offers=1..50
//   - GET /analytics/response-rate?days=1..3650

import { apiFetch, buildQuery } from './api';
import type {
  OfferDemandRatioDto,
  PersonalResponseRateDto,
  SalaryBenchmarkRowDto,
  SalaryRadarGroupDto,
  SkillGapItemDto,
  StageConversionDto,
  TimeInStageDto,
  TimeToHireDto,
  VacancyStatusDto,
} from './talentiTypes';

export const analyticsApi = {
  /** p25/p50/p75/p90 per currency for the offers matching my profile. */
  async salaryRadar(): Promise<SalaryRadarGroupDto[]> {
    return apiFetch<SalaryRadarGroupDto[]>('/analytics/salary-radar');
  },

  /** Skills the top matching offers require and I have not declared. */
  async skillGap(topOffers?: number): Promise<SkillGapItemDto[]> {
    return apiFetch<SkillGapItemDto[]>(
      `/analytics/skill-gap${buildQuery({top_offers: topOffers})}`
    );
  },

  /** Share of my applications that got an answer. */
  async responseRate(days?: number): Promise<PersonalResponseRateDto> {
    return apiFetch<PersonalResponseRateDto>(
      `/analytics/response-rate${buildQuery({days})}`
    );
  },

  // --- Company metrics (recruiter/company or admin) — F7 --------------------

  /** `GET /analytics/time-to-hire?days=` — average + median days submitted→hired. */
  async companyTimeToHire(days?: number): Promise<TimeToHireDto> {
    return apiFetch<TimeToHireDto>(`/analytics/time-to-hire${buildQuery({days})}`);
  },

  /** `GET /analytics/funnel?days=` — entries + stage-to-stage conversion. */
  async companyFunnel(days?: number): Promise<StageConversionDto[]> {
    return apiFetch<StageConversionDto[]>(`/analytics/funnel${buildQuery({days})}`);
  },

  /** `GET /analytics/time-in-stage?days=` — average dwell time per stage. */
  async companyTimeInStage(days?: number): Promise<TimeInStageDto[]> {
    return apiFetch<TimeInStageDto[]>(`/analytics/time-in-stage${buildQuery({days})}`);
  },

  /** `GET /analytics/vacancies?days=` — offer counts per status. */
  async companyVacancies(days?: number): Promise<VacancyStatusDto[]> {
    return apiFetch<VacancyStatusDto[]>(`/analytics/vacancies${buildQuery({days})}`);
  },

  /** `GET /analytics/salary-benchmark` — competitive delta per published offer. */
  async companySalaryBenchmark(): Promise<SalaryBenchmarkRowDto[]> {
    return apiFetch<SalaryBenchmarkRowDto[]>('/analytics/salary-benchmark');
  },

  /** `GET /analytics/offer-demand-ratio?days=` — unique applicants per published day. */
  async companyOfferDemandRatio(days?: number): Promise<OfferDemandRatioDto[]> {
    return apiFetch<OfferDemandRatioDto[]>(
      `/analytics/offer-demand-ratio${buildQuery({days})}`
    );
  },
};
