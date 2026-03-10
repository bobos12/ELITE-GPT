const express = require('express');
const router = express.Router();
const { handleChat } = require('../controllers/controller');
const { requireAuth } = require('../middleware/auth');
const User = require('../models/User');

router.post('/', requireAuth, handleChat);

router.get('/chats', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  await user.ensureChatsInitialized();

  const chats = (user.chats || [])
    .slice()
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .map((c) => ({
      id: String(c._id),
      title: c.title,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    }));

  return res.json({ chats });
});

router.post('/chats', requireAuth, async (req, res) => {
  const { title } = req.body || {};
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  await user.ensureChatsInitialized();
  const chat = await user.createChat({ title: title || 'New chat' });
  return res.json({ chat: { id: String(chat._id), title: chat.title, createdAt: chat.createdAt, updatedAt: chat.updatedAt } });
});

router.get('/chats/:id', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user) return res.status(404).json({ error: 'Not found' });
  const chat = (user.chats || []).find((c) => String(c._id) === String(req.params.id));
  if (!chat) return res.status(404).json({ error: 'Chat not found.' });
  return res.json({
    chat: {
      id: String(chat._id),
      title: chat.title,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      messages: (chat.messages || []).map((m) => ({ role: m.role, content: m.content, createdAt: m.createdAt }))
    }
  });
});

router.patch('/chats/:id', requireAuth, async (req, res) => {
  const { title } = req.body || {};
  const nextTitle = String(title || '').trim();
  if (!nextTitle) return res.status(400).json({ error: 'Missing title.' });

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const chat = (user.chats || []).find((c) => String(c._id) === String(req.params.id));
  if (!chat) return res.status(404).json({ error: 'Chat not found.' });
  chat.title = nextTitle.slice(0, 120);
  chat.updatedAt = new Date();
  await user.save();
  return res.json({ chat: { id: String(chat._id), title: chat.title, updatedAt: chat.updatedAt } });
});

router.delete('/chats/:id', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const idx = (user.chats || []).findIndex((c) => String(c._id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Chat not found.' });
  user.chats.splice(idx, 1);
  await user.save();
  return res.json({ ok: true });
});

module.exports = router;
