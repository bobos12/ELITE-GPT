import './feature.css';
import { Zap, Shield, Globe, Scale, FileText, Brain } from 'lucide-react';

const FEATURES = [
  {
    icon: Brain,
    title: 'ذكاء اصطناعي متخصص',
    desc: 'نماذج ذكاء اصطناعي متقدمة مدرّبة على آلاف القوانين والأحكام المصرية تمنحك تحليلاً قانونياً دقيقاً لا مثيل له.',
    accent: 'gold',
  },
  {
    icon: Shield,
    title: 'خصوصية عسكرية',
    desc: 'تشفير من طرف إلى طرف. بياناتك لا تُشارك ولا تُستخدم في تدريب النماذج. سريّتك مقدسة.',
    accent: 'default',
  },
  {
    icon: Zap,
    title: 'استجابة في ثوانٍ',
    desc: 'لا انتظار، لا مواعيد. احصل على إجابة قانونية شاملة ومستندة إلى القانون في أقل من 3 ثوانٍ.',
    accent: 'default',
  },
  {
    icon: Scale,
    title: 'القانون المصري حصراً',
    desc: 'تخصص كامل في التشريعات المصرية: الأحوال الشخصية، التجاري، العمالي، العقاري، والجنائي.',
    accent: 'default',
  },
  {
    icon: FileText,
    title: 'توليد الوثائق',
    desc: 'أنشئ عقوداً وتوكيلات ووثائق قانونية جاهزة في دقائق بدلاً من ساعات مع محامٍ.',
    accent: 'default',
  },
  {
    icon: Globe,
    title: 'متاح 24/7',
    desc: 'استشارتك لا تنتظر دوام المكتب. خدمة متواصلة كل يوم، في أي وقت، من أي مكان.',
    accent: 'default',
  },
];

export default function Features() {
  return (
    <section className="feat-root" id="Features">
      <div className="feat-inner">

        <div className="feat-header">
          <div className="feat-badge">المميزات الرئيسية</div>
          <h2 className="feat-title">
            كل ما تحتاجه من
            <span className="feat-title-gold"> استشارة قانونية</span>
          </h2>
          <p className="feat-subtitle">
            منصة متكاملة تجمع دقة الذكاء الاصطناعي مع عمق المعرفة بالقانون المصري
          </p>
        </div>

        <div className="feat-grid">
          {FEATURES.map(({ icon: Icon, title, desc, accent }, i) => (
            <div key={i} className={`feat-card ${accent === 'gold' ? 'feat-card--gold' : ''}`}>
              <div className={`feat-icon ${accent === 'gold' ? 'feat-icon--gold' : ''}`}>
                <Icon size={20} />
              </div>
              <h3 className="feat-card-title">{title}</h3>
              <p className="feat-card-desc">{desc}</p>
              <div className="feat-card-line" />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
