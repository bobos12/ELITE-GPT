// Shared server-side validation for signup. Arabic, field-specific error messages.

const path = require('path');
const fs = require('fs');

const GOVERNORATES = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'governorates.json'), 'utf8'));
  } catch {
    return [];
  }
})();
const GOVERNORATE_VALUES = new Set(GOVERNORATES.map(g => g.value));

const ACCOUNT_TYPES = new Set(['individual', 'lawyer']);

// Password policy (the "limitations" requested):
//  - 8 to 72 characters (72 = bcrypt's effective byte limit)
//  - at least one lowercase letter
//  - at least one uppercase letter
//  - at least one digit
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72;

function validateEmail(email) {
  const v = String(email || '').trim().toLowerCase();
  if (!v) return { ok: false, error: 'البريد الإلكتروني مطلوب.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { ok: false, error: 'صيغة البريد الإلكتروني غير صحيحة.' };
  if (v.length > 254) return { ok: false, error: 'البريد الإلكتروني طويل جداً.' };
  return { ok: true, value: v };
}

function validatePassword(password) {
  const v = String(password || '');
  if (!v) return { ok: false, error: 'كلمة المرور مطلوبة.' };
  if (v.length < PASSWORD_MIN) return { ok: false, error: `كلمة المرور يجب أن تكون ${PASSWORD_MIN} أحرف على الأقل.` };
  if (v.length > PASSWORD_MAX) return { ok: false, error: `كلمة المرور يجب ألا تتجاوز ${PASSWORD_MAX} حرفاً.` };
  if (!/[a-z]/.test(v)) return { ok: false, error: 'كلمة المرور يجب أن تحتوي على حرف إنجليزي صغير واحد على الأقل.' };
  if (!/[A-Z]/.test(v)) return { ok: false, error: 'كلمة المرور يجب أن تحتوي على حرف إنجليزي كبير واحد على الأقل.' };
  if (!/[0-9]/.test(v)) return { ok: false, error: 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل.' };
  return { ok: true, value: v };
}

function validateName(name, fieldLabel) {
  const v = String(name || '').trim();
  if (!v) return { ok: false, error: `${fieldLabel} مطلوب.` };
  if (v.length < 2) return { ok: false, error: `${fieldLabel} قصير جداً.` };
  if (v.length > 50) return { ok: false, error: `${fieldLabel} طويل جداً.` };
  return { ok: true, value: v };
}

// Egyptian mobile: optional +20 / 0020 / 0 prefix, then 1[0125] + 8 digits.
function validatePhone(phone) {
  const raw = String(phone || '').trim().replace(/[\s-]/g, '');
  if (!raw) return { ok: false, error: 'رقم الهاتف مطلوب.' };
  const m = raw.match(/^(?:\+20|0020|0)?(1[0125]\d{8})$/);
  if (!m) return { ok: false, error: 'رقم الهاتف غير صحيح. أدخل رقم هاتف مصري صحيح (مثال: 01012345678).' };
  return { ok: true, value: `0${m[1]}` }; // normalize to 0XXXXXXXXXX
}

function validateAccountType(accountType) {
  const v = String(accountType || '').trim().toLowerCase();
  if (!ACCOUNT_TYPES.has(v)) return { ok: false, error: 'نوع الحساب غير صحيح.' };
  return { ok: true, value: v };
}

function validateGovernorate(governorate) {
  const v = String(governorate || '').trim();
  if (!v) return { ok: false, error: 'المحافظة مطلوبة.' };
  if (!GOVERNORATE_VALUES.has(v)) return { ok: false, error: 'المحافظة غير صحيحة.' };
  return { ok: true, value: v };
}

// Validate the full signup payload. Returns { ok, error?, value? }.
function validateSignup(body = {}) {
  const checks = [
    ['firstName', validateName(body.firstName, 'الاسم الأول')],
    ['lastName', validateName(body.lastName, 'اسم العائلة')],
    ['email', validateEmail(body.email)],
    ['phone', validatePhone(body.phone)],
    ['accountType', validateAccountType(body.accountType)],
    ['governorate', validateGovernorate(body.governorate)],
    ['password', validatePassword(body.password)],
  ];
  const value = {};
  for (const [field, result] of checks) {
    if (!result.ok) return { ok: false, field, error: result.error };
    value[field] = result.value;
  }
  return { ok: true, value };
}

module.exports = {
  GOVERNORATES,
  ACCOUNT_TYPES: Array.from(ACCOUNT_TYPES),
  PASSWORD_MIN,
  PASSWORD_MAX,
  validateEmail,
  validatePassword,
  validateName,
  validatePhone,
  validateAccountType,
  validateGovernorate,
  validateSignup,
};
