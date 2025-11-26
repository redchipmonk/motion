import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { connectDatabase } from "./lib/connectDatabase";

dotenv.config();

const port = process.env.PORT || 8000;
if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI is not set");
}

export const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_, res) => res.json({ status: "ok" }));

async function start() {
  await connectDatabase(process.env.MONGO_URI!);
  if (process.env.NODE_ENV !== "test") {
    app.listen(port, () => console.log(`API listening on ${port}`));
  }
}
start().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});

export default app;