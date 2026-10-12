// Candidate profile + skill catalog API (backend stage 2 — closed).
//
// Endpoints: GET /profiles/me, POST /profiles, PATCH /profiles/me,
// GET|PUT /profiles/skills, GET /skills.
//
// `GET /profiles/me` answers 404 while the candidate has no profile row yet
// (create it with POST /profiles).

import { ApiError, apiFetch } from './api';
import type { ProfileCreateDto, ProfileDto, ProfileUpdateDto, SkillDto } from './talentiTypes';

export const profilesApi = {
  /** Returns `null` when the candidate has no profile yet (404), else the profile. */
  async meOrNull(): Promise<ProfileDto | null> {
    try {
      return await apiFetch<ProfileDto>('/profiles/me');
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  },

  async create(payload: ProfileCreateDto): Promise<ProfileDto> {
    return apiFetch<ProfileDto>('/profiles', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateMe(payload: ProfileUpdateDto): Promise<ProfileDto> {
    return apiFetch<ProfileDto>('/profiles/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  /** Skills the candidate has declared (404 slug / 400 limit handled by backend). */
  async mySkills(): Promise<SkillDto[]> {
    return apiFetch<SkillDto[]>('/profiles/skills');
  },

  /** Declarative replace of the candidate's skills (slugs). */
  async setMySkills(slugs: string[]): Promise<SkillDto[]> {
    return apiFetch<SkillDto[]>('/profiles/skills', {
      method: 'PUT',
      body: JSON.stringify({skills: slugs}),
    });
  },

  /** Public hard-skill catalog, ordered by slug. */
  async catalog(): Promise<SkillDto[]> {
    return apiFetch<SkillDto[]>('/skills');
  },
};
