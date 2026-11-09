import "dotenv/config";
import express from "express";
import GrokClient from "./client/llm.client.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  return res
    .status(200)
    .json({ isSuccess: true, message: "Welcome to Quick search extension." });
});

app.post("/api/search", async (req, res) => {
  const { messageHistory } = req.body;

  if (!messageHistory) {
    return res.status(400).json({ error: "Invalid query" });
  }

  try {
    const llmClient = new GrokClient(
      process.env.GROQ_API_KEY,
      process.env.GROQ_API_MODEL,
    );
    const answer = await llmClient.translator(messageHistory);
    res.status(201).json({ answer });
  } catch (err) {
    res.status(500).json({ error: "Search failed" });
  }
});

export default app;
