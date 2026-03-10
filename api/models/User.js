const mongoose = require('mongoose');

const HistoryItemSchema = new mongoose.Schema(
  {
    query: { type: String, required: true },
    reply: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const ChatMessageSchema = new mongoose.Schema(
  {
    role: { type: String, required: true, enum: ['user', 'assistant', 'system'] },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const ChatSessionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    messages: { type: [ChatMessageSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const DocumentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    templateId: { type: String, required: true },
    fileName: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    history: { type: [HistoryItemSchema], default: [] },
    chats: { type: [ChatSessionSchema], default: [] },
    documents: { type: [DocumentSchema], default: [] }
  },
  { timestamps: true }
);

UserSchema.methods.addHistoryItem = async function addHistoryItem({ query, reply }) {
  this.history.unshift({ query, reply });
  const maxItems = Number(process.env.HISTORY_LIMIT || 200);
  if (this.history.length > maxItems) this.history.length = maxItems;
  await this.save();
};

UserSchema.methods.ensureChatsInitialized = async function ensureChatsInitialized() {
  if (Array.isArray(this.chats) && this.chats.length) return;
  if (!Array.isArray(this.history) || !this.history.length) return;

  const itemsOldestFirst = [...this.history].reverse();
  const messages = [];
  for (const h of itemsOldestFirst) {
    if (h?.query) messages.push({ role: 'user', content: h.query, createdAt: h.createdAt || new Date() });
    if (h?.reply) messages.push({ role: 'assistant', content: h.reply, createdAt: h.createdAt || new Date() });
  }

  this.chats.unshift({
    title: 'Previous chats',
    messages,
    createdAt: this.createdAt || new Date(),
    updatedAt: new Date()
  });
  await this.save();
};

UserSchema.methods.createChat = async function createChat({ title }) {
  const safeTitle = String(title || 'New chat').trim() || 'New chat';
  this.chats.unshift({ title: safeTitle, messages: [], createdAt: new Date(), updatedAt: new Date() });
  const maxItems = Number(process.env.CHATS_LIMIT || 50);
  if (this.chats.length > maxItems) this.chats.length = maxItems;
  await this.save();
  return this.chats[0];
};

UserSchema.methods.addChatMessage = async function addChatMessage({ chatId, role, content }) {
  const chat = (this.chats || []).find((c) => String(c._id) === String(chatId));
  if (!chat) return null;
  chat.messages.push({ role, content });
  chat.updatedAt = new Date();
  const maxMessages = Number(process.env.CHAT_MESSAGES_LIMIT || 200);
  if (chat.messages.length > maxMessages) chat.messages.splice(0, chat.messages.length - maxMessages);
  await this.save();
  return chat;
};

UserSchema.methods.addDocument = async function addDocument({ title, templateId, fileName }) {
  this.documents.unshift({ title, templateId, fileName });
  const maxItems = Number(process.env.DOCUMENTS_LIMIT || 50);
  if (this.documents.length > maxItems) this.documents.length = maxItems;
  await this.save();
};

module.exports = mongoose.model('User', UserSchema);
