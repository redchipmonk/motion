import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User, UserDocument } from "../models/user";

// Extend Express Request interface to include the user
export interface AuthRequest extends Request {
  user?: UserDocument;
}

/**
 * Middleware to protect routes.
 * Security: Extracts Bearer token, verifies signature, and ensures user exists in DB.
 */
export const protectedRoute = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded: any = jwt.verify(
        token,
        process.env.JWT_SECRET || "default_secret"
      );

      // Get user from the token
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        res.status(401).json({ message: "Not authorized. User not found." });
        return;
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      res.status(401).json({ message: "Not authorized" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};
