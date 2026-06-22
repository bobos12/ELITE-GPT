const express = require('express');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail, verifyPassword, toSafeUser } = require('../store');
const { validateSignup, validatePassword, GOVERNORATES, ACCOUNT_TYPES } = require('../utils/validation');

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

// Public: signup form options (governorates + account types).
router.get('/options', (req, res) => {
  return res.json({ governorates: GOVERNORATES, accountTypes: ACCOUNT_TYPES });
});

router.post('/signup', async (req, res) => {
  const result = validateSignup(req.body || {});
  if (!result.ok) {
    return res.status(400).json({ error: result.error, field: result.field });
  }

  const { email, password, firstName, lastName, phone, accountType, governorate } = result.value;

  if (findUserByEmail(email)) {
    return res.status(409).json({ error: 'البريد الإلكتروني مستخدم بالفعل.', field: 'email' });
  }

  const user = await createUser({ email, password, firstName, lastName, phone, accountType, governorate });
  if (!user) {
    return res.status(409).json({ error: 'تعذّر إنشاء الحساب. حاول مرة أخرى.' });
  }

  const token = issueToken(user);
  return res.json({ token, user: toSafeUser(user) });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || typeof email !== 'string') return res.status(400).json({ error: 'البريد الإلكتروني مطلوب.', field: 'email' });
  if (!password || typeof password !== 'string') return res.status(400).json({ error: 'كلمة المرور مطلوبة.', field: 'password' });

  const user = findUserByEmail(email);
  if (!user) return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' });

  const ok = await verifyPassword(user, password);
  if (!ok) return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' });

  const token = issueToken(user);
  return res.json({ token, user: toSafeUser(user) });
});

module.exports = router;
