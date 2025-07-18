import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
app.use(cors());
app.use(express.json());

// OPENAI SETUP
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ROUTES
app.get('/', (req, res) => {
  res.send('GPT Analysis Backend is running');
});

// Endpoint untuk analisis
app.post('/analyze', async (req, res) => {
  const { prompt } = req.body;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
    });

    res.json({ result: completion.choices[0].message.content });
  } catch (error) {
    console.error('Error saat memanggil OpenAI API:', error);
    res.status(500).json({ error: 'AI request failed' });
  }
});

// PENGATURAN PORT UNTUK RAILWAY
const PORT = process.env.PORT;

if (!PORT) {
  // Baris ini memastikan aplikasi tidak akan berjalan jika variabel PORT tidak ada
  throw new Error("Aplikasi harus berjalan pada port yang disediakan oleh environment variable PORT");
}

app.listen(PORT, () => {
  console.log(`✅ Server berjalan pada port yang disediakan oleh Railway: ${PORT}`);
});