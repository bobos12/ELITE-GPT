const express = require('express');
const PDFDocument = require('pdfkit');
const path = require('path');
const { requireAuth } = require('../middleware/auth');
const { getTemplateById } = require('../service/templates');
const {
  getUserDocuments,
  addUserDocument,
  getUserDocument,
  deleteUserDocument,
} = require('../store');

const router = express.Router();

const ARABIC_FONT = path.join(__dirname, '..', 'fonts', 'Amiri-Regular.ttf');

function fillTemplate(body, fields) {
  let text = String(body || '');
  for (const [key, value] of Object.entries(fields || {})) {
    const re = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    text = text.replace(re, String(value ?? ''));
  }
  return text;
}

function createPdfBuffer({ title, content }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 60, info: { Title: title } });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.registerFont('Amiri', ARABIC_FONT);

    // Header
    doc.font('Amiri').fontSize(22).fillColor('#1B4F2A')
      .text(title || 'وثيقة قانونية', { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#C4913A').lineWidth(1.5).stroke();
    doc.moveDown();

    // Content — RTL Arabic
    doc.font('Amiri').fontSize(12).fillColor('#111')
      .text(content || '', { align: 'right', lineGap: 6 });

    doc.moveDown(3);
    doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#e0e0e0').lineWidth(0.5).stroke();
    doc.moveDown(0.5);

    // Disclaimer
    doc.font('Amiri').fontSize(9).fillColor('#666')
      .text(
        'إخلاء المسؤولية: هذه الوثيقة نموذج عام للاسترشاد وليست استشارة قانونية متخصصة. ' +
        'يرجى مراجعة محامٍ مختص قبل اتخاذ أي إجراء قانوني. | ELITE Legal AI',
        { align: 'center' }
      );

    doc.end();
  });
}

// GET /api/documents
router.get('/', requireAuth, (req, res) => {
  const documents = getUserDocuments(req.user.id);
  return res.json({ documents });
});

// POST /api/documents/generate
router.post('/generate', requireAuth, async (req, res) => {
  const { templateId, fields } = req.body || {};
  if (!templateId || typeof templateId !== 'string') {
    return res.status(400).json({ error: 'Missing templateId.' });
  }

  const template = getTemplateById(templateId);
  if (!template) return res.status(404).json({ error: 'Template not found.' });

  const missing = (template.fields || [])
    .filter(f => f.required)
    .filter(f => !String(fields?.[f.key] || '').trim())
    .map(f => f.key);
  if (missing.length) {
    return res.status(400).json({ error: `الحقول المطلوبة مفقودة: ${missing.join(', ')}` });
  }

  const content = fillTemplate(template.body, fields);
  let pdfBuffer;
  try {
    pdfBuffer = await createPdfBuffer({ title: template.title, content });
  } catch (err) {
    console.error('PDF generation error:', err);
    return res.status(500).json({ error: 'فشل إنشاء ملف PDF.' });
  }

  const ts = Date.now();
  const asciiFileName = `elite_legal_doc_${ts}.pdf`;

  const doc = addUserDocument(req.user.id, {
    title: template.title,
    templateId,
    fileName: asciiFileName,
    pdfBuffer,
  });

  if (!doc) return res.status(404).json({ error: 'User not found.' });

  res.set('X-Document-Id', String(doc.id));
  res.set('X-Filename', asciiFileName);
  res.type('application/pdf');
  res.send(pdfBuffer);
});

// GET /api/documents/:id/download
router.get('/:id/download', requireAuth, (req, res) => {
  const doc = getUserDocument(req.user.id, req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found.' });
  if (!doc.pdfBuffer) return res.status(404).json({ error: 'File not available.' });

  res.set('X-Filename', `elite_legal_doc_${doc.id}.pdf`);
  res.type('application/pdf');
  return res.send(doc.pdfBuffer);
});

// DELETE /api/documents/:id
router.delete('/:id', requireAuth, (req, res) => {
  const ok = deleteUserDocument(req.user.id, req.params.id);
  if (!ok) return res.status(404).json({ error: 'Document not found.' });
  return res.json({ ok: true });
});

module.exports = router;
