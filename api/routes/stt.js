const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');
const multer = require('multer');
const OpenAI = require('openai');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, os.tmpdir()),
    filename: (req, file, cb) => cb(null, `stt_${Date.now()}_${Math.random().toString(16).slice(2)}${path.extname(file.originalname || '')}`)
  }),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB
});

router.post('/transcribe', requireAuth, upload.single('audio'), async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Missing OPENAI_API_KEY on server (set it in api/.env and restart the API).' });
  if (!req.file?.path) return res.status(400).json({ error: 'Missing audio file.' });

  const client = new OpenAI({ apiKey });
  try {
    const requestedLanguage = String(req.body?.language || '').trim().toLowerCase();
    // Whisper accepts ISO-639-1 language codes; omit to auto-detect.
    const language = requestedLanguage === 'ar' || requestedLanguage === 'en' ? requestedLanguage : undefined;

    const transcription = await client.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: 'whisper-1',
      ...(language ? { language } : {})
    });

    const text = String(transcription?.text || '').trim();
    return res.json({ text });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[STT] transcribe error', err);
    const status = err?.status || 500;
    const message =
      err?.error?.message ||
      err?.message ||
      'Transcription failed.';
    return res.status(status).json({ error: message });
  } finally {
    fs.promises.unlink(req.file.path).catch(() => {});
  }
});

module.exports = router;
