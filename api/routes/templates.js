const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getTemplates, getTemplateById } = require('../service/templates');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const templates = getTemplates().map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    fields: t.fields || []
  }));
  return res.json({ templates });
});

router.get('/:id', requireAuth, (req, res) => {
  const template = getTemplateById(req.params.id);
  if (!template) return res.status(404).json({ error: 'Template not found.' });
  return res.json({ template });
});

module.exports = router;

