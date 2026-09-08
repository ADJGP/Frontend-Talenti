import { useMutation, useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import { jobsApi } from '../services/jobsApi';
import { useJobStore } from '../store/useJobStore';
import type { ApplicationRecord } from '../types';

export function useApply() {
  const queryClient = useQueryClient();
  const applyToJob = useJobStore((state) => state.applyToJob);

  return useMutation({
    mutationFn: (application: ApplicationRecord) => jobsApi.submitApplication(application),
    onSuccess: (data) => {
      // Store in Zustand + localStorage
      applyToJob(data.application);
      
      // Invalidate jobs queries to update application status tags
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      
      // Celebrate with subtle confetti
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#4f46e5', '#6366f1', '#10b981', '#3b82f6'],
        });
      } catch (e) {
        // Safe fallback
      }
    },
  });
}
