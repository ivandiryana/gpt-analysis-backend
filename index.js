const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/analyze", async (req, res) => {
  try {
    const { surahName, userTranscript } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert Qur'an teacher evaluating memorization accuracy from user transcriptions.",
        },
        {
          role: "user",
          content: `This is the surah: ${surahName}. The user recited:\n${userTranscript}.\nGive a memorization score (0–100%) and short feedback.`,
        },
      ],
    });

    const reply = completion.choices[0].message.content;
    res.json({ result: reply });
  } catch (error) {
    console.error("Error analyzing:", error);
    res.status(500).json({ error: "Failed to analyze transcription" });
  }
});

app.get("/", (req, res) => {
  res.send("GPT Analysis Backend is running.");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
