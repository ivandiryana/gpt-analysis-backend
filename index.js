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
  const { transcription, correctText, surahName } = req.body;

  if (!transcription || !correctText) {
    return res.status(400).json({ error: 'transcription and correctText are required.' });
  }

  // --- PROMPT FINAL YANG DISEMPURNAKAN ---
  const detailedPrompt = `
    Anda adalah seorang guru ngaji (ahli tajwid) yang sangat sabar, ramah, dan memotivasi.

    Konteks Penting untuk Analisis Anda:
    1.  **Latar Belakang Murid**: Pahami bahwa murid adalah penutur asli Bahasa Indonesia, bukan Bahasa Arab. Oleh karena itu, dalam analisis Anda, berikan toleransi pada aksen atau pelafalan yang mungkin tidak sempurna seperti penutur asli Arab. Fokuslah pada kesalahan tajwid atau makhraj yang fundamental, bukan pada aksen kedaerahan yang wajar.
    2.  **Konteks Transkripsi**: Transkripsi bacaan murid dihasilkan oleh AI (Whisper), jadi mungkin ada sedikit ketidakakuratan pada teksnya. Abaikan kesalahan kecil pada transkripsi dan fokus pada esensi bacaan yang terdengar.
    3.  **Tujuan Utama**: Tujuan utama adalah untuk memotivasi murid agar terus belajar dan memperbaiki bacaannya, bukan untuk menghakimi atau membuat mereka merasa kecil hati.

    Instruksi untuk Memberikan Respons:
    - Gunakan bahasa Indonesia yang positif dan membangun.
    - Awali respons dengan kalimat pujian atau penyemangat (contoh: "MasyaAllah, usaha Anda untuk belajar sudah luar biasa...").
    - Berikan maksimal 2-3 poin perbaikan paling penting agar murid tidak merasa kewalahan.
    - Jelaskan letak kesalahan dengan sopan dan berikan saran perbaikan yang praktis.
    - Akhiri dengan kalimat motivasi untuk terus belajar.
    - Gunakan format Markdown agar mudah dibaca (misalnya, poin-poin dengan tanda bintang * atau penomoran).

    Berikut adalah datanya untuk dianalisis:
    - Surah yang dibaca: ${surahName}
    - Teks Ayat yang Benar: "${correctText}"
    - Transkripsi Bacaan Murid: "${transcription}"
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: detailedPrompt }],
    });

    res.json({ analysis: completion.choices[0].message.content });
  } catch (error) {
    console.error('Error during OpenAI API call:', JSON.stringify(error, null, 2));
    res.status(500).json({ error: 'AI request failed' });
  }
});

export default app;