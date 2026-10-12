// Applications API (backend stage 2 — closed).
//
// Endpoints: POST /applications, GET /applications, GET /applications/{id},
// PATCH /applications/{id} (withdraw).

import { apiFetch, buildQuery } from './api';
import type { ApplicationDto, ApplicationsPageDto } from './talentiTypes';

export const DEFAULT_PAGE_SIZE = 20;

export interface ApplyPayload {
  job_offer_id: string;
  cover_letter?: string | null;
}

export const applicationsApi = {
  async apply(payload: ApplyPayload): Promise<ApplicationDto> {
    return apiFetch<ApplicationDto>('/applications', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /** The candidate's own applications, newest first (paginated). */
  async listMine(page = 1, pageSize = DEFAULT_PAGE_SIZE): Promise<ApplicationsPageDto> {
    return apiFetch<ApplicationsPageDto>(
      `/applications${buildQuery({page, page_size: pageSize})}`
    );
  },

  async getById(applicationId: string): Promise<ApplicationDto> {
    return apiFetch<ApplicationDto>(`/applications/${applicationId}`);
  },

  /** Retract the application (owner only) — the backend moves it to `withdrawn`. */
  async withdraw(applicationId: string): Promise<ApplicationDto> {
    return apiFetch<ApplicationDto>(`/applications/${applicationId}`, {method: 'PATCH'});
  },
};
