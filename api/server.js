require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const chatRoutes = require('./routes/chat');
const templateRoutes = require('./routes/templates');
const kbRoutes = require('./routes/kb');
const documentRoutes = require('./routes/documents');
const sttRoutes = require('./routes/stt');
const analyzeRoutes = require('./routes/analyze');

const app = express();

// ── Security & parsing ────────────────────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    if (process.env.NODE_ENV !== 'production') return cb(null, true);
    if (origin.endsWith('.vercel.app')) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false, limit: '2mb' }));

// ── Simple rate limiter (no extra dep) ────────────────────────────────────────
const hits = new Map();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 120;

app.use((req, res, next) => {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const entry = hits.get(key) || { count: 0, start: now };
  if (now - entry.start > RATE_WINDOW_MS) { entry.count = 0; entry.start = now; }
  entry.count++;
  hits.set(key, entry);
  if (entry.count > RATE_MAX) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }
  return next();
});

// ── Routes ─────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.use('/api/auth',      authRoutes);
app.use('/api/user',      userRoutes);
app.use('/api/chat',      chatRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/kb',        kbRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/stt',       sttRoutes);
app.use('/api/analyze',   analyzeRoutes);

// ── 404 handler ────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Not found.' }));

// ── Error handler ──────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('[server error]', err.message || err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal server error.' });
});

// ── Start ──────────────────────────────────────────────────────────────────────
if (require.main === module) {
  const PORT = Number(process.env.PORT) || 5000;
  app.listen(PORT, () => {
    console.log(`ELITE API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
