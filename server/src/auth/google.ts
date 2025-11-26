import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import { User } from "../models/user";

dotenv.config();
if (process.env.NODE_ENV !== "test") {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: "/auth/google/callback",
      },
      (accessToken, refreshToken, profile, done) => {
        console.log(profile)
        User.findOne({ email: profile.emails?.[0]?.value })
          .then((user) => {
            if (user) return done(null, user);
            return User.create({
              name: profile.displayName,
              email: profile.emails?.[0]?.value,
              profileImage: profile.photos?.[0]?.value,
            }).then((newUser) => done(null, newUser));
          })
          .catch((err) => done(err as Error));
      }
    )
  );
}

passport.serializeUser((user: unknown, done) => {
  done(null, user);
});

passport.deserializeUser((user: unknown, done) => {
  done(null, user as Express.User | null);
});