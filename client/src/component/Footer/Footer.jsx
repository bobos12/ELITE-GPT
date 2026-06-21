import './footer.css';
import { Scale, Linkedin, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer-root">
      {/* Top CTA band */}
      <div className="footer-cta-band">
        <div className="footer-cta-inner">
          <div className="footer-cta-text">
            <h3 className="footer-cta-title">ابدأ استشارتك القانونية الآن</h3>
            <p className="footer-cta-sub">انضم إلى آلاف المستخدمين الذين يثقون في ELITE لحماية حقوقهم</p>
          </div>
          <Link to="/signup" className="footer-cta-btn">
            ابدأ مجاناً
          </Link>
        </div>
      </div>

      <div className="footer-inner">
        <div className="footer-grid">

          {/* Brand column */}
          <div className="footer-col footer-col--brand">
            <div className="footer-brand">
              <div className="footer-brand-icon"><Scale size={18} /></div>
              <span className="footer-brand-name">ELITE</span>
            </div>
            <p className="footer-desc">
              المستشار القانوني الذكي للقانون المصري. دقة لا مثيل لها، سرعة فائقة، وسرية مطلقة.
            </p>
            <div className="footer-contact-list">
              <div className="footer-contact-item">
                <Mail size={13} />
                <span>contact@eliteailaw.com</span>
              </div>
              <div className="footer-contact-item">
                <Phone size={13} />
                <span>+20 (2) 123-4567</span>
              </div>
              <div className="footer-contact-item">
                <MapPin size={13} />
                <span>القاهرة، مصر</span>
              </div>
            </div>
            <div className="footer-social">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="footer-social-link">
                <Linkedin size={15} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="footer-social-link">
                <Twitter size={15} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="footer-social-link">
                <Instagram size={15} />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div className="footer-col">
            <h4 className="footer-col-title">المنصة</h4>
            <ul className="footer-links">
              <li><a href="#Home">الرئيسية</a></li>
              <li><a href="#Features">المميزات</a></li>
              <li><a href="#pricing">الأسعار</a></li>
              <li><a href="#testimonials">آراء العملاء</a></li>
              <li><a href="#faq">الأسئلة الشائعة</a></li>
            </ul>
          </div>

          {/* Services */}
          <div className="footer-col">
            <h4 className="footer-col-title">الخدمات</h4>
            <ul className="footer-links">
              <li><Link to="/chat">الاستشارة القانونية</Link></li>
              <li><Link to="/templates">النماذج القانونية</Link></li>
              <li><Link to="/document-generator">منشئ الوثائق</Link></li>
              <li><Link to="/kb">قاعدة المعرفة</Link></li>
              <li><Link to="/dashboard">لوحة التحكم</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="footer-col">
            <h4 className="footer-col-title">قانوني</h4>
            <ul className="footer-links">
              <li><a href="#privacy">سياسة الخصوصية</a></li>
              <li><a href="#terms">شروط الاستخدام</a></li>
              <li><a href="#cookies">سياسة الكوكيز</a></li>
              <li><a href="#disclaimer">إخلاء المسؤولية</a></li>
            </ul>
          </div>

        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-brand">
            <div className="footer-bottom-icon"><Scale size={14} /></div>
            <span>© {year} ELITE AI. جميع الحقوق محفوظة.</span>
          </div>
          <p className="footer-disclaimer">
            هذه المنصة أداة مساعدة ولا تُعدّ استشارة قانونية متخصصة.
          </p>
        </div>
      </div>
    </footer>
  );
}
