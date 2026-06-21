import { useState } from 'react';
import './price.css';
import { Check, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PLANS = [
  {
    id: 'starter',
    name: 'الباقة الأساسية',
    desc: 'مثالية للأفراد والاستخدام الشخصي',
    monthly: 29,
    yearly: 290,
    origYearly: 348,
    features: [
      'حتى 5 محادثات يومياً',
      'تحليل القانون المصري',
      'دعم البريد الإلكتروني',
      'تخزين 10 محادثات',
      'النماذج القانونية الأساسية',
    ],
    cta: 'ابدأ مجاناً',
    popular: false,
    highlight: false,
  },
  {
    id: 'professional',
    name: 'الباقة المهنية',
    desc: 'للمحترفين القانونيين والشركات',
    monthly: 79,
    yearly: 790,
    origYearly: 948,
    features: [
      'محادثات غير محدودة',
      'تحليلات متقدمة وعميقة',
      'دعم ذو أولوية 24/7',
      'تخزين غير محدود',
      'جميع النماذج القانونية',
      'منشئ الوثائق القانونية',
      'تحليل المستندات المرفوعة',
    ],
    badge: 'الأكثر شيوعاً',
    cta: 'ابدأ الآن',
    popular: true,
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'باقة المؤسسات',
    desc: 'للمكاتب القانونية والمؤسسات الكبيرة',
    monthly: 199,
    yearly: 1990,
    origYearly: 2388,
    features: [
      'كل مميزات الباقة المهنية',
      'مدير حساب مخصص',
      'API كامل غير محدود',
      'تطوير وتخصيص مخصص',
      'ضمان SLA بنسبة 99.9%',
      'أمان وامتثال متقدم',
      'تقارير وتحليلات مؤسسية',
      'علامة تجارية بيضاء',
    ],
    cta: 'تواصل معنا',
    popular: false,
    highlight: false,
  },
];

export default function Price() {
  const [billing, setBilling] = useState('monthly');
  const navigate = useNavigate();

  const savings = (m, y) => Math.round(((m * 12 - y) / (m * 12)) * 100);

  return (
    <section className="price-root" id="pricing">
      <div className="price-inner">

        <div className="price-header">
          <div className="price-badge">الأسعار</div>
          <h2 className="price-title">
            استثمر في
            <span className="price-title-gold"> حمايتك القانونية</span>
          </h2>
          <p className="price-subtitle">
            أسعار شفافة بلا رسوم خفية. ابدأ اليوم وطوّر باقتك في أي وقت.
          </p>
        </div>

        <div className="price-toggle-wrap">
          <div className="price-toggle">
            <button
              className={`price-toggle-btn ${billing === 'monthly' ? 'active' : ''}`}
              type="button"
              onClick={() => setBilling('monthly')}
            >
              شهري
            </button>
            <button
              className={`price-toggle-btn ${billing === 'yearly' ? 'active' : ''}`}
              type="button"
              onClick={() => setBilling('yearly')}
            >
              سنوي
              <span className="price-save-badge">وفّر 17%</span>
            </button>
          </div>
        </div>

        <div className="price-cards">
          {PLANS.map(plan => {
            const price = billing === 'monthly' ? plan.monthly : plan.yearly;
            return (
              <div
                key={plan.id}
                className={`price-card ${plan.popular ? 'price-card--popular' : ''}`}
              >
                {plan.badge && (
                  <div className="price-plan-badge">
                    <Zap size={10} />
                    <span>{plan.badge}</span>
                  </div>
                )}

                <div className="price-plan-header">
                  <div className="price-plan-name">{plan.name}</div>
                  <div className="price-plan-desc">{plan.desc}</div>
                </div>

                <div className="price-amount">
                  <span className="price-currency">$</span>
                  <span className="price-num">{price}</span>
                  <span className="price-period">/{billing === 'monthly' ? 'شهر' : 'سنة'}</span>
                </div>

                {billing === 'yearly' && (
                  <div className="price-orig">
                    <span className="price-crossed">${plan.origYearly}</span>
                    <span className="price-saving">وفّر {savings(plan.monthly, plan.yearly)}%</span>
                  </div>
                )}

                <div className="price-divider" />

                <ul className="price-features">
                  {plan.features.map((f, i) => (
                    <li key={i} className="price-feature">
                      <Check size={13} className="price-check" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`price-cta ${plan.popular ? 'price-cta--primary' : ''}`}
                  type="button"
                  onClick={() => navigate('/signup')}
                >
                  {plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        <div className="price-trust">
          <span className="price-trust-item">SSL مشفّر</span>
          <span className="price-trust-sep">·</span>
          <span className="price-trust-item">إلغاء في أي وقت</span>
          <span className="price-trust-sep">·</span>
          <span className="price-trust-item">ضمان استرداد 14 يوماً</span>
        </div>

      </div>
    </section>
  );
}
