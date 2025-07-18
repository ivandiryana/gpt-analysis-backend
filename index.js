const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Configuration, OpenAIApi } = require('openai');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.post('/analyze', async (req, res) => {
  const { surah, transcription } = req.body;

  try {
    const prompt = `Tolong analisis hasil hafalan berikut berdasarkan surah ${surah}. Berikut hasil transkripsinya:\n\n"${transcription}"\n\nBerikan penilaian dan saran dalam bahasa Indonesia.`;

    const response = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const result = response.data.choices[0].message.content;
    res.json({ result });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Gagal menganalisis hafalan.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`GPT Analysis running on port ${PORT}`));
