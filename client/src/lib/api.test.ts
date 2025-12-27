import { describe, it, expect, beforeEach, vi } from 'vitest'
import { api } from './api'

// Mock fetch
const mockFetch = vi.fn()
globalThis.fetch = mockFetch

describe('api utility', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    localStorage.clear()
  })

  describe('request method', () => {
    it('should make GET request with base URL', async () => {
      const mockData = { id: 1, name: 'Test' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      const result = await api.get('/test')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
      expect(result).toEqual(mockData)
    })

    it('should include Authorization header when token exists', async () => {
      localStorage.setItem('token', 'test-token')
      const mockData = { id: 1 }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      await api.get('/test')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          }),
        })
      )
    })

    it('should not include Authorization header when token does not exist', async () => {
      const mockData = { id: 1 }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      await api.get('/test')

      const callArgs = mockFetch.mock.calls[0][1] as { headers: Record<string, string> }
      expect(callArgs.headers).not.toHaveProperty('Authorization')
    })

    it('should throw error when response is not ok', async () => {
      const errorMessage = 'Not found'
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: errorMessage }),
      })

      await expect(api.get('/test')).rejects.toThrow(errorMessage)
    })

    it('should handle POST request with body', async () => {
      const requestBody = { name: 'Test', email: 'test@example.com' }
      const mockResponse = { id: 1, ...requestBody }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await api.post('/test', requestBody)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should handle PATCH request with body', async () => {
      const requestBody = { name: 'Updated' }
      const mockResponse = { id: 1, ...requestBody }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await api.patch('/test/1', requestBody)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/test/1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(requestBody),
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should handle DELETE request', async () => {
      const mockResponse = { success: true }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await api.delete('/test/1')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/test/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })
})
