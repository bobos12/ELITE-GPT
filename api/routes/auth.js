const express = require('express');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail, verifyPassword } = require('../store');

const router = express.Router();

function issueToken(user) {
  const secret = process.env.JWT_SECRET || 'dev_secret';
  return jwt.sign(
    { email: user.email },
    secret,
    {
      subject: user.id,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
}

router.post('/signup', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || typeof email !== 'string') return res.status(400).json({ error: 'Missing email.' });
  if (!password || typeof password !== 'string') return res.status(400).json({ error: 'Missing password.' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

  const existing = findUserByEmail(email);
  if (existing) return res.status(409).json({ error: 'Email already in use.' });

  const user = await createUser(email, password);
  const token = issueToken(user);
  return res.json({ token, user: { email: user.email, id: user.id } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || typeof email !== 'string') return res.status(400).json({ error: 'Missing email.' });
  if (!password || typeof password !== 'string') return res.status(400).json({ error: 'Missing password.' });

  const user = findUserByEmail(email);
  if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

  const ok = await verifyPassword(user, password);
  if (!ok) return res.status(401).json({ error: 'Invalid email or password.' });

  const token = issueToken(user);
  return res.json({ token, user: { email: user.email, id: user.id } });
});

module.exports = router;
