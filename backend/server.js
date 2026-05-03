import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import rateLimit from "express-rate-limit";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Gemini Client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json({ limit: "10mb" }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/", limiter);

// Story Generation (streaming)
app.post("/api/generate-story", async (req, res) => {
  const { prompt, genre, tone, characters, wordCount, continueFrom } = req.body;

  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const characterDesc =
    characters?.length > 0
      ? "\n\nCharacters:\n" + characters.map((c) => `- ${c.name} (${c.role}): ${c.description}`).join("\n")
      : "";

  const fullPrompt = `You are a master storyteller and creative writing AI. You craft immersive, emotionally resonant stories with vivid imagery and compelling narratives.

Genre: ${genre || "general fiction"}
Tone: ${tone || "neutral"}
Target word count: ~${wordCount || 300} words

Write beautifully, avoid cliches, and make every word count.

${continueFrom
  ? "Continue this story naturally:\n\n" + continueFrom + "\n\n---\n\nNew direction: " + prompt + characterDesc
  : "Write a story based on: " + prompt + characterDesc
}`;

  try {
    const result = await model.generateContentStream(fullPrompt);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        res.write("data: " + JSON.stringify({ text }) + "\n\n");
      }
    }

    res.write("data: " + JSON.stringify({ done: true }) + "\n\n");
    res.end();
  } catch (err) {
    console.error("Stream error:", err);
    res.write("data: " + JSON.stringify({ error: err.message }) + "\n\n");
    res.end();
  }
});

// Character Generator
app.post("/api/generate-character", async (req, res) => {
  const { genre, role, hint } = req.body;

  try {
    const prompt = `Generate a compelling fictional character for a ${genre || "fantasy"} story.
Role: ${role || "protagonist"}
Hint: ${hint || "none"}

Respond ONLY with valid JSON (no markdown, no code fences, no explanation):
{"name":"...","role":"...","age":"...","description":"...","personality":"...","backstory":"...","quirk":"..."}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const character = JSON.parse(cleaned);
    res.json(character);
  } catch (err) {
    console.error("Character error:", err);
    res.status(500).json({ error: "Failed to generate character" });
  }
});

// Title Generator
app.post("/api/generate-titles", async (req, res) => {
  const { storyText, genre } = req.body;

  try {
    const prompt = `Based on this ${genre} story excerpt, suggest 5 evocative, creative titles.
Respond ONLY with a JSON array of 5 strings, no markdown, no explanation:
["Title 1","Title 2","Title 3","Title 4","Title 5"]

Story: ${storyText.slice(0, 500)}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const titles = JSON.parse(cleaned);
    res.json({ titles });
  } catch (err) {
    console.error("Titles error:", err);
    res.status(500).json({ error: "Failed to generate titles" });
  }
});

// Story Critique
app.post("/api/critique", async (req, res) => {
  const { storyText } = req.body;

  try {
    const prompt = `Give a brief, constructive creative writing critique of this story.
Respond ONLY with JSON, no markdown, no explanation:
{"strengths":["...","..."],"improvements":["...","..."],"overallScore":85,"mood":"...","style":"..."}

Story: ${storyText.slice(0, 800)}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const critique = JSON.parse(cleaned);
    res.json(critique);
  } catch (err) {
    console.error("Critique error:", err);
    res.status(500).json({ error: "Failed to critique story" });
  }
});

// Prompt Enhancer
app.post("/api/enhance-prompt", async (req, res) => {
  const { prompt, genre } = req.body;

  try {
    const fullPrompt = `Enhance this writing prompt to be more vivid and specific for a ${genre || "general"} story. Keep it under 60 words. Return ONLY the enhanced prompt text, nothing else.

Original: ${prompt}`;

    const result = await model.generateContent(fullPrompt);
    res.json({ enhanced: result.response.text().trim() });
  } catch (err) {
    console.error("Enhance error:", err);
    res.status(500).json({ error: "Failed to enhance prompt" });
  }
});

// Health check
app.get("/api/health", (_, res) =>
  res.json({ status: "ok", version: "1.0.0", ai: "gemini-2.0-flash" })
);

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(join(__dirname, "../frontend")));
  app.get("*", (_, res) =>
    res.sendFile(join(__dirname, "../frontend/index.html"))
  );
}

app.listen(PORT, () =>
  console.log("✨ AI Story Forge running on port " + PORT + " — powered by Gemini (free!)")
);
