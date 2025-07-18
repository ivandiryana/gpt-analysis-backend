import OpenAI from 'openai';
import express from 'express';
import cors from 'cors';
app.use(cors());
const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/analyze', async (req, res) => {
  try {
    const userText = req.body.text;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert in Quran memorization analysis.' },
        { role: 'user', content: userText },
      ],
    });

    res.json({ result: completion.choices[0].message.content });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message || 'Unknown error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
