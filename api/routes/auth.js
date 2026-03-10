const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

function issueToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('Missing JWT_SECRET');

  return jwt.sign(
    { email: user.email },
    secret,
    {
      subject: String(user._id),
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
}

router.post('/signup', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || typeof email !== 'string') return res.status(400).json({ error: 'Missing email.' });
  if (!password || typeof password !== 'string') return res.status(400).json({ error: 'Missing password.' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

  const existing = await User.findOne({ email: email.toLowerCase().trim() }).lean();
  if (existing) return res.status(409).json({ error: 'Email already in use.' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, passwordHash });
  const token = issueToken(user);
  return res.json({ token, user: { email: user.email, id: String(user._id) } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || typeof email !== 'string') return res.status(400).json({ error: 'Missing email.' });
  if (!password || typeof password !== 'string') return res.status(400).json({ error: 'Missing password.' });

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid email or password.' });

  const token = issueToken(user);
  return res.json({ token, user: { email: user.email, id: String(user._id) } });
});

module.exports = router;

