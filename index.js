const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/analyze', async (req, res) => {
  const { surahName, userTranscript } = req.body;

  if (!surahName || !userTranscript) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const prompt = `Transkripsi berikut adalah hasil bacaan surah ${surahName}. Tugas Anda adalah mengevaluasi bacaan ini berdasarkan akurasi terhadap teks asli Al-Qur'an.\n\nTeks bacaan:\n${userTranscript}\n\nBerikan:\n1. Skor antara 0–100\n2. Penilaian: Sangat Baik / Baik / Cukup / Perlu Latihan\n3. Umpan balik untuk perbaikan.\n\nJawab dalam format JSON.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Anda adalah guru tahsin ahli Al-Qur'an." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
    });

    const text = completion.choices[0].message.content;
    res.json({ result: text });
  } catch (error) {
    console.error('GPT error:', error);
    res.status(500).json({ error: 'Failed to analyze with GPT' });
  }
});

app.get('/', (req, res) => {
  res.send('GPT Analysis Server is running!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
