import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import { applicationsApi } from '../services/applicationsApi';
import { useJobStore } from '../store/useJobStore';
import type { ApplicationStatus } from '../types';

interface ApplyVariables {
  jobOfferId: string;
  coverLetter?: string | null;
}

/** POST /applications — the candidate identity comes from the bearer token. */
export function useApply() {
  const queryClient = useQueryClient();
  const applyToJob = useJobStore((state) => state.applyToJob);

  return useMutation({
    mutationFn: ({jobOfferId, coverLetter}: ApplyVariables) =>
      applicationsApi.apply({
        job_offer_id: jobOfferId,
        cover_letter: coverLetter ?? null,
      }),
    onSuccess: (data) => {
      applyToJob({
        applicationId: data.id,
        jobOfferId: data.job_offer_id,
        status: data.status as ApplicationStatus,
        createdAt: data.created_at,
        coverLetter: data.cover_letter,
      });

      queryClient.invalidateQueries({queryKey: ['applications']});

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: {y: 0.7},
          colors: ['#4f46e5', '#6366f1', '#10b981', '#3b82f6'],
        });
      } catch {
        // Confetti is decorative — never fail the flow for it.
      }
    },
  });
}

/** GET /applications — the candidate's own applications (paginated). */
export function useMyApplications(options: {enabled?: boolean} = {}) {
  const setAppliedJobs = useJobStore((state) => state.setAppliedJobs);

  return useQuery({
    enabled: options.enabled ?? true,
    queryKey: ['applications'],
    queryFn: async () => {
      const page = await applicationsApi.listMine();
      setAppliedJobs(
        page.items.map((item) => ({
          applicationId: item.id,
          jobOfferId: item.job_offer_id,
          status: item.status as ApplicationStatus,
          createdAt: item.created_at,
          coverLetter: null,
        }))
      );
      return page;
    },
    staleTime: 1000 * 60 * 2,
  });
}

/** PATCH /applications/{id} — retract an application (→ `withdrawn`). */
export function useWithdrawApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (applicationId: string) => applicationsApi.withdraw(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['applications']});
    },
  });
}
