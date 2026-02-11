import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the constants module to control USE_MOCK_DATA
vi.mock('../constants', () => ({ USE_MOCK_DATA: true }));

// Mock both api and mockApi
vi.mock('./api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ real: true }),
    post: vi.fn().mockResolvedValue({ real: true }),
  },
}));

vi.mock('../data/mockData', () => ({
  mockApi: {
    get: vi.fn().mockResolvedValue({ mock: true }),
    post: vi.fn().mockResolvedValue({ mock: true }),
  },
}));

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates to mockApi when USE_MOCK_DATA is true', async () => {
    // Import after mocks are set up
    const { apiClient } = await import('./apiClient');
    const { mockApi } = await import('../data/mockData');

    const result = await apiClient.get('/events/feed');
    expect(result).toEqual({ mock: true });
    expect(mockApi.get).toHaveBeenCalledWith('/events/feed');
  });
});
