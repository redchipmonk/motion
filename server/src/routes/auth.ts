import express from "express";
import { User } from "../models/user";
import { AuthService } from "../services/authService";

const router = express.Router();

interface RegisterBody {
  name: string;
  email: string;
  password?: string;
  handle: string;
}

/**
 * POST /auth/register
 * Creates a new user with email/password.
 */
router.post("/register", async (req: express.Request<Record<string, never>, Record<string, never>, RegisterBody>, res: express.Response) => {
  try {
    const { name, email, password, handle } = req.body;

    if (!name || !email || !password || !handle) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { handle }]
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists with that email or handle" });
    }

    const hashedPassword = await AuthService.hashPassword(password);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      handle,
      userType: "individual", // default
    });

    const token = AuthService.generateToken(user._id.toString());

    // Return user without sensitive data
    // (Mongoose toJSON/toObject usually handles this if configured, but let's be explicit)
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      handle: user.handle,
      userType: user.userType,
    };

    return res.status(201).json({ token, user: userResponse });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

interface LoginBody {
  email: string;
  password?: string;
}

/**
 * POST /auth/login
 * Logs in a user with email/password.
 */
router.post("/login", async (req: express.Request<Record<string, never>, Record<string, never>, LoginBody>, res: express.Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Missing email or password" });
    }

    // Explicitly select password since it's `select: false` by default
    const user = await User.findOne({ email }).select("+password");

    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValid = await AuthService.comparePassword(password, user.password);

    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = AuthService.generateToken(user._id.toString());

    // Remove password from response
    const userObj = user.toObject();
    delete userObj.password;

    return res.json({ token, user: userObj });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

interface GoogleAuthBody {
  token: string;
}

/**
 * POST /auth/google
 * Verifies Google token and logs in/registers the user.
 */
router.post("/google", async (req: express.Request<Record<string, never>, Record<string, never>, GoogleAuthBody>, res: express.Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Missing token" });
    }

    // Verify token with Google
    const payload = await AuthService.verifyGoogleToken(token);

    if (!payload.email || typeof payload.email !== "string") {
      return res.status(400).json({ message: "Google account has no email" });
    }

    const email = payload.email;
    const googleId = typeof payload.sub === "string" ? payload.sub : "";
    const name = typeof payload.name === "string" ? payload.name : "User";
    const picture = typeof payload.picture === "string" ? payload.picture : undefined;

    // Find user by googleId OR email
    let user = await User.findOne({
      $or: [{ googleId }, { email }],
    });

    if (!user) {
      // Register new user
      // We need a unique handle. Strategy: sanitize name/email + random suffix
      const baseHandle = (name || email.split("@")[0])
        .replace(/\s+/g, "")
        .toLowerCase();
      const uniqueHandle = `${baseHandle}${Math.floor(1000 + Math.random() * 9000)}`;

      user = await User.create({
        name,
        email,
        googleId,
        handle: uniqueHandle,
        userType: "individual",
        profileImage: picture,
        // No password for Google-only users
      });
    } else if (!user.googleId && googleId) {
      // Existing user found by email, but not linked to Google yet. Link it.
      user.googleId = googleId;
      if (picture && !user.profileImage) {
        user.profileImage = picture;
      }
      await user.save();
    }

    const jwtToken = AuthService.generateToken(user._id.toString());
    return res.json({ token: jwtToken, user });
  } catch (error) {
    console.error("Google auth error:", error);
    return res.status(401).json({ message: "Invalid Google token" });
  }
});

export default router;
