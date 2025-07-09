import './footer.css';
import {
  Linkedin,
  Twitter,
  Instagram,
} from 'lucide-react';

const Footer = () => {
  return (
    <footer className="luxury-footer">
      <div className="luxury-footer-container">
        <div className="luxury-footer-grid">

          <div className="luxury-footer-col">
            <div className="luxury-footer-brand">
              <span className="luxury-footer-logo">⚖️</span>
              <h3 className="luxury-footer-title">ELITE AI</h3>
            </div>
            <p className="luxury-footer-description">
              The gold standard in AI-powered legal intelligence.
            </p>
          </div>

          <div className="luxury-footer-col">
            <h4 className="luxury-footer-heading">Navigation</h4>
            <ul className="luxury-footer-links">
              <li><a href="#home">Home</a></li>
              <li><a href="#features">Features</a></li>
              <li><a href="#process">Process</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>

          <div className="luxury-footer-col">
            <h4 className="luxury-footer-heading">Legal</h4>
            <ul className="luxury-footer-links">
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Service</a></li>
              <li><a href="#cookies">Cookie Policy</a></li>
              <li><a href="#disclaimer">Disclaimer</a></li>
            </ul>
          </div>

          <div className="luxury-footer-col">
            <h4 className="luxury-footer-heading">Connect</h4>
            <div className="luxury-footer-social">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <Linkedin className="luxury-footer-social-icon" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <Twitter className="luxury-footer-social-icon" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <Instagram className="luxury-footer-social-icon" />
              </a>
            </div>
            <div className="luxury-footer-contact">
              <p>contact@eliteailaw.com</p>
              <p>+1 (555) 123-4567</p>
            </div>
          </div>
        </div>

        <div className="luxury-footer-bottom">
          <p>© {new Date().getFullYear()} ELITE AI. All rights reserved.</p>
          <p>Not a substitute for professional legal advice.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
