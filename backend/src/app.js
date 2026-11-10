import "dotenv/config";
import express from "express";
import GrokClient from "./client/llm.client.js";

const app = express();

app.use(express.json());

const validWord = (w) =>
  typeof w === "string" && w.length <= 40 && /^[\p{L}][\p{L}'’-]*$/u.test(w);

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

app.post("/api/variants", async (req, res) => {
  const { word } = req.body;
  if (!validWord(word)) return res.status(400).json({ error: "Invalid word" });
  try {
    const llmClient = new GrokClient(
      process.env.GROQ_API_KEY_VARIANTS,
      process.env.GROQ_API_MODEL,
    );
    res.json({ variants: await llmClient.variants(word) });
  } catch {
    res.status(500).json({ error: "Variants failed" });
  }
});

app.post("/api/guess", async (req, res) => {
  const { word } = req.body;
  if (!validWord(word)) return res.status(400).json({ error: "Invalid word" });
  try {
    const llmClient = new GrokClient(
      process.env.GROQ_API_KEY_GUESS,
      process.env.GROQ_API_MODEL,
    );
    res.json({ sentence: await llmClient.guess(word) });
  } catch {
    res.status(500).json({ error: "Guess failed" });
  }
});

app.post("/api/active", (req, res) => {
  return res.json({ isSuccess: true, message: "Server is up !" });
});

export default app;
