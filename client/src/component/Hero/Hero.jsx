import { useEffect, useRef } from 'react';
import './hero.css';
import { useNavigate } from 'react-router-dom';
import { Scale, ArrowLeft, Sparkles, Shield, Zap, Clock } from 'lucide-react';

const DEMO_MSGS = [
  { role: 'ai',   text: 'مرحباً! أنا مساعدك القانوني الذكي المتخصص في القانون المصري. كيف يمكنني مساعدتك اليوم؟' },
  { role: 'user', text: 'ما هي إجراءات تأسيس شركة ذات مسؤولية محدودة في مصر؟' },
  { role: 'ai',   text: 'وفقاً لقانون الشركات المصري رقم 159 لسنة 1981 وتعديلاته، تحتاج إلى: ❶ تحديد اسم الشركة والحصول على الموافقة ❷ إيداع رأس المال في بنك معتمد ❸ التوثيق لدى الشهر العقاري ❹ التسجيل في السجل التجاري...' },
];

export default function Hero() {
  const navigate = useNavigate();
  const orb1Ref = useRef(null);
  const orb2Ref = useRef(null);

  useEffect(() => {
    let raf;
    let t = 0;
    const animate = () => {
      t += 0.003;
      if (orb1Ref.current) {
        orb1Ref.current.style.transform =
          `translate(${Math.sin(t) * 30}px, ${Math.cos(t * 0.7) * 20}px)`;
      }
      if (orb2Ref.current) {
        orb2Ref.current.style.transform =
          `translate(${Math.cos(t * 0.8) * 25}px, ${Math.sin(t * 1.1) * 18}px)`;
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section className="hero-root" id="Home">
      {/* Animated background */}
      <div className="hero-bg" aria-hidden="true">
        <div className="hero-orb hero-orb-1" ref={orb1Ref} />
        <div className="hero-orb hero-orb-2" ref={orb2Ref} />
        <div className="hero-grid-pattern" />
        <div className="hero-noise" />
      </div>

      <div className="hero-inner">

        {/* ── Text Column ── */}
        <div className="hero-text">

          <div className="hero-badge">
            <Sparkles size={12} />
            <span>مساعد قانوني ذكي مدعوم بالذكاء الاصطناعي</span>
          </div>

          <h1 className="hero-title">
            المستشار القانوني
            <br />
            <span className="hero-title-gold">الذكي لمصر</span>
          </h1>

          <p className="hero-subtitle">
            احصل على استشارة قانونية دقيقة في ثوانٍ. متخصص في القانون المصري بكل مجالاته، متاح على مدار الساعة وبسرية تامة.
          </p>

          <div className="hero-actions">
            <button className="hero-cta" type="button" onClick={() => navigate('/chat')}>
              <Scale size={16} />
              <span>ابدأ استشارتك مجاناً</span>
            </button>
            <button
              className="hero-ghost"
              type="button"
              onClick={() => document.getElementById('Features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <span>استكشف المميزات</span>
              <ArrowLeft size={14} />
            </button>
          </div>

          {/* Trust pills */}
          <div className="hero-trust">
            <div className="hero-trust-item">
              <Zap size={13} className="hero-trust-icon" />
              <span>استجابة فورية</span>
            </div>
            <div className="hero-trust-dot" />
            <div className="hero-trust-item">
              <Shield size={13} className="hero-trust-icon" />
              <span>سرية تامة</span>
            </div>
            <div className="hero-trust-dot" />
            <div className="hero-trust-item">
              <Clock size={13} className="hero-trust-icon" />
              <span>متاح 24/7</span>
            </div>
          </div>

          {/* Stats */}
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">+50K</span>
              <span className="hero-stat-label">استشارة شهرياً</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">98%</span>
              <span className="hero-stat-label">رضا المستخدمين</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">&lt; 3s</span>
              <span className="hero-stat-label">وقت الاستجابة</span>
            </div>
          </div>
        </div>

        {/* ── Demo Chat Card ── */}
        <div className="hero-demo" role="presentation">

          {/* Window chrome dots */}
          <div className="hero-demo-chrome">
            <span className="hero-chrome-dot hero-chrome-dot--red" />
            <span className="hero-chrome-dot hero-chrome-dot--yellow" />
            <span className="hero-chrome-dot hero-chrome-dot--green" />
            <span className="hero-chrome-label">ELITE Legal AI</span>
          </div>

          <div className="hero-demo-header">
            <div className="hero-demo-avatar">
              <Scale size={15} />
            </div>
            <div className="hero-demo-info">
              <div className="hero-demo-name">ELITE القانوني</div>
              <div className="hero-demo-status">
                <span className="hero-demo-pulse" />
                <span>متصل · المستشار القانوني الذكي</span>
              </div>
            </div>
            <div className="hero-demo-badge">AI</div>
          </div>

          <div className="hero-demo-msgs">
            {DEMO_MSGS.map((msg, i) => (
              <div
                key={i}
                className={`hero-demo-msg hero-demo-msg--${msg.role}`}
                style={{ animationDelay: `${i * 0.18 + 0.3}s` }}
              >
                <div className="hero-demo-bubble">{msg.text}</div>
              </div>
            ))}

            {/* Typing indicator */}
            <div className="hero-demo-msg hero-demo-msg--ai hero-demo-typing-wrap" style={{ animationDelay: '0.9s' }}>
              <div className="hero-demo-typing">
                <span /><span /><span />
              </div>
            </div>
          </div>

          <div className="hero-demo-footer">
            <div className="hero-demo-input">
              <span className="hero-demo-placeholder">اكتب سؤالك القانوني…</span>
            </div>
            <button
              type="button"
              className="hero-demo-send"
              onClick={() => navigate('/chat')}
              aria-label="ابدأ المحادثة"
            >
              <ArrowLeft size={14} style={{ transform: 'rotate(180deg)' }} />
            </button>
          </div>
        </div>

      </div>

      {/* Scroll hint */}
      <div className="hero-scroll-hint" aria-hidden="true">
        <div className="hero-scroll-line" />
      </div>
    </section>
  );
}
