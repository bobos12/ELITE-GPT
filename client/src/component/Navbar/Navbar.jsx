import { useEffect, useState } from 'react';
import './navbar.css';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

function initialsFromEmail(email) {
  if (!email) return 'U';
  const name = String(email).split('@')[0] || '';
  const parts = name.split(/[._-]+/).filter(Boolean);
  const chars = (parts.length ? parts : [name]).join('');
  const a = chars[0] || 'U';
  const b = chars[1] || '';
  return (a + b).toUpperCase();
}

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  return (
    <nav className={`luxury-navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="luxury-navbar-container">
        <Link to="/" className="luxury-navbar-brand" aria-label="Go to home">
          <div className="luxury-navbar-logo-container">
            <span className="luxury-navbar-logo">⚖️</span>
            <div className="logo-glow"></div>
          </div>
          <div className="brand-text">
            <h1 className="luxury-navbar-title">ELITE AI</h1>
            <span className="brand-tagline">Legal Intelligence</span>
          </div>
        </Link>

        <div className={`luxury-navbar-links ${menuOpen ? 'active' : ''}`}>
          <Link to="/#Home" className="luxury-navbar-link">
            <span>Home</span>
            <div className="link-glow"></div>
          </Link>
          <Link to="/#Features" className="luxury-navbar-link">
            <span>Features</span>
            <div className="link-glow"></div>
          </Link>
          <Link to="/#pricing" className="luxury-navbar-link">
            <span>Pricing</span>
            <div className="link-glow"></div>
          </Link>

          {!token ? (
            <>
              <Link to="/login" className="luxury-navbar-link">
                <span>Login</span>
                <div className="link-glow"></div>
              </Link>
              <button className="luxury-navbar-cta" onClick={() => navigate('/signup')} type="button">
                <span>Sign up</span>
                <div className="btn-shine"></div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="btn-arrow">
                  <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <Link to="/templates" className="luxury-navbar-link">
                <span>Templates</span>
                <div className="link-glow"></div>
              </Link>
              <Link to="/document-generator" className="luxury-navbar-link">
                <span>Document Generator</span>
                <div className="link-glow"></div>
              </Link>
              <button className="luxury-navbar-cta" onClick={() => navigate('/chat')} type="button">
                <span>Open Chat</span>
                <div className="btn-shine"></div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="btn-arrow">
                  <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="profile">
                <button
                  className="profile-button"
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                  title={user?.email || 'Profile'}
                >
                  <span className="profile-avatar">{initialsFromEmail(user?.email)}</span>
                </button>
                {profileOpen && (
                  <>
                    <button className="profile-backdrop" type="button" onClick={() => setProfileOpen(false)} aria-label="Close profile menu" />
                    <div className="profile-menu" role="menu">
                      <div className="profile-email">{user?.email}</div>
                      <button className="profile-item" type="button" onClick={() => navigate('/document-generator')}>
                        Document Generator
                      </button>
                      <button className="profile-item" type="button" onClick={() => navigate('/templates')}>
                        Legal Templates
                      </button>
                      <button className="profile-item" type="button" onClick={() => navigate('/account')}>
                        Account & History
                      </button>
                      <button className="profile-item" type="button" onClick={() => navigate('/kb')}>
                        Knowledge Base / FAQ
                      </button>
                      <button className="profile-item danger" type="button" onClick={logout}>
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <button
          className={`luxury-navbar-menu ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          type="button"
        >
          <span className="luxury-navbar-menu-line"></span>
          <span className="luxury-navbar-menu-line"></span>
          <span className="luxury-navbar-menu-line"></span>
        </button>
      </div>

      <div className={`mobile-overlay ${menuOpen ? 'active' : ''}`} onClick={() => setMenuOpen(false)}></div>
    </nav>
  );
};

export default Navbar;
