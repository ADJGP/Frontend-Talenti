import { useQuery } from '@tanstack/react-query';
import { jobsApi } from '../services/jobsApi';
import { useJobStore } from '../store/useJobStore';

export function useJobs() {
  const filters = useJobStore((state) => state.filters);
  const savedJobIds = useJobStore((state) => state.savedJobIds);
  const appliedJobs = useJobStore((state) => state.appliedJobs);

  return useQuery({
    queryKey: ['jobs', filters, savedJobIds.length, Object.keys(appliedJobs).length],
    queryFn: () => jobsApi.getJobs(filters, savedJobIds, appliedJobs),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useJobDetail(jobId: string | null) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: () => (jobId ? jobsApi.getJobById(jobId) : Promise.resolve(null)),
    enabled: Boolean(jobId),
    staleTime: 1000 * 60 * 10,
  });
}
