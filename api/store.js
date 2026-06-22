// Data store backed by SQLite (better-sqlite3) via ./db/database.
// The public API mirrors the previous file-based store so routes/controllers are unchanged.

const bcrypt = require('bcryptjs');
const { db, nextCounter } = require('./db/database');

// ── Row mappers ───────────────────────────────────────────────────────────────
function rowToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    accountType: row.account_type,
    governorate: row.governorate,
    createdAt: row.created_at ? new Date(row.created_at) : null,
  };
}

function rowToChat(row, messages = []) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    messages,
    createdAt: row.created_at ? new Date(row.created_at) : null,
    updatedAt: row.updated_at ? new Date(row.updated_at) : null,
  };
}

function rowToMessage(row) {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at ? new Date(row.created_at) : null,
  };
}

// Public-safe user (never expose the password hash).
function toSafeUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

// ── Prepared statements ─────────────────────────────────────────────────────
const stmt = {
  insertUser: db.prepare(`
    INSERT INTO users (id, email, password_hash, first_name, last_name, phone, account_type, governorate, created_at)
    VALUES (@id, @email, @password_hash, @first_name, @last_name, @phone, @account_type, @governorate, @created_at)
  `),
  userByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
  userById: db.prepare('SELECT * FROM users WHERE id = ?'),

  insertChat: db.prepare('INSERT INTO chats (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'),
  chatById: db.prepare('SELECT * FROM chats WHERE id = ?'),
  chatsByUser: db.prepare('SELECT * FROM chats WHERE user_id = ? ORDER BY updated_at DESC'),
  updateChatTitle: db.prepare('UPDATE chats SET title = ?, updated_at = ? WHERE id = ?'),
  touchChat: db.prepare('UPDATE chats SET updated_at = ? WHERE id = ?'),
  deleteChat: db.prepare('DELETE FROM chats WHERE id = ?'),

  messagesByChat: db.prepare('SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC'),
  insertMessage: db.prepare('INSERT INTO messages (id, chat_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'),

  docsByUser: db.prepare('SELECT id, title, template_id, created_at FROM documents WHERE user_id = ? ORDER BY created_at DESC'),
  insertDoc: db.prepare('INSERT INTO documents (id, user_id, title, template_id, file_name, pdf_buffer, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'),
  docById: db.prepare('SELECT * FROM documents WHERE id = ? AND user_id = ?'),
  deleteDoc: db.prepare('DELETE FROM documents WHERE id = ? AND user_id = ?'),

  favsByUser: db.prepare('SELECT * FROM favorites WHERE user_id = ? ORDER BY saved_at DESC'),
  insertFav: db.prepare('INSERT INTO favorites (id, user_id, content, preview, saved_at) VALUES (?, ?, ?, ?, ?)'),
  deleteFav: db.prepare('DELETE FROM favorites WHERE id = ? AND user_id = ?'),
};

// ── User ──────────────────────────────────────────────────────────────────────

exports.createUser = async ({ email, password, firstName = '', lastName = '', phone = '', accountType = 'individual', governorate = '' }) => {
  const normalizedEmail = String(email || '').toLowerCase().trim();
  if (exports.findUserByEmail(normalizedEmail)) return null;

  const passwordHash = await bcrypt.hash(password, 12);
  const id = nextCounter('user');
  stmt.insertUser.run({
    id,
    email: normalizedEmail,
    password_hash: passwordHash,
    first_name: firstName,
    last_name: lastName,
    phone,
    account_type: accountType,
    governorate,
    created_at: new Date().toISOString(),
  });
  return rowToUser(stmt.userById.get(id));
};

exports.findUserByEmail = (email) => rowToUser(stmt.userByEmail.get(String(email || '').toLowerCase().trim()));

exports.findUserById = (id) => rowToUser(stmt.userById.get(String(id)));

exports.verifyPassword = async (user, password) => bcrypt.compare(password, user.passwordHash);

exports.toSafeUser = toSafeUser;

// ── Chat ──────────────────────────────────────────────────────────────────────

exports.createChat = (userId, title) => {
  const id = nextCounter('chat');
  const now = new Date().toISOString();
  const safeTitle = String(title || 'محادثة جديدة').trim() || 'محادثة جديدة';
  stmt.insertChat.run(id, String(userId), safeTitle, now, now);
  return rowToChat(stmt.chatById.get(id), []);
};

