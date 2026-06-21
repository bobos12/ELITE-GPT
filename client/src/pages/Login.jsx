import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Scale } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import '../auth/auth.css';

export default function Login() {
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = useMemo(() => location.state?.from || '/chat', [location.state]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data?.error || 'فشل تسجيل الدخول.'); return; }
      setSession(data.token, data.user);
      navigate(from, { replace: true });
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
          "العدل أساس الملك، والقانون درع المواطن"
        </div>
      </div>

      {/* Form panel */}
      <div className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-title">مرحباً بعودتك</div>
          <div className="auth-subtitle">سجّل دخولك للوصول إلى استشاراتك وسجل محادثاتك.</div>

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
              كلمة المرور
              <input
                className="auth-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />
            </label>

            {error && <div className="auth-error">{error}</div>}

            <button className="auth-button" disabled={isLoading}>
              {isLoading ? 'جارٍ تسجيل الدخول…' : 'تسجيل الدخول'}
            </button>
          </form>

          <div className="auth-footer">
            ليس لديك حساب؟{' '}
            <Link to="/signup">إنشاء حساب جديد</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
