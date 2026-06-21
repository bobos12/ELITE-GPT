import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import './kb.css';

export default function KnowledgeBase() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('الكل');

  const categories = useMemo(() => {
    const cats = [...new Set(items.map(x => x.category).filter(Boolean))];
    return cats;
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byQuery = !q ? items : items.filter(x =>
      `${x.question} ${x.answer} ${x.category || ''}`.toLowerCase().includes(q)
    );
    if (activeCategory === 'الكل') return byQuery;
    return byQuery.filter(x => x.category === activeCategory);
  }, [items, query, activeCategory]);

  useEffect(() => {
    (async () => {
      setError('');
      setIsLoading(true);
      try {
        const res = await fetch('/api/kb/faq');
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { setError(data?.error || 'فشل تحميل قاعدة المعرفة.'); return; }
        setItems(Array.isArray(data.items) ? data.items : []);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <div className="kb-shell" dir="rtl">
      <div className="kb-header">
        <div className="kb-header-icon"><BookOpen size={28} /></div>
        <div>
          <h1 className="kb-title">قاعدة المعرفة القانونية</h1>
          <p className="kb-subtitle">أسئلة شائعة حول الإجراءات والقوانين المصرية</p>
        </div>
      </div>

      <div className="kb-search-wrap">
        <Search size={16} className="kb-search-icon" />
        <input
          className="kb-search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="ابحث في الأسئلة والأجوبة…"
          aria-label="البحث في قاعدة المعرفة"
        />
      </div>

      {categories.length > 0 && (
        <div className="kb-cats">
          {['الكل', ...categories].map(cat => (
            <button
              key={cat}
              className={`kb-cat ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat !== 'الكل' && <Tag size={11} />}
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="kb-content">
        {isLoading ? (
          <div className="kb-loading">
            {[1,2,3,4].map(i => <div key={i} className="kb-skeleton" />)}
          </div>
        ) : error ? (
          <div className="kb-error">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="kb-empty">
            <BookOpen size={48} />
            <p>لا توجد نتائج لهذا البحث</p>
          </div>
        ) : (
          <div className="kb-list">
            {filtered.map((item, i) => (
              <motion.div
                key={item.id || i}
                className={`kb-item ${openId === item.id ? 'open' : ''}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <button
                  className="kb-question"
                  onClick={() => setOpenId(openId === item.id ? null : item.id)}
                  aria-expanded={openId === item.id}
                >
                  <span className="kb-question-text">{item.question}</span>
                  <span className="kb-chevron">
                    {openId === item.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {openId === item.id && (
                    <motion.div
                      className="kb-answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                    >
                      <div className="kb-answer-inner">{item.answer}</div>
                      {item.category && (
                        <div className="kb-answer-cat">
                          <Tag size={11} /> {item.category}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="kb-disclaimer">
        هذه المعلومات لأغراض التوعية القانونية العامة ولا تُعد استشارة قانونية متخصصة.
        يُنصح بمراجعة محامٍ مختص لأي إجراء قانوني.
      </div>
    </div>
  );
}
