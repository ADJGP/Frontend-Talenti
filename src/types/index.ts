export type WorkplaceType = 'All' | 'Remote' | 'Hybrid' | 'On-site';
export type EmploymentType = 'Full-time' | 'Contract' | 'Part-time';
export type Department = 'All' | 'Engineering' | 'Design' | 'Product' | 'Data & AI' | 'Marketing' | 'DevOps';
export type ExperienceLevel = 'All' | 'Junior' | 'Mid-Level' | 'Senior' | 'Lead' | 'Staff';
export type SortOption = 'match' | 'recent' | 'salary-high' | 'salary-low';

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
  companySlug: string;
  companyLogoBg: string;
  companyLogoText: string;
  companyWebsite: string;
  companySize: string;
  headquarters: string;
  location: string;
  workplaceType: 'Remote' | 'Hybrid' | 'On-site';
  employmentType: EmploymentType;
  department: 'Engineering' | 'Design' | 'Product' | 'Data & AI' | 'Marketing' | 'DevOps';
  experienceLevel: 'Junior' | 'Mid-Level' | 'Senior' | 'Lead' | 'Staff';
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  matchScore: number;
  matchBreakdown: {
    skillsMatch: number;
    experienceMatch: number;
    salaryFit: number;
  };
  matchHighlights: string[];
  postedAt: string;
  postedTimestamp: number;
  featured?: boolean;
  urgentlyHiring?: boolean;
  tagline: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  benefits: string[];
  skills: string[];
  hiringManager: HiringManager;
  applicantsCount: number;
  techStack: string[];
}

export interface JobFilters {
  search: string;
  department: Department;
  workplaceType: WorkplaceType;
  experienceLevel: ExperienceLevel;
  minSalary: number;
  sortBy: SortOption;
  onlySaved: boolean;
  onlyApplied: boolean;
}

export interface ApplicationRecord {
  jobId: string;
  appliedAt: string;
  fullName: string;
  email: string;
  phone?: string;
  resumeFileName: string;
  coverNote?: string;
  status: 'Reviewing' | 'Screening' | 'Interview' | 'Offered';
}
