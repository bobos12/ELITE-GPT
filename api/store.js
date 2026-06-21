const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'storage', 'users.json');

const users = new Map();
const chats = new Map();
let nextUserId = 1;
let nextChatId = 1;
let nextDocId = 1;

function computeNextIdFromStrings(arr) {
  const nums = (arr || []).map(String).map(s => parseInt(s, 10)).filter(n => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return max + 1;
}

function ensureStorageDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function saveToDisk() {
  try {
    ensureStorageDir();
    const data = {
      users: Array.from(users.values()).map(u => ({
        id: u.id,
        email: u.email,
        passwordHash: u.passwordHash,
        chats: u.chats || [],
        documents: (u.documents || []).map(d => ({
          id: d.id,
          title: d.title,
          templateId: d.templateId,
          fileName: d.fileName,
          createdAt: d.createdAt ? (d.createdAt.toISOString ? d.createdAt.toISOString() : d.createdAt) : null,
          pdfBuffer: d.pdfBuffer ? d.pdfBuffer.toString('base64') : null,
        })),
        favorites: (u.favorites || []).map(f => ({
          id: f.id,
          content: f.content,
          preview: f.preview,
          savedAt: f.savedAt ? (f.savedAt.toISOString ? f.savedAt.toISOString() : f.savedAt) : null,
        })),
      })),
      chats: Array.from(chats.values()).map(c => ({
        id: c.id,
        userId: c.userId,
        title: c.title,
        messages: (c.messages || []).map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt ? (m.createdAt.toISOString ? m.createdAt.toISOString() : m.createdAt) : null,
        })),
        createdAt: c.createdAt ? (c.createdAt.toISOString ? c.createdAt.toISOString() : c.createdAt) : null,
        updatedAt: c.updatedAt ? (c.updatedAt.toISOString ? c.updatedAt.toISOString() : c.updatedAt) : null,
      })),
      nextUserId,
      nextChatId,
      nextDocId,
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save users to disk:', err);
  }
}

function loadFromDisk() {
  try {
    if (!fs.existsSync(DATA_FILE)) return;
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    if (!raw) return;
    const data = JSON.parse(raw);
    (data.users || []).forEach(u => {
      const user = {
        id: u.id,
        email: u.email,
        passwordHash: u.passwordHash,
        chats: u.chats || [],
        documents: (u.documents || []).map(d => ({
          id: d.id,
          title: d.title,
          templateId: d.templateId,
          fileName: d.fileName,
          createdAt: d.createdAt ? new Date(d.createdAt) : new Date(),
          pdfBuffer: d.pdfBuffer ? Buffer.from(d.pdfBuffer, 'base64') : null,
        })),
        favorites: (u.favorites || []).map(f => ({
          id: f.id,
          content: f.content,
          preview: f.preview,
          savedAt: f.savedAt ? new Date(f.savedAt) : null,
        })),
      };
      users.set(user.id, user);
    });
    (data.chats || []).forEach(c => {
      const chat = {
        id: c.id,
        userId: c.userId,
        title: c.title,
        messages: (c.messages || []).map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
        })),
        createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
        updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
      };
      chats.set(chat.id, chat);
    });
    nextUserId = data.nextUserId || computeNextIdFromStrings(Array.from(users.keys()));
    nextChatId = data.nextChatId || computeNextIdFromStrings(Array.from(chats.keys()));
    const docIds = [];
    for (const u of users.values()) {
      for (const d of (u.documents || [])) {
        if (d && d.id) docIds.push(d.id);
      }
    }
    nextDocId = data.nextDocId || (docIds.length ? computeNextIdFromStrings(docIds) : 1);
  } catch (err) {
    console.error('Failed to load users from disk:', err);
  }
}

loadFromDisk();

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
  saveToDisk();
  return user;
};

exports.findUserByEmail = (email) => {
  for (const u of users.values()) {
    if (u.email === String(email || '').toLowerCase()) return u;
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
  saveToDisk();
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
  saveToDisk();
  return chat;
};

exports.deleteChat = (chatId) => {
  const chat = chats.get(chatId);
  if (!chat) return false;
  const user = exports.findUserById(chat.userId);
  if (user) user.chats = user.chats.filter(id => id !== chatId);
  chats.delete(chatId);
  saveToDisk();
  return true;
};

exports.addChatMessage = (chatId, role, content) => {
  const chat = chats.get(chatId);
  if (!chat) return null;
  const message = { id: String(Date.now()), role, content, createdAt: new Date() };
  chat.messages.push(message);
  chat.updatedAt = new Date();
  saveToDisk();
  return message;
};

// ── Documents (persisted) ─────────────────────────────────────────────────────

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
  saveToDisk();
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
  saveToDisk();
  return true;
};

// ── Favorites (persisted) ─────────────────────────────────────────────────────

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
  saveToDisk();
  return fav;
};

exports.removeUserFavorite = (userId, favId) => {
  const user = exports.findUserById(userId);
  if (!user) return false;
  const idx = user.favorites.findIndex(f => f.id === favId);
  if (idx === -1) return false;
  user.favorites.splice(idx, 1);
  saveToDisk();
  return true;
};

// ── Seed user from env vars (survives every cold start) ──────────────────────
// Set SEED_EMAIL + SEED_PASSWORD_HASH in Vercel env vars to guarantee a login
// always works, even after the store resets.
;(function seedFromEnv() {
  const email = (process.env.SEED_EMAIL || '').trim().toLowerCase();
  const hash  = (process.env.SEED_PASSWORD_HASH || '').trim();
  if (!email || !hash) return;
  if (exports.findUserByEmail(email)) return;
  const id = 'seed-1';
  users.set(id, { id, email, passwordHash: hash, chats: [], documents: [], favorites: [] });
  saveToDisk();
})();

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
