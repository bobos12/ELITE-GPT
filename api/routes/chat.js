const express = require('express');
const router = express.Router();
const { handleLocalChat, handleChat } = require('../controllers/controller');
const { requireAuth } = require('../middleware/auth');

router.post('/', requireAuth, handleChat);
router.post('/local', handleLocalChat);

router.get('/chats', requireAuth, async (req, res) => {
  const { getUserChats } = require('../store');
  const chats = getUserChats(req.user.id);
  return res.json({
    chats: chats.map(c => ({
      id: c.id,
      title: c.title,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    }))
  });
});

router.post('/chats', requireAuth, async (req, res) => {
  const { createChat } = require('../store');
  const { title } = req.body || {};
  const chat = createChat(req.user.id, title || 'New chat');
  return res.json({
    chat: {
      id: chat.id,
      title: chat.title,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt
    }
  });
});

router.get('/chats/:id', requireAuth, async (req, res) => {
  const { getChat } = require('../store');
  const chat = getChat(req.params.id);
  if (!chat || chat.userId !== req.user.id) {
    return res.status(404).json({ error: 'Chat not found.' });
  }
  return res.json({
    chat: {
      id: chat.id,
      title: chat.title,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      messages: chat.messages.map(m => ({
        role: m.role,
        content: m.content,
        createdAt: m.createdAt
      }))
    }
  });
});

router.patch('/chats/:id', requireAuth, async (req, res) => {
  const { getChat, updateChatTitle } = require('../store');
  const { title } = req.body || {};
  const chat = getChat(req.params.id);
  if (!chat || chat.userId !== req.user.id) {
    return res.status(404).json({ error: 'Chat not found.' });
  }
  const updated = updateChatTitle(req.params.id, title);
  return res.json({
    chat: {
      id: updated.id,
      title: updated.title,
      updatedAt: updated.updatedAt
    }
  });
});

router.delete('/chats/:id', requireAuth, async (req, res) => {
  const { getChat, deleteChat } = require('../store');
  const chat = getChat(req.params.id);
  if (!chat || chat.userId !== req.user.id) {
    return res.status(404).json({ error: 'Chat not found.' });
  }
  deleteChat(req.params.id);
  return res.json({ ok: true });
});

module.exports = router;
