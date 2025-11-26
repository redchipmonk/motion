import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { connectDatabase } from "./lib/connectDatabase";
import eventsRouter from "./routes/events";

dotenv.config();

const port = process.env.PORT || 8000;

export const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_, res) => res.json({ status: "ok" }));
app.use("/events", eventsRouter);

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
