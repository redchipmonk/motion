import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { connectDatabase } from "./lib/connectDatabase";
import rsvpsRouter from "./routes/rsvps";
import eventsRouter from "./routes/events";
import usersRouter from "./routes/users";
import authRouter from "./routes/auth";

dotenv.config();

const port = process.env.PORT || 8000;

export const app = express();
app.use(cors());
app.use(express.json());

app.use("/rsvps", rsvpsRouter);
app.use("/events", eventsRouter);
app.use("/users", usersRouter);
app.use("/auth", authRouter);

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
