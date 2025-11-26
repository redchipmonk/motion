import express from "express";
import passport from "passport";
import type { RequestHandler } from "express";

const router = express.Router();

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }) as RequestHandler);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }) as RequestHandler,
  (req, res) => {
    res.redirect(process.env.FRONTEND_URL!);
  }
);


router.post("/logout", (req, res, next) => {
  req.logout({ keepSessionInfo: false }, (err) => {
    if (err) return next(err);

    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
        return res.status(500).json({ success: false });
      }

      res.clearCookie("connect.sid", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      res.json({ success: true });
    });
  });
});

export default router;