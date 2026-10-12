import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '../services/analyticsApi';
import { profilesApi } from '../services/profilesApi';
import type { ProfileCreateDto, ProfileUpdateDto } from '../services/talentiTypes';

/** GET /profiles/me — `null` when the candidate has no profile yet. */
export function useProfile() {
  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => profilesApi.meOrNull(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProfileCreateDto) => profilesApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({queryKey: ['profile']}),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProfileUpdateDto) => profilesApi.updateMe(payload),
    onSuccess: () => queryClient.invalidateQueries({queryKey: ['profile']}),
  });
}

/** GET /profiles/skills — the candidate's declared skills. */
export function useMySkills() {
  return useQuery({
    queryKey: ['profile', 'skills'],
    queryFn: () => profilesApi.mySkills(),
    staleTime: 1000 * 60 * 5,
  });
}

/** GET /skills — public catalog used by the skill picker. */
export function useSkillCatalog() {
  return useQuery({
    queryKey: ['skills', 'catalog'],
    queryFn: () => profilesApi.catalog(),
    staleTime: 1000 * 60 * 60,
  });
}

// --- Self-service analytics (stages 4/5) ----------------------------------- //

export function useSalaryRadar() {
  return useQuery({
    queryKey: ['analytics', 'salary-radar'],
    queryFn: () => analyticsApi.salaryRadar(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useSkillGap() {
  return useQuery({
    queryKey: ['analytics', 'skill-gap'],
    queryFn: () => analyticsApi.skillGap(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useResponseRate() {
  return useQuery({
    queryKey: ['analytics', 'response-rate'],
    queryFn: () => analyticsApi.responseRate(),
    staleTime: 1000 * 60 * 10,
  });
}
