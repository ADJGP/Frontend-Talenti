// DTOs mirroring the Talenti backend responses (BD_Bolsa_Trabajo).
//
// Source of truth (verified 2026-10-12 against the closed stages):
//   - src/api/v1/deps.py                    → auth (stage 1)
//   - src/api/v1/job_offers.py              → offers + facets (stage 2)
//   - src/services/job_offers.py            → JobOffersFacets
//   - src/api/v1/profiles.py                → profiles + skills (stage 2)
//   - src/api/v1/skills.py                  → skill catalog (stage 2)
//   - src/api/v1/applications.py            → applications (stage 2)
//   - src/application/applications/dto.py   → ApplicationRead/Summary
//   - src/api/v1/geography.py               → geography (stage 4)
//   - src/api/v1/analytics.py + dto.py      → analytics (stages 4/5)
//
// Nothing here may be invented: every field is copied from the backend schema.

// --------------------------------------------------------------------------- //
// Auth (stage 1)
// --------------------------------------------------------------------------- //

export interface TokenPairDto {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface RevokeDto {
  status: string;
  jti: string;
  token_type: string | null;
}

/** Claims the backend embeds in the access token (src/services/auth/token_service.py). */
export interface AccessTokenClaims {
  sub: string;
  email: string;
  aud: string;
  exp: string;
  jti: string;
  token_type: string;
}

/**
 * `GET /api/v1/auth/me` — current user + role slugs (added by the backend, S-03).
 *
 * The frontend uses it to drive role-based navigation instead of decoding the
 * JWT (`CurrentUserMeResponse` in `src/api/v1/deps.py`, no secrets).
 */
export interface CurrentUserMeDto {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  roles: string[]; // e.g. ["candidate" | "recruiter" | "admin"]
}

// --------------------------------------------------------------------------- //
// Job offers (stage 2)
// --------------------------------------------------------------------------- //

export interface JobOfferSummaryDto {
  id: string;
  company_id: string;
  company_name: string | null;
  category_id: string;
  category_name: string | null;
  title: string;
  status: string; // draft | published | closed
  // S-02 applied by the backend (2026-10-12): the listing summary now carries
  // modality/employment_type, so the cards no longer need the detail (no N+1).
  modality: string | null; // remote | hybrid | onsite
  employment_type: string | null; // full_time | part_time | contract | temporary | internship
  location: string | null;
  salary_min_cents: number | null;
  salary_max_cents: number | null;
  salary_currency: string | null;
  published_at: string | null; // ISO timestamp
}

export interface JobOfferDetailDto extends JobOfferSummaryDto {
  description: string;
  city_id: string | null;
  closes_at: string | null;
}

/** `POST /job-offers` payload (member of the offer's company only). */
export interface JobOfferCreateDto {
  company_id: string;
  category_id: string;
  title: string;
  description: string;
  modality?: string | null;
  employment_type?: string | null;
  location?: string | null;
  city_id?: string | null;
  salary_min_cents?: number | null;
  salary_max_cents?: number | null;
  salary_currency?: string | null;
}

export interface CategoryFacetRowDto {
  id: string;
  name: string | null;
  count: number;
}

export interface EnumFacetRowDto {
  value: string;
  count: number;
}

export interface SalaryRangeFacetRowDto {
  range: string;
  count: number;
}

export interface JobOffersFacetsDto {
  categories: CategoryFacetRowDto[];
  work_modes: EnumFacetRowDto[];
  employment_types: EnumFacetRowDto[];
  salary_ranges: SalaryRangeFacetRowDto[];
}

export interface JobOfferPageDto {
  items: JobOfferSummaryDto[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  facets: JobOffersFacetsDto;
}

/** Query params accepted by `GET /job-offers` (verified against the router). */
export interface JobOffersQuery {
  page?: number;
  page_size?: number;
  category_id?: string;
  company_id?: string;
  search_term?: string;
  employment_type?: string;
  work_mode?: string;
  min_salary?: number;
  max_salary?: number;
  sort?: 'date' | 'relevance';
}

// --------------------------------------------------------------------------- //
// Profiles + skills (stage 2)
// --------------------------------------------------------------------------- //

export interface ProfileDto {
  id: string;
  user_id: string;
  headline: string | null;
  bio: string | null;
  phone: string | null;
  location: string | null;
  city_id: string | null;
  resume_url: string | null;
  is_open_to_work: boolean;
  experience_years: number;
  created_at: string;
}

export interface ProfileCreateDto {
  headline: string;
  bio?: string | null;
  phone?: string | null;
  location?: string | null;
  city_id?: string | null;
  resume_url?: string | null;
  is_open_to_work?: boolean;
  experience_years?: number;
}

export interface ProfileUpdateDto {
  headline?: string;
  bio?: string | null;
  phone?: string | null;
  location?: string | null;
  city_id?: string | null;
  resume_url?: string | null;
  is_open_to_work?: boolean;
  experience_years?: number;
}

export interface SkillDto {
  skill_id: string;
  slug: string;
  name: string;
}

// --------------------------------------------------------------------------- //
// Applications (stage 2)
// --------------------------------------------------------------------------- //

export interface ApplicationDto {
  id: string;
  job_offer_id: string;
  candidate_id: string;
  status: string;
  cover_letter: string | null;
  noted_by_recruiter: string | null;
  created_at: string;
}

export interface ApplicationSummaryDto {
  id: string;
  job_offer_id: string;
  // S-04 fields. NOTE (verified 2026-10-13): the backend declares them but
  // `ApplicationsPage.from_rows` still calls `from_model(row)` without the job
  // context, so `GET /applications` returns them as `null` today. The UI must
  // treat them as optional and fall back (see ApplicationsView).
  job_offer_title: string | null;
  company_id: string | null;
  company_name: string | null;
  candidate_id: string;
  status: string;
  created_at: string;
}

/** `PATCH /applications/{id}/status` payload (S-09: company members may advance). */
export interface ApplicationStatusUpdateDto {
  new_status: string;
}

export interface ApplicationsPageDto {
  items: ApplicationSummaryDto[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// --------------------------------------------------------------------------- //
// Geography (stage 4)
// --------------------------------------------------------------------------- //

export interface CountryDto {
  id: string;
  name: string;
  iso_code: string | null;
}

export interface StateDto {
  id: string;
  country_id: string;
  name: string;
  code: string | null;
}

export interface CityDto {
  id: string;
  state_id: string;
  name: string;
}

// --------------------------------------------------------------------------- //
// Analytics (stages 4/5)
// --------------------------------------------------------------------------- //

export interface SalaryPercentileDto {
  percentile: number;
  salary_min_cents: number | null;
  salary_max_cents: number | null;
}

export interface SalaryRadarGroupDto {
  salary_currency: string;
  matched_offers: number;
  percentiles: SalaryPercentileDto[];
}

export interface SkillGapItemDto {
  skill_id: string;
  slug: string;
  name: string;
  offers: number;
}

export interface PersonalResponseRateDto {
  applications: number;
  responses: number;
  response_rate: number | null;
  window_days: number | null;
}

// --------------------------------------------------------------------------- //
// Companies (stage 2) — recruiter surface (F7)
// --------------------------------------------------------------------------- //

export interface CompanyDto {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
  description: string | null;
  industry: string | null;
  website_url: string | null;
  logo_url: string | null;
  location: string | null;
  city_id: string | null;
}

/** `POST /companies` payload (slug `^[a-z0-9]+(_[a-z0-9]+)*$`). */
export interface CompanyCreateDto {
  name: string;
  slug: string;
  description?: string | null;
  industry?: string | null;
  website_url?: string | null;
  logo_url?: string | null;
  location?: string | null;
  city_id?: string | null;
}

export interface CompanyMemberDto {
  id: string;
  company_id: string;
  user_id: string;
  is_owner: boolean;
  created_at: string;
}

/** `POST /companies/{id}/members` payload (owner only). */
export interface CompanyMemberCreateDto {
  user_id: string;
  is_owner?: boolean;
}

// --------------------------------------------------------------------------- //
// Company analytics (stages 4/5) — recruiter surface (F7)
// --------------------------------------------------------------------------- //

export interface TimeToHireDto {
  hires: number;
  avg_days: number | null;
  median_days: number | null;
  window_days: number | null;
}

export interface StageConversionDto {
  stage: string;
  entered: number;
  converted_to_next: number | null;
  conversion_rate: number | null;
}

export interface TimeInStageDto {
  stage: string;
  samples: number;
  avg_days: number | null;
}

export interface VacancyStatusDto {
  status: string;
  count: number;
}

export interface SalaryBenchmarkRowDto {
  job_offer_id: string;
  title: string;
  salary_currency: string;
  offer_midpoint_cents: number;
  market_midpoint_cents: number;
  market_offers: number;
  delta_pct: number;
}

export interface OfferDemandRatioDto {
  job_offer_id: string;
  title: string;
  unique_applicants: number;
  published_days: number;
  ratio: number;
}
