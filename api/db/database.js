// SQLite database layer (better-sqlite3).
// Zero external setup: the database file is created automatically on first run.
// On first boot it migrates any existing storage/users.json into SQLite so no data is lost.

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const STORAGE_DIR = path.join(__dirname, '..', 'storage');
// On Vercel/serverless the bundle dir is read-only — fall back to /tmp there.
function resolveDbPath() {
  const preferred = path.join(STORAGE_DIR, 'elite.db');
  try {
    if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });
    fs.accessSync(STORAGE_DIR, fs.constants.W_OK);
    return preferred;
  } catch {
    const tmp = path.join(require('os').tmpdir(), 'elite.db');
    return tmp;
  }
}

const DB_PATH = process.env.DB_PATH || resolveDbPath();

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ──────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    first_name    TEXT NOT NULL DEFAULT '',
    last_name     TEXT NOT NULL DEFAULT '',
    phone         TEXT NOT NULL DEFAULT '',
    account_type  TEXT NOT NULL DEFAULT 'individual',
    governorate   TEXT NOT NULL DEFAULT '',
    created_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS chats (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL,
    title      TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id         TEXT PRIMARY KEY,
    chat_id    TEXT NOT NULL,
    role       TEXT NOT NULL,
    content    TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS documents (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    title       TEXT NOT NULL,
    template_id TEXT NOT NULL,
    file_name   TEXT NOT NULL,
    pdf_buffer  BLOB,
    created_at  TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id       TEXT PRIMARY KEY,
    user_id  TEXT NOT NULL,
    content  TEXT NOT NULL,
    preview  TEXT NOT NULL DEFAULT '',
    saved_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS counters (
    name  TEXT PRIMARY KEY,
    value INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_chats_user     ON chats(user_id);
  CREATE INDEX IF NOT EXISTS idx_messages_chat  ON messages(chat_id);
  CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
  CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
`);

// ── Counters (numeric, human-readable ids matching the legacy store) ──────────
const _getCounter = db.prepare('SELECT value FROM counters WHERE name = ?');
const _setCounter = db.prepare(
  'INSERT INTO counters(name, value) VALUES(?, ?) ON CONFLICT(name) DO UPDATE SET value = excluded.value'
);

function initCounter(name, value) {
  if (!_getCounter.get(name)) _setCounter.run(name, value);
}

function nextCounter(name) {
  const row = _getCounter.get(name);
  const current = row ? row.value : 1;
  _setCounter.run(name, current + 1);
  return String(current);
}

initCounter('user', 1);
initCounter('chat', 1);
initCounter('doc', 1);

// ── One-time migration from legacy storage/users.json ─────────────────────────
function migrateLegacyJson() {
  const already = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  if (already > 0) return;

  const legacyPath = path.join(STORAGE_DIR, 'users.json');
  if (!fs.existsSync(legacyPath)) return;

  let data;
  try {
    data = JSON.parse(fs.readFileSync(legacyPath, 'utf8'));
  } catch {
    return;
  }
  if (!data || !Array.isArray(data.users)) return;

  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, first_name, last_name, phone, account_type, governorate, created_at)
    VALUES (@id, @email, @password_hash, @first_name, @last_name, @phone, @account_type, @governorate, @created_at)
  `);
  const insertChat = db.prepare(`
    INSERT INTO chats (id, user_id, title, created_at, updated_at)
    VALUES (@id, @user_id, @title, @created_at, @updated_at)
  `);
  const insertMessage = db.prepare(`
    INSERT INTO messages (id, chat_id, role, content, created_at)
    VALUES (@id, @chat_id, @role, @content, @created_at)
  `);
  const insertDoc = db.prepare(`
    INSERT INTO documents (id, user_id, title, template_id, file_name, pdf_buffer, created_at)
    VALUES (@id, @user_id, @title, @template_id, @file_name, @pdf_buffer, @created_at)
  `);
  const insertFav = db.prepare(`
    INSERT INTO favorites (id, user_id, content, preview, saved_at)
    VALUES (@id, @user_id, @content, @preview, @saved_at)
  `);

  const now = new Date().toISOString();

  const run = db.transaction(() => {
    for (const u of data.users) {
      insertUser.run({
        id: String(u.id),
        email: String(u.email || '').toLowerCase(),
        password_hash: u.passwordHash || '',
        first_name: u.firstName || '',
        last_name: u.lastName || '',
        phone: u.phone || '',
        account_type: u.accountType || 'individual',
        governorate: u.governorate || '',
        created_at: u.createdAt || now,
      });
      for (const d of u.documents || []) {
        insertDoc.run({
          id: String(d.id),
          user_id: String(u.id),
          title: d.title || '',
          template_id: d.templateId || '',
          file_name: d.fileName || '',
          pdf_buffer: d.pdfBuffer ? Buffer.from(d.pdfBuffer, 'base64') : null,
          created_at: d.createdAt || now,
        });
      }
      for (const f of u.favorites || []) {
        insertFav.run({
          id: String(f.id),
          user_id: String(u.id),
          content: f.content || '',
          preview: f.preview || '',
          saved_at: f.savedAt || now,
        });
      }
    }

    for (const c of data.chats || []) {
      insertChat.run({
        id: String(c.id),
        user_id: String(c.userId),
        title: c.title || 'محادثة جديدة',
        created_at: c.createdAt || now,
        updated_at: c.updatedAt || now,
      });
      for (const m of c.messages || []) {
        insertMessage.run({
          id: String(m.id),
          chat_id: String(c.id),
          role: m.role || 'user',
          content: m.content || '',
          created_at: m.createdAt || now,
        });
      }
    }

    if (data.nextUserId) _setCounter.run('user', Number(data.nextUserId));
    if (data.nextChatId) _setCounter.run('chat', Number(data.nextChatId));
    if (data.nextDocId) _setCounter.run('doc', Number(data.nextDocId));
  });

  try {
    run();
    // Archive the legacy file so it isn't re-imported or confused for the source of truth.
    fs.renameSync(legacyPath, path.join(STORAGE_DIR, 'users.json.migrated'));
    console.log('[db] Migrated legacy users.json into SQLite.');
  } catch (err) {
    console.error('[db] Legacy migration failed:', err.message);
  }
}

migrateLegacyJson();

module.exports = { db, nextCounter, DB_PATH };
