import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, X, ChevronLeft } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import './templates.css';

export default function LegalTemplates() {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(t =>
      `${t.title} ${t.description}`.toLowerCase().includes(q)
    );
  }, [templates, query]);

  useEffect(() => {
    (async () => {
      setError('');
      setIsLoading(true);
      try {
        const res = await authFetch('/api/templates');
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { setError(data?.error || 'فشل تحميل النماذج.'); return; }
        setTemplates(Array.isArray(data.templates) ? data.templates : []);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [authFetch]);

  const openTemplate = async (id) => {
    setError('');
    const res = await authFetch(`/api/templates/${id}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data?.error || 'فشل تحميل النموذج.'); return; }
    setSelected(data.template || null);
  };

  return (
    <div className="tpl-shell" dir="rtl">
      <div className="tpl-header">
        <div className="tpl-header-icon"><FileText size={26} /></div>
        <div>
          <h1 className="tpl-title">النماذج القانونية</h1>
          <p className="tpl-subtitle">تصفّح النماذج القانونية الجاهزة وأنشئ وثائقك بسهولة</p>
        </div>
      </div>

      <div className="tpl-search-wrap">
        <Search size={15} className="tpl-search-icon" />
        <input
          className="tpl-search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="ابحث في النماذج…"
          aria-label="البحث في النماذج"
        />
      </div>

      {error && <div className="tpl-error">{error}</div>}

      <div className="tpl-layout">
        {/* Template list */}
        <div className="tpl-list">
          {isLoading ? (
            <div className="tpl-loading">
              {[1,2,3].map(i => <div key={i} className="tpl-skeleton" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="tpl-empty"><p>لا توجد نماذج مطابقة للبحث</p></div>
          ) : (
            filtered.map((t, i) => (
              <motion.button
                key={t.id}
                className={`tpl-card ${selected?.id === t.id ? 'active' : ''}`}
                type="button"
                onClick={() => openTemplate(t.id)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <div className="tpl-card-icon"><FileText size={16} /></div>
                <div className="tpl-card-body">
                  <div className="tpl-card-title">{t.title}</div>
                  <div className="tpl-card-desc">{t.description}</div>
                  <div className="tpl-card-fields">
                    {(t.fields || []).length} حقل
                  </div>
                </div>
                <ChevronLeft size={14} className="tpl-card-arrow" />
              </motion.button>
            ))
          )}
        </div>

        {/* Preview panel */}
        <div className="tpl-preview">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="tpl-preview-inner"
              >
                <div className="tpl-preview-head">
                  <div>
                    <div className="tpl-preview-title">{selected.title}</div>
                    <div className="tpl-preview-desc">{selected.description}</div>
                  </div>
                  <button className="tpl-close" onClick={() => setSelected(null)} title="إغلاق">
                    <X size={15} />
                  </button>
                </div>

                {selected.fields?.length > 0 && (
                  <div className="tpl-preview-fields">
                    <span className="tpl-fields-label">الحقول المطلوبة:</span>
                    {selected.fields.map(f => (
                      <span key={f.key} className={`tpl-field-chip ${f.required ? 'required' : ''}`}>
                        {f.label}
                        {f.required && ' *'}
                      </span>
                    ))}
                  </div>
                )}

                <pre className="tpl-preview-body" dir="rtl">{selected.body || ''}</pre>

                <button
                  className="tpl-use-btn"
                  type="button"
                  onClick={() => navigate('/document-generator')}
                >
                  <ChevronLeft size={15} /> استخدم هذا النموذج لإنشاء وثيقة
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                className="tpl-placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <FileText size={48} />
                <p>اختر نموذجاً للمعاينة</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
