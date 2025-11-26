import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { connectDatabase } from "./lib/connectDatabase";

dotenv.config();

const port = process.env.PORT || 8000;

export const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_, res) => res.json({ status: "ok" }));

async function start() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set");
  }
  await connectDatabase(process.env.MONGO_URI!);
  app.listen(port, () => console.log(`API listening on ${port}`));
}
if (process.env.NODE_ENV !== "test") {
  start().catch((err) => {
    console.error("Failed to start server", err);
    process.exit(1);
  });
}

export default app;