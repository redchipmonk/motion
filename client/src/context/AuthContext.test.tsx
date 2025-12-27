import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('initialization', () => {
    it('should initialize with no user when localStorage is empty', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should initialize with user from localStorage', () => {
      const mockUser = { _id: '123', name: 'Test User', email: 'test@example.com' }
      const mockToken = 'test-token'

      localStorage.setItem('token', mockToken)
      localStorage.setItem('user', JSON.stringify(mockUser))

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.token).toBe(mockToken)
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should handle corrupted user data in localStorage', () => {
      localStorage.setItem('token', 'test-token')
      localStorage.setItem('user', 'invalid-json')

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      expect(result.current.user).toBeNull()
      expect(result.current.token).toBe('test-token')
    })
  })

  describe('login', () => {
    it('should set user and token on login', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      const mockUser = { _id: '123', name: 'Test User', email: 'test@example.com' }
      const mockToken = 'new-token'

      act(() => {
        result.current.login(mockToken, mockUser)
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.token).toBe(mockToken)
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should persist token and user to localStorage', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      const mockUser = { _id: '123', name: 'Test User', email: 'test@example.com' }
      const mockToken = 'new-token'

      act(() => {
        result.current.login(mockToken, mockUser)
      })

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBe(mockToken)
        expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser))
      })
    })
  })

  describe('logout', () => {
    it('should clear user and token on logout', () => {
      const mockUser = { _id: '123', name: 'Test User', email: 'test@example.com' }
      const mockToken = 'test-token'

      localStorage.setItem('token', mockToken)
      localStorage.setItem('user', JSON.stringify(mockUser))

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      act(() => {
        result.current.logout()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should remove token and user from localStorage', async () => {
      localStorage.setItem('token', 'test-token')
      localStorage.setItem('user', JSON.stringify({ _id: '123', name: 'Test', email: 'test@example.com' }))

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      act(() => {
        result.current.logout()
      })

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBeNull()
        expect(localStorage.getItem('user')).toBeNull()
      })
    })
  })

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      expect(() => {
        renderHook(() => useAuth())
      }).toThrow('useAuth must be used within an AuthProvider')
    })
  })
})
