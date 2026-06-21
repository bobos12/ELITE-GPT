const express = require('express');
const router = express.Router();
const multer = require('multer');
const { requireAuth } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const ok = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    if (ok.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF, DOCX, and TXT files are supported.'));
  },
});

async function extractText(mimetype, buffer) {
  if (mimetype === 'text/plain') {
    return buffer.toString('utf-8');
  }
  if (mimetype === 'application/pdf') {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    return data.text || '';
  }
  if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }
  throw new Error('Unsupported file type.');
}

router.post('/upload', requireAuth, upload.single('document'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

  const { mimetype, buffer, originalname } = req.file;

  try {
    let text = await extractText(mimetype, buffer);
    text = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

    const MAX = 8000;
    const truncated = text.length > MAX;
    text = text.slice(0, MAX);

    return res.json({ ok: true, fileName: originalname, text, truncated, charCount: text.length });
  } catch (err) {
    console.error('Analyze error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to extract text.' });
  }
});

module.exports = router;
