const bcrypt = require('bcryptjs');

const users = new Map();
const chats = new Map();
let nextUserId = 1;
let nextChatId = 1;
let nextDocId = 1;

// ── User ──────────────────────────────────────────────────────────────────────

exports.createUser = async (email, password) => {
  const existing = exports.findUserByEmail(email);
  if (existing) return null;
  const passwordHash = await bcrypt.hash(password, 12);
  const id = String(nextUserId++);
  const user = {
    id,
    email: email.toLowerCase(),
    passwordHash,
    chats: [],       // chat IDs
    documents: [],   // { id, title, templateId, fileName, pdfBuffer, createdAt }
    favorites: [],   // { id, content, savedAt }
  };
  users.set(id, user);
  return user;
};

exports.findUserByEmail = (email) => {
  for (const u of users.values()) {
    if (u.email === email.toLowerCase()) return u;
  }
  return null;
};

exports.findUserById = (id) => users.get(id) || null;

exports.verifyPassword = async (user, password) =>
  bcrypt.compare(password, user.passwordHash);

// ── Chat ──────────────────────────────────────────────────────────────────────

exports.createChat = (userId, title) => {
  const id = String(nextChatId++);
  const chat = {
    id,
    userId,
    title: title || 'محادثة جديدة',
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  chats.set(id, chat);
  const user = exports.findUserById(userId);
  if (user) user.chats.unshift(id);
  return chat;
};

exports.getUserChats = (userId) => {
  const user = exports.findUserById(userId);
  if (!user) return [];
  return user.chats
    .map(id => chats.get(id))
    .filter(Boolean)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
};

exports.getChat = (chatId) => chats.get(chatId) || null;

exports.updateChatTitle = (chatId, title) => {
  const chat = chats.get(chatId);
  if (!chat) return null;
  chat.title = String(title || 'محادثة جديدة').trim() || 'محادثة جديدة';
  chat.updatedAt = new Date();
  return chat;
};

exports.deleteChat = (chatId) => {
  const chat = chats.get(chatId);
  if (!chat) return false;
  const user = exports.findUserById(chat.userId);
  if (user) user.chats = user.chats.filter(id => id !== chatId);
  chats.delete(chatId);
  return true;
};

exports.addChatMessage = (chatId, role, content) => {
  const chat = chats.get(chatId);
  if (!chat) return null;
  const message = { id: String(Date.now()), role, content, createdAt: new Date() };
  chat.messages.push(message);
  chat.updatedAt = new Date();
  return message;
};

// ── Documents (in-memory) ─────────────────────────────────────────────────────

exports.getUserDocuments = (userId) => {
  const user = exports.findUserById(userId);
  if (!user) return [];
  return user.documents.map(d => ({
    id: d.id,
    title: d.title,
    templateId: d.templateId,
    createdAt: d.createdAt,
  }));
};

exports.addUserDocument = (userId, { title, templateId, fileName, pdfBuffer }) => {
  const user = exports.findUserById(userId);
  if (!user) return null;
  const id = String(nextDocId++);
  const doc = { id, title, templateId, fileName, pdfBuffer, createdAt: new Date() };
  user.documents.unshift(doc);
  if (user.documents.length > 50) user.documents.length = 50;
  return doc;
};

exports.getUserDocument = (userId, docId) => {
  const user = exports.findUserById(userId);
  if (!user) return null;
  return user.documents.find(d => d.id === docId) || null;
};

exports.deleteUserDocument = (userId, docId) => {
  const user = exports.findUserById(userId);
  if (!user) return false;
  const idx = user.documents.findIndex(d => d.id === docId);
  if (idx === -1) return false;
  user.documents.splice(idx, 1);
  return true;
};

// ── Favorites (in-memory) ─────────────────────────────────────────────────────

exports.getUserFavorites = (userId) => {
  const user = exports.findUserById(userId);
  if (!user) return [];
  return user.favorites;
};

exports.addUserFavorite = (userId, { content, preview }) => {
  const user = exports.findUserById(userId);
  if (!user) return null;
  const id = String(Date.now());
  if (user.favorites.some(f => f.id === id)) return null;
  const fav = { id, content, preview: preview || content.slice(0, 200), savedAt: new Date() };
  user.favorites.unshift(fav);
  if (user.favorites.length > 200) user.favorites.length = 200;
  return fav;
};

exports.removeUserFavorite = (userId, favId) => {
  const user = exports.findUserById(userId);
  if (!user) return false;
  const idx = user.favorites.findIndex(f => f.id === favId);
  if (idx === -1) return false;
  user.favorites.splice(idx, 1);
  return true;
};

// ── History (derived from chats) ──────────────────────────────────────────────

exports.getUserHistory = (userId, limit = 100) => {
  const userChats = exports.getUserChats(userId);
  const history = [];
  for (const chat of userChats) {
    const msgs = chat.messages || [];
    for (let i = 0; i < msgs.length - 1; i++) {
      if (msgs[i].role === 'user' && msgs[i + 1]?.role === 'assistant') {
        history.push({
          id: msgs[i].id,
          query: msgs[i].content,
          reply: msgs[i + 1].content,
          chatId: chat.id,
          chatTitle: chat.title,
          createdAt: msgs[i].createdAt,
        });
      }
    }
  }
  history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return history.slice(0, limit);
};
