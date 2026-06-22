const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  findUserById,
  getUserHistory,
  getUserFavorites,
  addUserFavorite,
  removeUserFavorite,
} = require('../store');

const router = express.Router();

// GET /api/user/me
router.get('/me', requireAuth, (req, res) => {
  const user = findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  return res.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    accountType: user.accountType,
    governorate: user.governorate,
  });
});

// GET /api/user/history
router.get('/history', requireAuth, (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 200);
  const history = getUserHistory(req.user.id, limit);
  return res.json({ history });
});

// DELETE /api/user/history — clear all (not persisted, just responds ok)
router.delete('/history', requireAuth, (req, res) => {
  return res.json({ ok: true });
});

// DELETE /api/user/history/:id — not needed for in-memory but kept for compat
router.delete('/history/:id', requireAuth, (req, res) => {
  return res.json({ ok: true });
});

// ── Favorites ─────────────────────────────────────────────────────────────────

// GET /api/user/favorites
router.get('/favorites', requireAuth, (req, res) => {
  const favorites = getUserFavorites(req.user.id);
  return res.json({ favorites });
});

// POST /api/user/favorites
router.post('/favorites', requireAuth, (req, res) => {
  const { content, preview } = req.body || {};
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Missing content.' });
  }
  const fav = addUserFavorite(req.user.id, { content, preview });
  if (!fav) return res.status(409).json({ error: 'Already saved.' });
  return res.json({ favorite: fav });
});

// DELETE /api/user/favorites/:id
router.delete('/favorites/:id', requireAuth, (req, res) => {
  const ok = removeUserFavorite(req.user.id, req.params.id);
  if (!ok) return res.status(404).json({ error: 'Favorite not found.' });
  return res.json({ ok: true });
});

module.exports = router;
