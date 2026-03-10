const express = require('express');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user) return res.status(404).json({ error: 'Not found' });
  return res.json({ id: String(user._id), email: user.email, createdAt: user.createdAt });
});

router.get('/history', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user) return res.status(404).json({ error: 'Not found' });
  return res.json({ history: user.history || [] });
});

router.delete('/history', requireAuth, async (req, res) => {
  await User.updateOne({ _id: req.user.id }, { $set: { history: [] } });
  return res.json({ ok: true });
});

router.delete('/history/:id', requireAuth, async (req, res) => {
  const historyId = req.params.id;
  await User.updateOne(
    { _id: req.user.id },
    { $pull: { history: { _id: historyId } } }
  );
  return res.json({ ok: true });
});

module.exports = router;

