import { useQuery } from '@tanstack/react-query';
import { jobsApi, filtersToQuery } from '../services/jobsApi';
import { detailToJob, summaryToJob } from '../services/jobAdapter';
import { isUuid } from '../services/api';
import { useJobStore } from '../store/useJobStore';
import type { Job } from '../types';

const PAGE_SIZE = 20;

/**
 * Real offer listing: `GET /job-offers` + adapter.
 *
 * Returns the mapped jobs plus the backend paging metadata and facet counts so
 * the filter bar can render categories/work modes from real data.
 */
export function useJobs() {
  const filters = useJobStore((state) => state.filters);

  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: async () => {
      const page = await jobsApi.listOffers(filtersToQuery(filters, 1, PAGE_SIZE));
      const jobs = page.items.map(summaryToJob);
      return {
        jobs,
        total: page.total,
        totalPages: page.total_pages,
        facets: page.facets,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/** Real offer detail: `GET /job-offers/{id}` (only for backend UUIDs). */
export function useJobDetail(jobId: string | null) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: async (): Promise<Job | null> => {
      if (!jobId || !isUuid(jobId)) return null;
      return detailToJob(await jobsApi.getOffer(jobId));
    },
    enabled: Boolean(jobId) && isUuid(jobId ?? ''),
    staleTime: 1000 * 60 * 10,
  });
}
