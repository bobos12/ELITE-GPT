const { getBotReply } = require('../service/service');
const { createChat, addChatMessage, getUserChats } = require('../store');

function titleFromMessage(message) {
  const t = String(message || '').trim().replace(/\s+/g, ' ');
  if (!t) return 'New chat';
  return t.length > 48 ? `${t.slice(0, 48)}…` : t;
}

exports.handleChat = async (req, res) => {
  const { message, chatId } = req.body || {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ reply: 'Missing "message" in request body.' });
  }

  try {
    let activeChatId = chatId;
    if (!activeChatId) {
      const chat = createChat(req.user.id, titleFromMessage(message));
      activeChatId = chat.id;
    }

    addChatMessage(activeChatId, 'user', message);

    const out = await getBotReply(message);
    addChatMessage(activeChatId, 'assistant', out.reply || 'No reply.');

    return res.json({
      reply: out.reply || 'No reply.',
      citations: out.citations || [],
      confidence: out.confidence || '', // '' for greetings/small-talk → no badge
      confidenceReason: out.confidenceReason || '',
      isOutOfScope: out.isOutOfScope || false,
      chatId: activeChatId,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ reply: 'An error occurred on the server.' });
  }
};

exports.handleLocalChat = async (req, res) => {
  const { message } = req.body || {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Missing "message" in request body.' });
  }

  try {
    const out = await getBotReply(message);
    return res.json({
      reply: out.reply || 'No reply.',
      citations: out.citations || [],
      confidence: out.confidence || '', // '' for greetings/small-talk → no badge
      confidenceReason: out.confidenceReason || '',
      isOutOfScope: out.isOutOfScope || false,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: 'An error occurred on the server.' });
  }
};
