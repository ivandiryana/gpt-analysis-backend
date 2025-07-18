const express = require('express');
const cors = require('cors');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.post('/analyze', async (req, res) => {
  const { surahName, transcription } = req.body;

  if (!surahName || !transcription) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an expert Qur'an memorization evaluator.`,
        },
        {
          role: 'user',
          content: `Evaluate my memorization of Surah ${surahName}. This is the transcription of what I recited: ${transcription}`,
        },
      ],
    });

    const feedback = completion.data.choices[0].message.content;
    res.json({ feedback });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'GPT evaluation failed' });
  }
});

app.get('/', (req, res) => {
  res.send('GPT Deep Analysis Server is running!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
