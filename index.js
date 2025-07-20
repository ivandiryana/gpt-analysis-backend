import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import admin from 'firebase-admin'; // <-- Tambahkan ini

const app = express();
app.use(cors());
app.use(express.json());

// --- SETUP FIREBASE ADMIN (WAJIB ADA) ---
// Bagian ini membaca kunci rahasia dari environment variable
const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('ascii')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
// --- AKHIR SETUP FIREBASE ---

// OPENAI SETUP (Ini sudah benar)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ROUTES (Ini sudah benar)
app.get('/', (req, res) => {
  res.send('GPT Analysis Backend is running');
});

// Endpoint untuk analisis
app.post('/analyze', async (req, res) => {
  // --- BAGIAN 1: OTENTIKASI PENGGUNA ---
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ error: 'Unauthorized: No token provided.' });
  }
  
  let decodedToken;
  try {
    const idToken = authHeader.split('Bearer ')[1];
    decodedToken = await admin.auth().verifyIdToken(idToken);
  } catch (error) {
    return res.status(403).json({ error: 'Unauthorized: Invalid token.' });
  }
  const uid = decodedToken.uid;
  const userRef = db.collection('users').doc(uid);
  // --- AKHIR OTENTIKASI ---

  // --- BAGIAN 2: PENGURANGAN TOKEN ---
  try {
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error('User document not found.');
      }
      const currentTokens = userDoc.data().ai_token || 0;
      if (currentTokens < 1) {
        throw new Error('Insufficient tokens.');
      }
      transaction.update(userRef, { ai_token: currentTokens - 1 });
    });
  } catch (error) {
    if (error.message === 'Insufficient tokens.') {
      return res.status(402).json({ error: 'Token AI tidak cukup.' });
    }
    console.error('Token deduction error:', error);
    return res.status(500).json({ error: 'Gagal memperbarui jumlah token.' });
  }
  // --- AKHIR PENGURANGAN TOKEN ---

  // --- BAGIAN 3: ANALISIS GPT (Kode asli Anda) ---
  try {
    const { transcription, correctText, surahName, partStart, partEnd } = req.body;
    
    if (!transcription || !correctText) {
      await userRef.update({ ai_token: admin.firestore.FieldValue.increment(1) }); // Kembalikan token
      return res.status(400).json({ error: 'transcription and correctText are required.' });
    }

    const ayatRange = (partStart && partEnd) 
      ? `(Bagian ayat ${partStart} sampai ${partEnd})` 
      : '';

    const detailedPrompt = `
      Anda adalah seorang guru ngaji (ahli tajwid) yang sangat sabar, ramah, dan memotivasi.
      Konteks Penting untuk Analisis Anda:
      1.  Latar Belakang Murid: Pahami bahwa murid adalah penutur asli Bahasa Indonesia, bukan Bahasa Arab. Oleh karena itu, dalam analisis Anda, berikan toleransi pada aksen atau pelafalan yang mungkin tidak sempurna seperti penutur asli Arab. Fokuslah pada kesalahan tajwid atau makhraj yang fundamental, bukan pada aksen kedaerahan yang wajar.
      2.  Konteks Transkripsi: Transkripsi bacaan murid dihasilkan oleh AI (Whisper), jadi mungkin ada sedikit ketidakakuratan pada teksnya. Abaikan kesalahan kecil pada transkripsi dan fokus pada esensi bacaan yang terdengar.
      3.  Tujuan Utama: Tujuan utama adalah untuk memotivasi murid agar terus belajar dan memperbaiki bacaannya, bukan untuk menghakimi atau membuat mereka merasa kecil hati.
      Instruksi untuk Memberikan Respons:
      - Gunakan bahasa Indonesia yang positif dan membangun.
      - Awali respons dengan kalimat pujian atau penyemangat (contoh: "MasyaAllah, usaha Anda untuk belajar sudah luar biasa...").
      - Berikan maksimal 2-3 poin perbaikan paling penting agar murid tidak merasa kewalahan.
      - Jelaskan letak kesalahan dengan sopan dan berikan saran perbaikan yang praktis.
      - Akhiri dengan kalimat motivasi untuk terus belajar.
      - Gunakan format Markdown agar mudah dibaca (misalnya, poin-poin dengan tanda bintang * atau penomoran).
      Berikut adalah datanya untuk dianalisis:
      - Surah yang dibaca: ${surahName} ${ayatRange}
      - Teks Ayat yang Benar: "${correctText}"
      - Transkripsi Bacaan Murid: "${transcription}"
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: detailedPrompt }],
    });

    res.json({ analysis: completion.choices[0].message.content });
  } catch (error) {
    console.error('Error during OpenAI API call:', JSON.stringify(error, null, 2));
    await userRef.update({ ai_token: admin.firestore.FieldValue.increment(1) }); // Kembalikan token jika GPT gagal
    res.status(500).json({ error: 'AI request failed' });
  }
});

export default app;