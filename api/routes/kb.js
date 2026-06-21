const express = require('express');
const { getFaqItems } = require('../service/kb');

const router = express.Router();

router.get('/faq', (req, res) => {
  const items = getFaqItems();
  return res.json({ items });
});

module.exports = router;

