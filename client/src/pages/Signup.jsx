import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scale, User, Briefcase, Check } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import '../auth/auth.css';

// Mirror of the server password policy (api/utils/validation.js).
const PW_RULES = [
  { id: 'len', label: '8 أحرف على الأقل', test: (v) => v.length >= 8 },
  { id: 'lower', label: 'حرف إنجليزي صغير (a-z)', test: (v) => /[a-z]/.test(v) },
  { id: 'upper', label: 'حرف إنجليزي كبير (A-Z)', test: (v) => /[A-Z]/.test(v) },
  { id: 'digit', label: 'رقم واحد على الأقل (0-9)', test: (v) => /[0-9]/.test(v) },
];

const EG_PHONE = /^(?:\+20|0020|0)?1[0125]\d{8}$/;

export default function Signup() {
  const { setSession } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    accountType: 'individual',
    governorate: '',
    password: '',
  });
  const [governorates, setGovernorates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');

  useEffect(() => {
    fetch('/api/auth/options')
      .then((r) => r.json())
      .then((d) => setGovernorates(Array.isArray(d.governorates) ? d.governorates : []))
      .catch(() => setGovernorates([]));
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const pwState = useMemo(() => PW_RULES.map((r) => ({ ...r, met: r.test(form.password) })), [form.password]);

  const isValid = useMemo(() => {
    return (
      form.firstName.trim().length >= 2 &&
      form.lastName.trim().length >= 2 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) &&
      EG_PHONE.test(form.phone.trim().replace(/[\s-]/g, '')) &&
      ['individual', 'lawyer'].includes(form.accountType) &&
      !!form.governorate &&
      pwState.every((r) => r.met)
    );
  }, [form, pwState]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldError('');
    if (!isValid) {
      setError('يُرجى تعبئة جميع الحقول بشكل صحيح.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'فشل إنشاء الحساب.');
        setFieldError(data?.field || '');
        return;
      }
      setSession(data.token, data.user);
      navigate('/chat', { replace: true });
    } catch {
      setError('تعذّر الاتصال بالخادم. حاول مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const invalidCls = (field) => (fieldError === field ? ' invalid' : '');

  return (
    <div className="auth-shell">
      {/* Brand panel */}
      <div className="auth-brand">
        <div className="auth-brand-logo"><Scale size={28} /></div>
        <div className="auth-brand-name">ELITE</div>
        <div className="auth-brand-tagline">المستشار القانوني الذكي</div>
        <div className="auth-brand-quote">
          "القانون المصري تراث راسخ وحضارة قائمة منذ آلاف السنين"
        </div>
      </div>

      {/* Form panel */}
      <div className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-title">إنشاء حساب</div>
          <div className="auth-subtitle">سجّل الآن للحصول على استشارات قانونية ذكية مدعومة بالذكاء الاصطناعي.</div>

          <form onSubmit={onSubmit} className="auth-form" noValidate>
            <div className="auth-row">
              <label className="auth-label">
                الاسم الأول
                <input
                  className={'auth-input' + invalidCls('firstName')}
                  value={form.firstName}
                  onChange={set('firstName')}
                  type="text"
                  autoComplete="given-name"
                  placeholder="محمد"
                  required
                />
              </label>
              <label className="auth-label">
                اسم العائلة
                <input
                  className={'auth-input' + invalidCls('lastName')}
                  value={form.lastName}
                  onChange={set('lastName')}
                  type="text"
                  autoComplete="family-name"
                  placeholder="أحمد"
                  required
                />
              </label>
            </div>

            <label className="auth-label">
              البريد الإلكتروني
              <input
                className={'auth-input' + invalidCls('email')}
                value={form.email}
                onChange={set('email')}
                type="email"
                autoComplete="email"
                placeholder="example@email.com"
                required
              />
            </label>

            <label className="auth-label">
              رقم الهاتف
              <input
                className={'auth-input' + invalidCls('phone')}
                value={form.phone}
                onChange={set('phone')}
                type="tel"
                autoComplete="tel"
                placeholder="01012345678"
                dir="ltr"
                required
              />
            </label>

            <div className="auth-label">
              نوع الحساب
              <div className="auth-segment">
                <button
                  type="button"
                  className={'auth-segment-option' + (form.accountType === 'individual' ? ' active' : '')}
                  onClick={() => setForm((f) => ({ ...f, accountType: 'individual' }))}
                >
                  <User size={16} /> فرد
                </button>
                <button
                  type="button"
                  className={'auth-segment-option' + (form.accountType === 'lawyer' ? ' active' : '')}
                  onClick={() => setForm((f) => ({ ...f, accountType: 'lawyer' }))}
                >
                  <Briefcase size={16} /> محامٍ / مهني
                </button>
              </div>
            </div>

            <label className="auth-label">
              المحافظة
              <select
                className={'auth-select' + invalidCls('governorate')}
                value={form.governorate}
                onChange={set('governorate')}
                required
              >
                <option value="" disabled>اختر المحافظة</option>
                {governorates.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </label>

            <label className="auth-label">
              كلمة المرور
              <input
                className={'auth-input' + invalidCls('password')}
                value={form.password}
                onChange={set('password')}
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                required
              />
            </label>

            <div className="auth-pw-rules">
              {pwState.map((r) => (
                <div key={r.id} className={'auth-pw-rule' + (r.met ? ' met' : '')}>
                  <span className="auth-pw-rule-dot">{r.met ? <Check size={9} strokeWidth={3} /> : ''}</span>
                  {r.label}
                </div>
              ))}
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button className="auth-button" disabled={isLoading || !isValid}>
              {isLoading ? 'جارٍ الإنشاء…' : 'إنشاء الحساب'}
            </button>
          </form>

          <div className="auth-footer">
            لديك حساب بالفعل؟{' '}
            <Link to="/login">تسجيل الدخول</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
