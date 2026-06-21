import { useEffect, useState } from 'react';
import './navbar.css';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Scale } from 'lucide-react';

function initialsFromEmail(email) {
  if (!email) return 'U';
  const name = String(email).split('@')[0] || '';
  const parts = name.split(/[._-]+/).filter(Boolean);
  const chars = (parts.length ? parts : [name]).join('');
  return ((chars[0] || 'U') + (chars[1] || '')).toUpperCase();
}

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user, logout } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  return (
    <nav className={`elite-nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="elite-nav-inner">

        {/* Brand */}
        <Link to="/" className="elite-nav-brand" aria-label="ELITE Legal AI">
          <div className="elite-nav-icon"><Scale size={18} /></div>
          <div className="elite-nav-wordmark">
            <span className="elite-nav-name">ELITE</span>
            <span className="elite-nav-tagline">المستشار القانوني</span>
          </div>
        </Link>

        {/* Center links + mobile actions */}
        <div className={`elite-nav-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/#Home" className="elite-nav-link">الرئيسية</Link>
          <Link to="/#Features" className="elite-nav-link">المميزات</Link>
          <Link to="/#pricing" className="elite-nav-link">الأسعار</Link>
          {token && (
            <>
              <Link to="/templates" className="elite-nav-link">النماذج</Link>
              <Link to="/document-generator" className="elite-nav-link">المستندات</Link>
            </>
          )}
          <div className="elite-nav-mobile-actions">
            {!token ? (
              <>
                <Link to="/login" className="elite-nav-ghost">تسجيل الدخول</Link>
                <button className="elite-nav-cta" type="button" onClick={() => navigate('/signup')}>إنشاء حساب</button>
              </>
            ) : (
              <button className="elite-nav-cta" type="button" onClick={() => navigate('/chat')}>فتح المحادثة</button>
            )}
          </div>
        </div>

        {/* Desktop actions */}
        <div className="elite-nav-actions">
          {!token ? (
            <>
              <Link to="/login" className="elite-nav-ghost">تسجيل الدخول</Link>
              <button className="elite-nav-cta" type="button" onClick={() => navigate('/signup')}>ابدأ مجاناً</button>
            </>
          ) : (
            <>
              <button className="elite-nav-cta" type="button" onClick={() => navigate('/chat')}>
                فتح المحادثة
              </button>
              <div className="elite-nav-profile">
                <button
                  className="elite-nav-avatar"
                  type="button"
                  onClick={() => setProfileOpen(v => !v)}
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                  title={user?.email}
                >
                  {initialsFromEmail(user?.email)}
                </button>
                {profileOpen && (
                  <>
                    <button className="elite-nav-backdrop" type="button" onClick={() => setProfileOpen(false)} aria-label="Close" />
                    <div className="elite-nav-menu" role="menu">
                      <div className="elite-nav-menu-email">{user?.email}</div>
                      <button className="elite-nav-menu-item" type="button" onClick={() => navigate('/chat')}>المحادثات</button>
                      <button className="elite-nav-menu-item" type="button" onClick={() => navigate('/dashboard')}>لوحة التحكم</button>
                      <button className="elite-nav-menu-item" type="button" onClick={() => navigate('/templates')}>النماذج القانونية</button>
                      <button className="elite-nav-menu-item" type="button" onClick={() => navigate('/document-generator')}>منشئ المستندات</button>
                      <button className="elite-nav-menu-item" type="button" onClick={() => navigate('/account')}>الحساب والسجل</button>
                      <button className="elite-nav-menu-item" type="button" onClick={() => navigate('/kb')}>قاعدة المعرفة</button>
                      <button className="elite-nav-menu-item danger" type="button" onClick={logout}>تسجيل الخروج</button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Burger */}
        <button
          className={`elite-nav-burger ${menuOpen ? 'open' : ''}`}
          type="button"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>

      {menuOpen && (
        <div className="elite-nav-mobile-overlay open" onClick={() => setMenuOpen(false)} />
      )}
    </nav>
  );
};

export default Navbar;
