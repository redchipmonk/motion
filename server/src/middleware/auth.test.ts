/**
 * @file Unit tests for auth middleware.
 * 
 * Tests the protectedRoute middleware with mocked request/response.
 */

/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Response, NextFunction } from 'express';
import { protectedRoute, AuthRequest } from './auth';
import { AuthService } from '../services/authService';
import { User } from '../models/user';

// Mock the User model
vi.mock('../models/user', () => ({
  User: {
    findById: vi.fn(),
  },
}));

describe('protectedRoute middleware', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      headers: {},
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  it('should return 401 if no authorization header', async () => {
    await protectedRoute(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Not authorized, no token' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 if authorization header does not start with Bearer', async () => {
    mockReq.headers = { authorization: 'Basic sometoken' };

    await protectedRoute(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Not authorized, no token' });
  });

  it('should return 401 for invalid token', async () => {
    mockReq.headers = { authorization: 'Bearer invalidtoken' };

    await protectedRoute(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Not authorized' });
  });

  it('should return 401 if user not found', async () => {
    const userId = '507f1f77bcf86cd799439011';
    const token = AuthService.generateToken(userId);
    mockReq.headers = { authorization: `Bearer ${token}` };

    // Mock User.findById to return null
    const mockSelect = vi.fn().mockResolvedValue(null);
    vi.mocked(User.findById).mockReturnValue({ select: mockSelect } as never);

    await protectedRoute(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Not authorized. User not found.' });
  });

  it('should call next() and attach user for valid token', async () => {
    const userId = '507f1f77bcf86cd799439011';
    const token = AuthService.generateToken(userId);
    const mockUser = { _id: userId, name: 'Test User', email: 'test@example.com' };

    mockReq.headers = { authorization: `Bearer ${token}` };

    // Mock User.findById to return a user
    const mockSelect = vi.fn().mockResolvedValue(mockUser);
    vi.mocked(User.findById).mockReturnValue({ select: mockSelect } as never);

    await protectedRoute(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user).toEqual(mockUser);
  });
});
