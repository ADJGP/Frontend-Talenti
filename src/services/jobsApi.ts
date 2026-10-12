// Job offers API (backend stage 2 — closed).
//
// Real endpoints only: `GET /job-offers` (paginated + facets) and
// `GET /job-offers/{id}`. The previous local mock dataset was removed so the
// UI never shows invented data.

import { apiFetch, buildQuery } from './api';
import type { JobFilters } from '../types';
import type { JobOfferDetailDto, JobOfferPageDto, JobOffersQuery } from './talentiTypes';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** UI workplace label → backend `work_mode` enum value. */
const WORK_MODE_VALUE: Record<string, string> = {
  Remote: 'remote',
  Hybrid: 'hybrid',
  'On-site': 'onsite',
};

/**
 * Translate the UI filters into the query the backend actually accepts.
 *
 * Only capabilities that exist today are sent (verified against
 * `src/api/v1/job_offers.py`). Sorting by salary/match has no server support
 * yet (sugerencias.md S-06), so those fall back to `date`.
 */
export function filtersToQuery(
  filters: JobFilters,
  page: number,
  pageSize: number = DEFAULT_PAGE_SIZE
): JobOffersQuery {
  const search = filters.search.trim();
  const sort: JobOffersQuery['sort'] =
    filters.sortBy === 'match' && search ? 'relevance' : 'date';

  return {
    page,
    page_size: pageSize,
    search_term: search || undefined,
    category_id: filters.categoryId ?? undefined,
    work_mode:
      filters.workplaceType !== 'All' ? WORK_MODE_VALUE[filters.workplaceType] : undefined,
    // Backend salaries are integer cents.
    min_salary: filters.minSalary > 0 ? filters.minSalary * 100 : undefined,
    sort,
  };
}

export const jobsApi = {
  /** `GET /job-offers` — public listing; a bearer token adds the corporate view. */
  async listOffers(query: JobOffersQuery): Promise<JobOfferPageDto> {
    return apiFetch<JobOfferPageDto>(`/job-offers${buildQuery(query)}`);
  },

  /** `GET /job-offers/{id}` — published offers are public, others 404. */
  async getOffer(offerId: string): Promise<JobOfferDetailDto> {
    return apiFetch<JobOfferDetailDto>(`/job-offers/${offerId}`);
  },
};
