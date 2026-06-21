import './testimonials.css';
import { Star, Quote } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'أحمد سامي',
    role: 'رائد أعمال · القاهرة',
    initials: 'أس',
    rating: 5,
    text: 'وفّرت عليّ آلاف الجنيهات في رسوم الاستشارات. استخدمت ELITE لتأسيس شركتي وكانت الإجابات دقيقة جداً ومستندة إلى القانون المصري بشكل احترافي.',
  },
  {
    name: 'نورا حسن',
    role: 'محامية · الإسكندرية',
    initials: 'نح',
    rating: 5,
    text: 'كمحامية، أستخدمها كمرجع سريع للبحث وتوفير الوقت. جودة التحليل القانوني مذهلة والمراجع القانونية دقيقة. أنصح بها كل زميل.',
  },
  {
    name: 'محمد عادل',
    role: 'مدير موارد بشرية',
    initials: 'مع',
    rating: 5,
    text: 'نزاع عمالي معقد كان يقلقني. في دقائق حصلت على تحليل قانوني شامل بحقوقي وخياراتي. المنصة غيّرت طريقة تعاملي مع الأمور القانونية.',
  },
  {
    name: 'سارة يوسف',
    role: 'مستشارة أعمال',
    initials: 'سي',
    rating: 5,
    text: 'استخدمتها لمراجعة عقد شراكة تجارية كبير. اكتشفت بنوداً إشكالية كانت يمكن أن تسبب خسائر ضخمة. ELITE مستشار لا يُستغنى عنه.',
  },
];

export default function Testimonials() {
  return (
    <section className="tst-root" id="testimonials">
      <div className="tst-inner">

        <div className="tst-header">
          <div className="tst-badge">
            <Star size={11} />
            <span>آراء العملاء</span>
          </div>
          <h2 className="tst-title">
            يثق بنا آلاف
            <span className="tst-title-gold"> المستخدمين</span>
          </h2>
          <p className="tst-subtitle">
            تجارب حقيقية من مستخدمين وجدوا في ELITE المستشار القانوني الذي طالما احتاجوه
          </p>
        </div>

        <div className="tst-grid">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="tst-card">
              <div className="tst-quote-icon">
                <Quote size={18} />
              </div>

              <div className="tst-stars">
                {Array.from({ length: t.rating }).map((_, s) => (
                  <Star key={s} size={13} className="tst-star" />
                ))}
              </div>

              <p className="tst-text">"{t.text}"</p>

              <div className="tst-author">
                <div className="tst-avatar">{t.initials}</div>
                <div className="tst-author-info">
                  <div className="tst-name">{t.name}</div>
                  <div className="tst-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom trust bar */}
        <div className="tst-trust-bar">
          <div className="tst-trust-item">
            <span className="tst-trust-number">50,000+</span>
            <span className="tst-trust-label">استشارة مكتملة</span>
          </div>
          <div className="tst-trust-sep" />
          <div className="tst-trust-item">
            <span className="tst-trust-number">4.9/5</span>
            <span className="tst-trust-label">متوسط التقييم</span>
          </div>
          <div className="tst-trust-sep" />
          <div className="tst-trust-item">
            <span className="tst-trust-number">98%</span>
            <span className="tst-trust-label">رضا المستخدمين</span>
          </div>
        </div>

      </div>
    </section>
  );
}
