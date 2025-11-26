import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { connectDatabase } from "./lib/connectDatabase";
import session from "express-session";
import passport from "passport";
import "./auth/google"; 
import authRoutes from "./routes/auth";
import { UserDocument } from "./models/user";

dotenv.config();

const port = process.env.PORT || 8000;

export const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, sameSite: "lax" }, //change to secure: true on prod (idk why)
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRoutes);

app.get("/me", (req, res) => {
  if (!req.user) return res.json({ user: null });

  const { name, email, profileImage } = req.user as UserDocument;
  res.json({ user: { name, email, picture: profileImage } });
});

app.get("/health", (_, res) => res.json({ status: "ok" }));

async function start() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is not set");
  }
  await connectDatabase(mongoUri);
  app.listen(port, () => console.log(`API listening on ${port}`));
}
if (process.env.NODE_ENV !== "test") {
  start().catch((err) => {
    console.error("Failed to start server", err);
    process.exit(1);
  });
}

export default app;
