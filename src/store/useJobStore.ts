import { create } from 'zustand';
import type { ApplicationRecord, JobFilters } from '../types';

interface JobStoreState {
  // Navigation & View State
  selectedJobId: string | null;
  activeNav: string;
  isMobileDetailOpen: boolean;
  isCommandPaletteOpen: boolean;
  isApplyModalOpen: boolean;
  isShortcutsModalOpen: boolean;
  isAuthOpen: boolean;

  // Theme State
  theme: 'light' | 'dark' | 'system';

  // Language (i18n)
  language: 'es' | 'en';

  // User interactions
  savedJobIds: string[];
  appliedJobs: Record<string, ApplicationRecord>;

  // Recruiter surface (F7): the acting company. The backend has no "my
  // companies" endpoint yet, so the recruiter picks/creates one and we keep it
  // locally (see sugerencias.md).
  recruiterCompanyId: string | null;

  // Filters
  filters: JobFilters;

  // Actions
  setSelectedJobId: (id: string | null) => void;
  setActiveNav: (nav: string) => void;
  setMobileDetailOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setApplyModalOpen: (open: boolean) => void;
  setShortcutsModalOpen: (open: boolean) => void;
  setAuthOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: 'es' | 'en') => void;
  toggleSaveJob: (id: string) => void;
  setAppliedJobs: (applications: ApplicationRecord[]) => void;
  setRecruiterCompanyId: (id: string | null) => void;

  applyToJob: (application: ApplicationRecord) => void;
  setFilters: (filters: Partial<JobFilters>) => void;
  resetFilters: () => void;
}

// Only filters the backend actually supports are exposed (see docs/PLAN_TRABAJO.md F2).
const initialFilters: JobFilters = {
  search: '',
  categoryId: null,
  workplaceType: 'All',
  minSalary: 0,
  sortBy: 'recent',
  onlySaved: false,
  onlyApplied: false,
};

const THEME_KEY = 'talenti_theme';
const LANGUAGE_KEY = 'talenti_language';
const SAVED_KEY = 'talenti_saved_jobs';
const APPLIED_KEY = 'talenti_applied_jobs';
const RECRUITER_COMPANY_KEY = 'talenti_recruiter_company';

// No seeded data: everything comes from the API (docs/PLAN_TRABAJO.md §1.3).
const getInitialSaved = (): string[] => {
  try {
    const data = localStorage.getItem(SAVED_KEY);
    return data ? (JSON.parse(data) as string[]) : [];
  } catch {
    return [];
  }
};

const getInitialApplied = (): Record<string, ApplicationRecord> => {
  try {
    const data = localStorage.getItem(APPLIED_KEY);
    return data ? (JSON.parse(data) as Record<string, ApplicationRecord>) : {};
  } catch {
    return {};
  }
};

const getInitialRecruiterCompany = (): string | null => {
  try {
    return localStorage.getItem(RECRUITER_COMPANY_KEY);
  } catch {
    return null;
  }
};

const getInitialTheme = (): 'light' | 'dark' | 'system' => {
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === 'light' || t === 'dark' || t === 'system') return t;
    return 'dark'; // modern dark default preferred for sleek high-performance SaaS
  } catch {
    return 'dark';
  }
};

const getInitialLanguage = (): 'es' | 'en' => {
  try {
    const lang = localStorage.getItem(LANGUAGE_KEY);
    if (lang === 'es' || lang === 'en') return lang;
    return 'es';
  } catch {
    return 'es';
  }
};

export const useJobStore = create<JobStoreState>((set) => ({
  selectedJobId: null,
  activeNav: 'jobs',
  isMobileDetailOpen: false,
  isCommandPaletteOpen: false,
  isApplyModalOpen: false,
  isShortcutsModalOpen: false,
  isAuthOpen: false,
  theme: getInitialTheme(),
  language: getInitialLanguage(),
  savedJobIds: getInitialSaved(),
  appliedJobs: getInitialApplied(),
  recruiterCompanyId: getInitialRecruiterCompany(),
  filters: initialFilters,

  setSelectedJobId: (id) => set({ selectedJobId: id }),
  setActiveNav: (nav) => set({ activeNav: nav }),
  setMobileDetailOpen: (open) => set({ isMobileDetailOpen: open }),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  setApplyModalOpen: (open) => set({ isApplyModalOpen: open }),
  setShortcutsModalOpen: (open) => set({ isShortcutsModalOpen: open }),
  setAuthOpen: (open) => set({ isAuthOpen: open }),

  setTheme: (theme) => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore
    }
    set({ theme });
  },

  setLanguage: (language) => {
    try {
      localStorage.setItem(LANGUAGE_KEY, language);
    } catch {
      // ignore
    }
    set({ language });
  },

  setRecruiterCompanyId: (id) => {
    try {
      if (id) localStorage.setItem(RECRUITER_COMPANY_KEY, id);
      else localStorage.removeItem(RECRUITER_COMPANY_KEY);
    } catch {
      // ignore
    }
    set({ recruiterCompanyId: id });
  },

  toggleSaveJob: (id) =>
    set((state) => {
      const isSaved = state.savedJobIds.includes(id);
      const newSaved = isSaved
        ? state.savedJobIds.filter((jobId) => jobId !== id)
        : [...state.savedJobIds, id];
      try {
        localStorage.setItem(SAVED_KEY, JSON.stringify(newSaved));
      } catch {
        // ignore
      }
      return { savedJobIds: newSaved };
    }),

  setAppliedJobs: (applications) =>
    set(() => {
      const next: Record<string, ApplicationRecord> = {};
      for (const application of applications) {
        next[application.jobOfferId] = application;
      }
      try {
        localStorage.setItem(APPLIED_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return { appliedJobs: next };
    }),

  applyToJob: (application) =>
    set((state) => {
      const newApplied = {
        ...state.appliedJobs,
        [application.jobOfferId]: application,
      };
      try {
        localStorage.setItem(APPLIED_KEY, JSON.stringify(newApplied));
      } catch {
        // ignore
      }
      return { appliedJobs: newApplied, isApplyModalOpen: false };
    }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  resetFilters: () =>
    set({
      filters: initialFilters,
    }),
}));
