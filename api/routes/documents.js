const express = require('express');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { getTemplateById } = require('../service/templates');

const router = express.Router();

function storageDir() {
  return path.join(__dirname, '..', 'storage', 'documents');
}

function ensureStorageDir() {
  const dir = storageDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function sanitizeFileName(name) {
  return String(name || 'document')
    .replace(/[^\w\-(). ]+/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 80);
}

function fillTemplate(body, fields) {
  let text = String(body || '');
  const entries = Object.entries(fields || {});
  for (const [key, value] of entries) {
    const re = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    text = text.replace(re, String(value ?? ''));
  }
  return text;
}

function createPdfBuffer({ title, content }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text(title || 'Document', { align: 'center' });
    doc.moveDown();
    doc.fontSize(11).text(content || '', { align: 'left' });

    doc.moveDown(2);
    doc.fontSize(9).fillColor('#555').text('Disclaimer: This is a generated template for general information, not legal advice.', {
      align: 'left'
    });

    doc.end();
  });
}

router.get('/', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user) return res.status(404).json({ error: 'Not found' });
  const documents = (user.documents || []).map((d) => ({
    id: String(d._id),
    title: d.title,
    templateId: d.templateId,
    createdAt: d.createdAt
  }));
  return res.json({ documents });
});

router.post('/generate', requireAuth, async (req, res) => {
  const { templateId, fields } = req.body || {};
  if (!templateId || typeof templateId !== 'string') {
    return res.status(400).json({ error: 'Missing templateId.' });
  }

  const template = getTemplateById(templateId);
  if (!template) return res.status(404).json({ error: 'Template not found.' });

  const missing = (template.fields || [])
    .filter((f) => f.required)
    .filter((f) => !String(fields?.[f.key] || '').trim())
    .map((f) => f.key);
  if (missing.length) return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Not found' });

  const title = template.title;
  const content = fillTemplate(template.body, fields);
  const pdf = await createPdfBuffer({ title, content });

  const dir = ensureStorageDir();
  const safe = sanitizeFileName(title);
  const fileName = `${safe}_${Date.now()}.pdf`;
  const filePath = path.join(dir, fileName);
  fs.writeFileSync(filePath, pdf);

  await user.addDocument({ title, templateId, fileName });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('X-Filename', fileName);
  return res.send(pdf);
});

router.get('/:id/download', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user) return res.status(404).json({ error: 'Not found' });
  const doc = (user.documents || []).find((d) => String(d._id) === String(req.params.id));
  if (!doc) return res.status(404).json({ error: 'Document not found.' });

  const filePath = path.join(storageDir(), doc.fileName);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing on server.' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${doc.fileName}"`);
  res.setHeader('X-Filename', doc.fileName);
  return fs.createReadStream(filePath).pipe(res);
});

router.delete('/:id', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const idx = (user.documents || []).findIndex((d) => String(d._id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Document not found.' });
  const [removed] = user.documents.splice(idx, 1);
  await user.save();

  const filePath = path.join(storageDir(), removed.fileName);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch {
      // ignore
    }
  }

  return res.json({ ok: true });
});

module.exports = router;

