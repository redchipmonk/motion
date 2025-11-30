import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User, UserDocument } from "../models/user";

if (process.env.NODE_ENV !== "test") {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientID || !clientSecret) {
    console.error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required in non-test environments");
    process.exit(1);
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
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

passport.serializeUser((user: Express.User, done) => {
  const u = user as UserDocument;
  done(null, u._id.toString());
});

passport.deserializeUser((id: string, done) => {
  User.findById(id)
    .then(user => done(null, user))
    .catch(err => done(err as Error));
});

