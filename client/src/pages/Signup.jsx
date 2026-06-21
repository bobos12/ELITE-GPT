import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scale } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import '../auth/auth.css';

export default function Signup() {
  const { setSession } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data?.error || 'فشل إنشاء الحساب.'); return; }
      setSession(data.token, data.user);
      navigate('/chat', { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

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

          <form onSubmit={onSubmit} className="auth-form">
            <label className="auth-label">
              البريد الإلكتروني
              <input
                className="auth-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                placeholder="example@email.com"
                required
              />
            </label>
            <label className="auth-label">
              كلمة المرور <span style={{ fontWeight: 400, color: 'var(--stone-500)' }}>(8 أحرف على الأقل)</span>
              <input
                className="auth-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                minLength={8}
                required
              />
            </label>

            {error && <div className="auth-error">{error}</div>}

            <button className="auth-button" disabled={isLoading}>
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
