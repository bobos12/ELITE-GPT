const { getBotReply } = require('../service/service');
const User = require('../models/User');

function titleFromMessage(message) {
  const t = String(message || '').trim().replace(/\s+/g, ' ');
  if (!t) return 'New chat';
  return t.length > 48 ? `${t.slice(0, 48)}…` : t;
}

exports.handleChat = async (req, res) => {
  const { message, chatId } = req.body || {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ reply: 'Missing \"message\" in request body.' });
  }

  try {
    const user = await User.findById(req.user?.id);
    if (!user) return res.status(404).json({ error: 'Not found' });

    await user.ensureChatsInitialized();

    let activeChatId = chatId;
    if (!activeChatId) {
      const chat = await user.createChat({ title: titleFromMessage(message) });
      activeChatId = String(chat._id);
    }

    await user.addChatMessage({ chatId: activeChatId, role: 'user', content: message });

    const out = await getBotReply(message);
    const replyText = out?.reply || 'No reply.';
    await user.addChatMessage({ chatId: activeChatId, role: 'assistant', content: replyText });
    await user.addHistoryItem({ query: message, reply: replyText });

    return res.json({ reply: replyText, chatId: activeChatId });
  } catch (error) {
    return res.status(500).json({ reply: 'An error occurred on the server.' });
  }
};