exports.getUserChats = (userId) => stmt.chatsByUser.all(String(userId)).map(r => rowToChat(r, []));

exports.getChat = (chatId) => {
  const row = stmt.chatById.get(String(chatId));
  if (!row) return null;
  const messages = stmt.messagesByChat.all(String(chatId)).map(rowToMessage);
  return rowToChat(row, messages);
};

exports.updateChatTitle = (chatId, title) => {
  const safeTitle = String(title || 'محادثة جديدة').trim() || 'محادثة جديدة';
  const now = new Date().toISOString();
  const res = stmt.updateChatTitle.run(safeTitle, now, String(chatId));
  if (res.changes === 0) return null;
  return rowToChat(stmt.chatById.get(String(chatId)), []);
};

exports.deleteChat = (chatId) => stmt.deleteChat.run(String(chatId)).changes > 0;

exports.addChatMessage = (chatId, role, content) => {
  const chat = stmt.chatById.get(String(chatId));
  if (!chat) return null;
  const now = new Date().toISOString();
  const id = String(Date.now()) + Math.random().toString(36).slice(2, 6);
  stmt.insertMessage.run(id, String(chatId), role, content, now);
  stmt.touchChat.run(now, String(chatId));
  return { id, role, content, createdAt: new Date(now) };
};

// ── Documents ───────────────────────────────────────────────────────────────

exports.getUserDocuments = (userId) =>
  stmt.docsByUser.all(String(userId)).map(d => ({
    id: d.id,
    title: d.title,
    templateId: d.template_id,
    createdAt: d.created_at ? new Date(d.created_at) : null,
  }));

exports.addUserDocument = (userId, { title, templateId, fileName, pdfBuffer }) => {
  if (!exports.findUserById(userId)) return null;
  const id = nextCounter('doc');
  const now = new Date().toISOString();
  stmt.insertDoc.run(id, String(userId), title, templateId, fileName, pdfBuffer || null, now);
  return { id, title, templateId, fileName, pdfBuffer, createdAt: new Date(now) };
};

exports.getUserDocument = (userId, docId) => {
  const d = stmt.docById.get(String(docId), String(userId));
  if (!d) return null;
  return {
    id: d.id,
    title: d.title,
    templateId: d.template_id,
    fileName: d.file_name,
    pdfBuffer: d.pdf_buffer || null,
    createdAt: d.created_at ? new Date(d.created_at) : null,
  };
};

exports.deleteUserDocument = (userId, docId) => stmt.deleteDoc.run(String(docId), String(userId)).changes > 0;

// ── Favorites ───────────────────────────────────────────────────────────────

exports.getUserFavorites = (userId) =>
  stmt.favsByUser.all(String(userId)).map(f => ({
    id: f.id,
    content: f.content,
    preview: f.preview,
    savedAt: f.saved_at ? new Date(f.saved_at) : null,
  }));

exports.addUserFavorite = (userId, { content, preview }) => {
  if (!exports.findUserById(userId)) return null;
  const id = String(Date.now());
  const savedAt = new Date().toISOString();
  stmt.insertFav.run(id, String(userId), content, preview || content.slice(0, 200), savedAt);
  return { id, content, preview: preview || content.slice(0, 200), savedAt: new Date(savedAt) };
};

exports.removeUserFavorite = (userId, favId) => stmt.deleteFav.run(String(favId), String(userId)).changes > 0;

// ── History (derived from chats) ──────────────────────────────────────────────

exports.getUserHistory = (userId, limit = 100) => {
  const userChats = exports.getUserChats(userId);
  const history = [];
  for (const chatMeta of userChats) {
    const chat = exports.getChat(chatMeta.id);
    const msgs = chat?.messages || [];
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

// ── Seed user from env vars (survives cold starts on ephemeral hosts) ─────────
(function seedFromEnv() {
  const email = (process.env.SEED_EMAIL || '').trim().toLowerCase();
  const hash = (process.env.SEED_PASSWORD_HASH || '').trim();
  if (!email || !hash) return;
  if (exports.findUserByEmail(email)) return;
  stmt.insertUser.run({
    id: 'seed-1',
    email,
    password_hash: hash,
    first_name: 'حساب',
    last_name: 'تجريبي',
    phone: '',
    account_type: 'individual',
    governorate: '',
    created_at: new Date().toISOString(),
  });
})();
