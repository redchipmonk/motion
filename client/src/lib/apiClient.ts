import { USE_MOCK_DATA } from '../constants';
import { api } from './api';
import { mockApi } from '../data/mockData';

/**
 * Unified API client that delegates to either the real API or mock API
 * based on the USE_MOCK_DATA flag in constants.ts.
 *
 * Usage is identical to the real `api` — just import `apiClient` instead of `api`.
 */
export const apiClient = {
  get<T>(endpoint: string) {
    return USE_MOCK_DATA ? mockApi.get<T>(endpoint) : api.get<T>(endpoint);
  },

  post<T>(endpoint: string, body?: unknown) {
    return USE_MOCK_DATA ? mockApi.post<T>(endpoint, body) : api.post<T>(endpoint, body);
  },

  patch<T>(endpoint: string, body?: unknown) {
    return USE_MOCK_DATA ? mockApi.patch<T>(endpoint, body) : api.patch<T>(endpoint, body);
  },

  delete<T>(endpoint: string) {
    return USE_MOCK_DATA ? mockApi.delete<T>(endpoint) : api.delete<T>(endpoint);
  },
};
