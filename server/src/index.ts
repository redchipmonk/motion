import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_, res) => res.json({ status: "ok" }));

const port = process.env.PORT || 8000;
app.listen(port, () => console.log(`API listening on ${port}`));
