// Adapter: Talenti backend DTOs → the rich `Job` model the UI renders.
//
// The backend listing (JobOfferSummary) carries a subset of what the previous
// mock dataset offered. Fields the API cannot provide yet (match score, skills,
// hiring manager…) are left undefined instead of being faked, and the UI hides
// those blocks when they are missing (see sugerencias.md S-05/S-08).
//
// S-02 (modality/employment_type in the summary) was applied by the backend on
// 2026-10-12, so those two chips are now mapped from the listing itself.

import type { EmploymentType, Job } from '../types';
import type { JobOfferDetailDto, JobOfferSummaryDto } from './talentiTypes';

type JobWorkplace = NonNullable<Job['workplaceType']>;

const WORK_MODALITY_MAP: Record<string, JobWorkplace> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site',
};

const EMPLOYMENT_TYPE_MAP: Record<string, EmploymentType> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  temporary: 'Contract',
  internship: 'Part-time',
};

// --------------------------------------------------------------------------- //
// Presentation helpers
// --------------------------------------------------------------------------- //

const LOGO_BACKGROUNDS = [
  'bg-indigo-600',
  'bg-emerald-600',
  'bg-sky-600',
  'bg-rose-600',
  'bg-amber-600',
  'bg-violet-600',
  'bg-teal-600',
  'bg-fuchsia-600',
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Deterministic logo background so the same company always looks the same. */
export function logoBackgroundFor(seed: string): string {
  return LOGO_BACKGROUNDS[hashString(seed) % LOGO_BACKGROUNDS.length];
}

export function initialsFor(name: string): string {
  const words = name
    .split(/[\s_-]+/)
    .filter(Boolean)
    .slice(0, 2);
  if (!words.length) return '?';
  return words.map((word) => word[0]!.toUpperCase()).join('');
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Backend salaries are integer cents; the UI works in whole units. */
function centsToUnits(cents: number | null | undefined): number {
  return typeof cents === 'number' ? Math.round(cents / 100) : 0;
}

const RELATIVE_UNITS: Array<[number, Intl.RelativeTimeFormatUnit]> = [
  [60, 'second'],
  [3600, 'minute'],
  [86400, 'hour'],
  [604800, 'day'],
  [2592000, 'week'],
  [31536000, 'month'],
];

/** "hace 3 días" / "3 days ago" label + epoch ms for the sorting logic. */
export function relativePostedInfo(iso: string | null | undefined): {
  label: string;
  timestamp: number;
} {
  if (!iso) return {label: '', timestamp: 0};
  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) return {label: '', timestamp: 0};

  // Elapsed seconds since publication (positive → past).
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  const rtf = new Intl.RelativeTimeFormat(undefined, {numeric: 'auto'});

  let previous = 0;
  for (const [limit, unit] of RELATIVE_UNITS) {
    if (seconds < limit) {
      const divisor = unit === 'second' ? 1 : previous || 1;
      return {label: rtf.format(-Math.floor(seconds / divisor), unit), timestamp};
    }
    previous = limit;
  }
  return {label: rtf.format(-Math.floor(seconds / 31536000), 'year'), timestamp};
}

function firstParagraph(value: string): string {
  const paragraph = value.split(/\n\s*\n/)[0] ?? '';
  return paragraph.trim();
}

// --------------------------------------------------------------------------- //
// Adapters
// --------------------------------------------------------------------------- //

const UNKNOWN_COMPANY = '—';

/** Shared mapping (the listing summary and the detail overlap on these). */
function baseFields(
  dto: JobOfferSummaryDto,
  description: string,
  tagline: string
): Job {
  const company = dto.company_name?.trim() || UNKNOWN_COMPANY;
  const {label, timestamp} = relativePostedInfo(dto.published_at);

  return {
    id: dto.id,
    title: dto.title,
    company,
    companyId: dto.company_id,
    companySlug: slugify(company === UNKNOWN_COMPANY ? dto.title : company),
    companyLogoBg: logoBackgroundFor(company === UNKNOWN_COMPANY ? dto.title : company),
    companyLogoText: initialsFor(company === UNKNOWN_COMPANY ? dto.title : company),
    categoryId: dto.category_id ?? null,
    categoryName: dto.category_name ?? null,
    location: dto.location?.trim() || '—',
    salaryMin: centsToUnits(dto.salary_min_cents),
    salaryMax: centsToUnits(dto.salary_max_cents),
    salaryCurrency: dto.salary_currency ?? 'USD',
    status: dto.status,
    postedAt: label,
    postedTimestamp: timestamp,
    publishedAt: dto.published_at,
    description,
    tagline,
  };
}

/** GET /job-offers item → compact card model (no description body). */
export function summaryToJob(dto: JobOfferSummaryDto): Job {
  return {
    ...baseFields(dto, '', dto.category_name ?? ''),
    // S-02 applied by the backend (2026-10-12): the summary now carries both
    // fields, so the card renders the modality/employment chips directly.
    workplaceType: dto.modality ? WORK_MODALITY_MAP[dto.modality] : undefined,
    employmentType: dto.employment_type
      ? EMPLOYMENT_TYPE_MAP[dto.employment_type]
      : undefined,
  };
}

/** GET /job-offers/{id} → full detail model. */
export function detailToJob(dto: JobOfferDetailDto): Job {
  const description = dto.description?.trim() ?? '';
  return {
    ...baseFields(dto, description, firstParagraph(description)),
    workplaceType: dto.modality ? WORK_MODALITY_MAP[dto.modality] : undefined,
    employmentType: dto.employment_type
      ? EMPLOYMENT_TYPE_MAP[dto.employment_type]
      : undefined,
    cityId: dto.city_id,
    closesAt: dto.closes_at,
  };
}

/** Merge a loaded detail over its list summary (the detail wins). */
export function mergeJobs(summary: Job, detail: Job | null | undefined): Job {
  if (!detail) return summary;
  return {...summary, ...detail};
}
