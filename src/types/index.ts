// UI-facing domain model.
//
// Fields the current backend contract cannot provide yet are **optional** and
// the UI hides their blocks when absent (never faked). See docs/PLAN_TRABAJO.md
// §2 (principle 2) and sugerencias.md for the backend gaps behind them.

export type WorkplaceType = 'All' | 'Remote' | 'Hybrid' | 'On-site';
export type EmploymentType = 'Full-time' | 'Contract' | 'Part-time';
export type SortOption = 'match' | 'recent' | 'salary-high' | 'salary-low';

/** Application lifecycle, matching the backend `ApplicationStatus` enum. */
export type ApplicationStatus =
  | 'submitted'
  | 'in_review'
  | 'interviewing'
  | 'offered'
  | 'hired'
  | 'rejected'
  | 'withdrawn';

export interface HiringManager {
  name: string;
  role: string;
  avatar: string;
  linkedIn?: string;
  responseRate?: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  companyId: string;
  companySlug: string;
  companyLogoBg: string;
  companyLogoText: string;
  categoryId: string | null;
  categoryName: string | null;
  location: string;
  workplaceType?: 'Remote' | 'Hybrid' | 'On-site';
  employmentType?: EmploymentType;
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  status: string;
  postedAt: string;
  postedTimestamp: number;
  publishedAt: string | null;
  closesAt?: string | null;
  cityId?: string | null;
  description: string;
  tagline: string;

  // --- Not provided by the current backend contract (hidden when absent) ---
  matchScore?: number;
  matchBreakdown?: {
    skillsMatch: number;
    experienceMatch: number;
    salaryFit: number;
  };
  matchHighlights?: string[];
  experienceLevel?: string;
  department?: string;
  featured?: boolean;
  urgentlyHiring?: boolean;
  responsibilities?: string[];
  requirements?: string[];
  niceToHave?: string[];
  benefits?: string[];
  skills?: string[];
  techStack?: string[];
  hiringManager?: HiringManager;
  applicantsCount?: number;
  companyWebsite?: string;
  companySize?: string;
  headquarters?: string;
}

export interface JobFilters {
  search: string;
  categoryId: string | null;
  workplaceType: WorkplaceType;
  minSalary: number;
  sortBy: SortOption;
  onlySaved: boolean;
  onlyApplied: boolean;
}

export interface ApplicationRecord {
  applicationId: string;
  jobOfferId: string;
  status: ApplicationStatus;
  createdAt: string;
  coverLetter: string | null;
}

/** Role slugs returned by `GET /api/v1/auth/me` (backend S-03). */
export type UserRole = 'candidate' | 'recruiter' | 'admin';

export interface SessionUser {
  id: string;
  email: string;
  fullName: string | null;
  /** Raw slugs from `/auth/me` (kept as strings: the catalog is backend-owned). */
  roles: string[];
}
