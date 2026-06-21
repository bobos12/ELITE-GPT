import { useState } from 'react';
import './faq.css';
import { Plus, Minus, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    q: 'هل ELITE AI بديل عن المحامي؟',
    a: 'يقدم نظامنا معلومات قانونية دقيقة وتحليلاً شاملاً مستنداً إلى القانون المصري، لكنه أداة بحث ومساعدة متطورة ولا يُغني عن الاستعانة بمحامٍ مرخص في القضايا المعقدة أو التي تتطلب تمثيلاً قانونياً أمام المحاكم.',
  },
  {
    q: 'كيف تُحمى بياناتي وسريّتي؟',
    a: 'نستخدم تشفيراً من طرف إلى طرف لجميع المحادثات. بياناتك لا تُشارك مع أطراف ثالثة، ولا تُستخدم في تدريب النماذج دون موافقتك الصريحة، وتُحذف تلقائياً بناءً على إعدادات الخصوصية التي تختارها.',
  },
  {
    q: 'ما مجالات القانون التي يغطيها النظام؟',
    a: 'يتخصص النظام في القانون المصري بجميع مجالاته: الأحوال الشخصية، التجاري والشركات، العمالي، العقاري، الجنائي، قانون الاستثمار، والمنازعات الإدارية، مع تغطية للتعديلات التشريعية الحديثة.',
  },
  {
    q: 'هل يمكن استخدامه في الاستشارات المؤسسية؟',
    a: 'نعم، تتميز المنصة في التحليل المؤسسي وتقدم وحدات متخصصة في حوكمة الشركات، الامتثال التنظيمي، مراجعة العقود التجارية، الملكية الفكرية، وإجراءات التحكيم التجاري الدولي.',
  },
  {
    q: 'ما مدى تحديث قاعدة البيانات القانونية؟',
    a: 'تتلقى قاعدة البيانات القانونية تحديثات منتظمة تشمل أحدث الأحكام القضائية الصادرة عن محكمة النقض والمحكمة الدستورية، إضافة إلى التعديلات التشريعية واللوائح التنفيذية الصادرة حديثاً.',
  },
  {
    q: 'ما الذي يميّز ELITE AI عن المنصات الأخرى؟',
    a: 'بنيتنا المخصصة تجمع نماذج ذكاء اصطناعي متطورة مع قاعدة معرفية شاملة بالقانون المصري تحديداً، مع نظام RAG للتحقق من الدقة، ودعم كامل للغة العربية الفصحى والعامية المصرية في الأسئلة والأجوبة.',
  },
];

export default function FAQ() {
  const [active, setActive] = useState(null);

  return (
    <section className="faq-root" id="faq">
      <div className="faq-inner">

        <div className="faq-header">
          <div className="faq-badge">
            <HelpCircle size={12} />
            <span>الأسئلة الشائعة</span>
          </div>
          <h2 className="faq-title">أسئلة وأجوبة</h2>
          <p className="faq-subtitle">
            إجابات شاملة على الأسئلة الأكثر شيوعاً حول منصتنا للذكاء القانوني
          </p>
        </div>

        <div className="faq-list">
          {FAQS.map((item, i) => {
            const isOpen = active === i;
            return (
              <div key={i} className={`faq-item ${isOpen ? 'faq-item--open' : ''}`}>
                <button
                  className="faq-q"
                  type="button"
                  onClick={() => setActive(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span className="faq-q-text">{item.q}</span>
                  <span className="faq-icon">
                    {isOpen ? <Minus size={15} /> : <Plus size={15} />}
                  </span>
                </button>
                <div
                  className="faq-a-wrap"
                  style={{ maxHeight: isOpen ? '400px' : '0' }}
                >
                  <div className="faq-a">
                    <p>{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
