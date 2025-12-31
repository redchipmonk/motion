/**
 * @file HTTP client wrapper for the Motion API.
 * 
 * Provides typed GET, POST, PATCH, DELETE methods with automatic auth token injection.
 * All API requests go through this singleton to ensure consistent error handling
 * and authentication header management.
 * 
 * @example
 * import { api } from '@/lib/api';
 * const events = await api.get<Event[]>('/events');
 */

import { API_BASE_URL } from '../constants';

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

class Api {
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = { ...this.getHeaders(), ...options.headers };

    const response = await fetch(url, { ...options, headers });

    // Handle 401 Unauthorized (token expired/invalid) - optional: clear token/redirect
    if (response.status === 401) {
      // localStorage.removeItem('token');
      // window.location.href = '/login';
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Something went wrong');
    }

    return data;
  }

  get<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  patch<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  createEvent(eventData: unknown) {
    return this.post('/events', eventData);
  }
}

export const api = new Api();
