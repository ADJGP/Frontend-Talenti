// Companies API (backend stage 2 — closed) — recruiter surface (F7).
//
// Endpoints:
//   - POST /companies                        create a company (creator ⇒ owner).
//   - GET  /companies/{id}                   public company profile.
//   - GET  /companies/{id}/members           roster (member only).
//   - POST /companies/{id}/members           link a user (owner only).
//
// NOTE: the backend exposes no "my companies" endpoint, so the board keeps the
// acting recruiter's company id locally (see `useRecruiter`) — a new suggestion
// for the backend. Creating a company or pasting a known UUID both work.

import { apiFetch } from './api';
import type {
  CompanyCreateDto,
  CompanyDto,
  CompanyMemberCreateDto,
  CompanyMemberDto,
} from './talentiTypes';

export const companiesApi = {
  /** `POST /companies` — the authenticated creator becomes the first owner. */
  async create(payload: CompanyCreateDto): Promise<CompanyDto> {
    return apiFetch<CompanyDto>('/companies', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /** `GET /companies/{id}` — public profile. */
  async get(companyId: string): Promise<CompanyDto> {
    return apiFetch<CompanyDto>(`/companies/${companyId}`);
  },

  /** `GET /companies/{id}/members` — the roster (member only). */
  async members(companyId: string): Promise<CompanyMemberDto[]> {
    return apiFetch<CompanyMemberDto[]>(`/companies/${companyId}/members`);
  },

  /** `POST /companies/{id}/members` — link a user (owner only). */
  async addMember(
    companyId: string,
    payload: CompanyMemberCreateDto
  ): Promise<CompanyMemberDto> {
    return apiFetch<CompanyMemberDto>(`/companies/${companyId}/members`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
