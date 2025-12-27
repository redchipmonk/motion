import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export class AuthService {
  /**
   * Hashes a plain text password using bcrypt.
   * Security: Uses salt rounds (10) to make rainbow table attacks computationally expensive.
   */
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  /**
   * Compares a plain text password with a stored hash.
   * Security: Uses constant-time comparison (inside bcrypt) to prevent timing attacks.
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generates a JWT for an authenticated user.
   * Security: Tokens are signed with a secret key and have an expiration (7d) to limit session lifetime.
   */
  static generateToken(userId: string): string {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "7d" });
  }

  /**
   * Verifies the JWT and returns the payload.
   */
  static verifyToken(token: string): string | jwt.JwtPayload {
    return jwt.verify(token, JWT_SECRET);
  }

  /**
   * Verifies a Google Access Token (or ID Token) and returns the user profile.
   * Note: The frontend uses the Implicit Flow (or OAuth code flow) which provides an Access Token.
   * `google-auth-library` `verifyIdToken` is strict about JWTs.
   * For Access Tokens, we use the UserInfo endpoint.
   */
  static async verifyGoogleToken(token: string) {
    try {
      // First try to verify as an ID Token (JWT)
      if (token.split(".").length === 3) {
        if (!GOOGLE_CLIENT_ID) throw new Error("GOOGLE_CLIENT_ID not set");
        const ticket = await googleClient.verifyIdToken({
          idToken: token,
          audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload) throw new Error("Invalid Google Token");
        return payload; // { email, name, sub, picture, ... }
      }

      // Fallback: Assume it's an Access Token and fetch UserInfo
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.statusText}`);
      }

      const data = await response.json() as Record<string, unknown>;

      return {
        ...data,
        // Map 'sub' to match what verifyIdToken returns if needed? 
        // verifyIdToken payload has 'sub'. UserInfo has 'sub'. It matches.
      };
    } catch (error) {
      console.error("Google token verification failed:", error);
      // Determine if error is an Error object to safely access message
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Invalid Google Token: ${errorMessage}`);
    }
  }
}
