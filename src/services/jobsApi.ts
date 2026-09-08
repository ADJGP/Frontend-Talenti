import type { Job, JobFilters, ApplicationRecord } from '../types';
import { MOCK_JOBS } from './mockJobs';

// Configurable API base URL for connecting backend services
const API_BASE_URL = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_URL || '';

export const jobsApi = {
  /**
   * Fetches job listings with query filtering, sorting, and optional mock delay
   */
  async getJobs(filters: JobFilters, savedJobIds: string[], appliedJobs: Record<string, ApplicationRecord>): Promise<{ jobs: Job[]; total: number }> {
    // If external backend is provided, call real endpoint
    if (API_BASE_URL) {
      try {
        const queryParams = new URLSearchParams({
          search: filters.search,
          department: filters.department,
          workplaceType: filters.workplaceType,
          experienceLevel: filters.experienceLevel,
          minSalary: filters.minSalary.toString(),
          sortBy: filters.sortBy,
        });
        const res = await fetch(`${API_BASE_URL}/api/jobs?${queryParams.toString()}`);
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('Falling back to local data provider:', err);
      }
    }

    // High performance local simulated API with realistic micro-delay
    await new Promise((resolve) => setTimeout(resolve, 180));

    let result = [...MOCK_JOBS];

    // Filter by search query (title, company, skills, or location)
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (job) =>
          job.title.toLowerCase().includes(q) ||
          job.company.toLowerCase().includes(q) ||
          job.location.toLowerCase().includes(q) ||
          job.skills.some((skill) => skill.toLowerCase().includes(q))
      );
    }

    // Filter by department
    if (filters.department !== 'All') {
      result = result.filter((job) => job.department === filters.department);
    }

    // Filter by workplace type
    if (filters.workplaceType !== 'All') {
      result = result.filter((job) => job.workplaceType === filters.workplaceType);
    }

    // Filter by experience level
    if (filters.experienceLevel !== 'All') {
      result = result.filter((job) => job.experienceLevel === filters.experienceLevel);
    }

    // Filter by min salary
    if (filters.minSalary > 0) {
      result = result.filter((job) => job.salaryMax >= filters.minSalary);
    }

    // Filter by only saved
    if (filters.onlySaved) {
      result = result.filter((job) => savedJobIds.includes(job.id));
    }

    // Filter by only applied
    if (filters.onlyApplied) {
      result = result.filter((job) => Boolean(appliedJobs[job.id]));
    }

    // Sorting
    result.sort((a, b) => {
      if (filters.sortBy === 'match') {
        return b.matchScore - a.matchScore;
      }
      if (filters.sortBy === 'recent') {
        return b.postedTimestamp - a.postedTimestamp;
      }
      if (filters.sortBy === 'salary-high') {
        return b.salaryMax - a.salaryMax;
      }
      if (filters.sortBy === 'salary-low') {
        return a.salaryMin - b.salaryMin;
      }
      return 0;
    });

    return {
      jobs: result,
      total: result.length,
    };
  },

  /**
   * Fetches full job detail by ID
   */
  async getJobById(id: string): Promise<Job | null> {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/jobs/${id}`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Falling back to local job provider:', e);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
    const match = MOCK_JOBS.find((j) => j.id === id);
    return match || null;
  },

  /**
   * Submits quick application
   */
  async submitApplication(application: ApplicationRecord): Promise<{ success: boolean; application: ApplicationRecord }> {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/applications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(application),
        });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Backend unavailable, saving locally:', e);
      }
    }

    // Simulate fast network response
    await new Promise((resolve) => setTimeout(resolve, 400));
    return {
      success: true,
      application,
    };
  },
};
