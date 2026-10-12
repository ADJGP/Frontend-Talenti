// Self-service analytics (backend stages 4/5 — closed).
//
// These three metrics take the caller identity from the token, so they need no
// RBAC role and answer with `[]` / null when there is no data yet:
//   - GET /analytics/salary-radar
//   - GET /analytics/skill-gap?top_offers=1..50
//   - GET /analytics/response-rate?days=1..3650

import { apiFetch, buildQuery } from './api';
import type {
  PersonalResponseRateDto,
  SalaryRadarGroupDto,
  SkillGapItemDto,
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
};
