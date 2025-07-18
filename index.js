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

// Example Chat Completion Endpoint
app.post('/analyze', async (req, res) => {
  const { prompt } = req.body;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
    });

    res.json({ result: completion.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'AI request failed' });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

