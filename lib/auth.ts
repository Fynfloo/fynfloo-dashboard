// lib/auth.ts
import { apiRequest, clearAccessToken } from './api';
import type { MeResponse } from './types';

export async function getMe(): Promise<MeResponse> {
  return apiRequest<MeResponse>('/auth/me');
}

export async function logout(): Promise<void> {
  await apiRequest('/auth/logout', {
    method: 'POST',
    skipRefresh: true,
  });
  clearAccessToken();
}
