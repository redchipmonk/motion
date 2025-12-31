/**
 * @file Unit tests for AuthService.
 * 
 * Tests password hashing/comparison and JWT generation/verification.
 * Google token verification is not unit tested as it requires external API.
 */

import { describe, it, expect, vi } from 'vitest';
import { AuthService } from './authService';
import jwt from 'jsonwebtoken';

describe('AuthService', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hash = await AuthService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are ~60 chars
    });

    it('should produce different hashes for same password (due to salt)', async () => {
      const password = 'testPassword123';
      const hash1 = await AuthService.hashPassword(password);
      const hash2 = await AuthService.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'testPassword123';
      const hash = await AuthService.hashPassword(password);

      const result = await AuthService.comparePassword(password, hash);

      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword456';
      const hash = await AuthService.hashPassword(password);

      const result = await AuthService.comparePassword(wrongPassword, hash);

      expect(result).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT', () => {
      const userId = '507f1f77bcf86cd799439011';
      const token = AuthService.generateToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include user ID in token payload', () => {
      const userId = '507f1f77bcf86cd799439011';
      const token = AuthService.generateToken(userId);

      const decoded = jwt.decode(token) as { id: string };

      expect(decoded.id).toBe(userId);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token and return payload', () => {
      const userId = '507f1f77bcf86cd799439011';
      const token = AuthService.generateToken(userId);

      const payload = AuthService.verifyToken(token);

      expect(payload).toBeDefined();
      expect((payload as jwt.JwtPayload).id).toBe(userId);
    });

    it('should throw for an invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => AuthService.verifyToken(invalidToken)).toThrow();
    });

    it('should throw for a tampered token', () => {
      const userId = '507f1f77bcf86cd799439011';
      const token = AuthService.generateToken(userId);
      const tamperedToken = token.slice(0, -5) + 'XXXXX';

      expect(() => AuthService.verifyToken(tamperedToken)).toThrow();
    });
  });
});
