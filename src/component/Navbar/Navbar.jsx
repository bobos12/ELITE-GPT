import  { useState, useEffect } from 'react';
import './navbar.css';
import { useNavigate } from 'react-router-dom';
const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`luxury-navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="luxury-navbar-container">
        <div className="luxury-navbar-brand">
          <div className="luxury-navbar-logo-container">
            <span className="luxury-navbar-logo">⚖️</span>
            <div className="logo-glow"></div>
          </div>
          <div className="brand-text">
            <h1 className="luxury-navbar-title">ELITE AI</h1>
            <span className="brand-tagline">Legal Intelligence</span>
          </div>
        </div>
        
        <div className={`luxury-navbar-links ${menuOpen ? 'active' : ''}`}>
          <a href="#Home" className="luxury-navbar-link">
            <span>Home</span>
            <div className="link-glow"></div>
          </a>
          <a href="#Features" className="luxury-navbar-link">
            <span>Features</span>
            <div className="link-glow"></div>
          </a>    
          <a href="#pricing" className="luxury-navbar-link">
            <span>Pricing</span>
            <div className="link-glow"></div>
          </a> 
          <button className="luxury-navbar-cta"
            onClick={() => navigate('/chat')}
          >
            <span>Start Consultation</span>
            <div className="btn-shine"></div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="btn-arrow">
              <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        
        <button 
          className={`luxury-navbar-menu ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className="luxury-navbar-menu-line"></span>
          <span className="luxury-navbar-menu-line"></span>
          <span className="luxury-navbar-menu-line"></span>
        </button>
      </div>
      
      {/* Mobile overlay */}
      <div className={`mobile-overlay ${menuOpen ? 'active' : ''}`} onClick={() => setMenuOpen(false)}></div>
    </nav>
  );
};

export default Navbar;