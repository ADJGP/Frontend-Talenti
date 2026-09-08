import { create } from 'zustand';
import type { ApplicationRecord, JobFilters, Department, WorkplaceType, ExperienceLevel, SortOption } from '../types';

interface JobStoreState {
  // Navigation & View State
  selectedJobId: string | null;
  activeNav: string;
  isMobileDetailOpen: boolean;
  isCommandPaletteOpen: boolean;
  isApplyModalOpen: boolean;
  isShortcutsModalOpen: boolean;
  
  // Theme State
  theme: 'light' | 'dark' | 'system';
  
  // Language (i18n)
  language: 'es' | 'en';
  
  // User interactions
  savedJobIds: string[];
  appliedJobs: Record<string, ApplicationRecord>;
  
  // Filters
  filters: JobFilters;
  
  // Actions
  setSelectedJobId: (id: string | null) => void;
  setActiveNav: (nav: string) => void;
  setMobileDetailOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setApplyModalOpen: (open: boolean) => void;
  setShortcutsModalOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: 'es' | 'en') => void;
  toggleSaveJob: (id: string) => void;

  applyToJob: (application: ApplicationRecord) => void;
  setFilters: (filters: Partial<JobFilters>) => void;
  resetFilters: () => void;
}

const initialFilters: JobFilters = {
  search: '',
  department: 'All',
  workplaceType: 'All',
  experienceLevel: 'All',
  minSalary: 0,
  sortBy: 'match',
  onlySaved: false,
  onlyApplied: false,
};

// Safe localStorage helper
const getInitialSaved = (): string[] => {
  try {
    const data = localStorage.getItem('jobsplit_saved_jobs');
    return data ? JSON.parse(data) : ['job-1', 'job-3'];
  } catch {
    return ['job-1', 'job-3'];
  }
};

const getInitialApplied = (): Record<string, ApplicationRecord> => {
  try {
    const data = localStorage.getItem('jobsplit_applied_jobs');
    return data ? JSON.parse(data) : {
      'job-4': {
        jobId: 'job-4',
        appliedAt: 'Yesterday at 3:45 PM',
        fullName: 'Alex Vance',
        email: 'alex.vance@techinnovator.io',
        resumeFileName: 'Alex_Vance_Senior_Staff_Resume_2026.pdf',
        coverNote: 'Excited about your platform scalability vision!',
        status: 'Screening',
      }
    };
  } catch {
    return {};
  }
};

const getInitialTheme = (): 'light' | 'dark' | 'system' => {
  try {
    const t = localStorage.getItem('jobsplit_theme');
    if (t === 'light' || t === 'dark' || t === 'system') return t;
    return 'dark'; // modern dark default preferred for sleek high-performance SaaS
  } catch {
    return 'dark';
  }
};

const getInitialLanguage = (): 'es' | 'en' => {
  try {
    const lang = localStorage.getItem('jobsplit_language');
    if (lang === 'es' || lang === 'en') return lang;
    // Default to Spanish (es) or user preference
    return 'es';
  } catch {
    return 'es';
  }
};

export const useJobStore = create<JobStoreState>((set) => ({
  selectedJobId: 'job-1',
  activeNav: 'jobs',
  isMobileDetailOpen: false,
  isCommandPaletteOpen: false,
  isApplyModalOpen: false,
  isShortcutsModalOpen: false,
  theme: getInitialTheme(),
  language: getInitialLanguage(),
  savedJobIds: getInitialSaved(),
  appliedJobs: getInitialApplied(),
  filters: initialFilters,

  setSelectedJobId: (id) => set({ selectedJobId: id }),
  setActiveNav: (nav) => set({ activeNav: nav }),
  setMobileDetailOpen: (open) => set({ isMobileDetailOpen: open }),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  setApplyModalOpen: (open) => set({ isApplyModalOpen: open }),
  setShortcutsModalOpen: (open) => set({ isShortcutsModalOpen: open }),
  
  setTheme: (theme) => {
    try {
      localStorage.setItem('jobsplit_theme', theme);
    } catch {}
    set({ theme });
  },

  setLanguage: (language) => {
    try {
      localStorage.setItem('jobsplit_language', language);
    } catch {}
    set({ language });
  },

  toggleSaveJob: (id) =>

    set((state) => {
      const isSaved = state.savedJobIds.includes(id);
      const newSaved = isSaved
        ? state.savedJobIds.filter((jobId) => jobId !== id)
        : [...state.savedJobIds, id];
      try {
        localStorage.setItem('jobsplit_saved_jobs', JSON.stringify(newSaved));
      } catch {}
      return { savedJobIds: newSaved };
    }),

  applyToJob: (application) =>
    set((state) => {
      const newApplied = {
        ...state.appliedJobs,
        [application.jobId]: application,
      };
      try {
        localStorage.setItem('jobsplit_applied_jobs', JSON.stringify(newApplied));
      } catch {}
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
