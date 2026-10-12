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
  location: string | null;
  salary_min_cents: number | null;
  salary_max_cents: number | null;
  salary_currency: string | null;
  published_at: string | null; // ISO timestamp
}

export interface JobOfferDetailDto extends JobOfferSummaryDto {
  description: string;
  modality: string | null; // remote | hybrid | onsite
  employment_type: string | null; // full_time | part_time | contract | temporary | internship
  city_id: string | null;
  closes_at: string | null;
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
  candidate_id: string;
  status: string;
  created_at: string;
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
