import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Trash2, ChevronLeft, Loader, FilePlus } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import './docgen.css';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function formatDate(d) {
  try {
    return new Date(d).toLocaleDateString('ar-EG', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch { return ''; }
}

export default function DocumentGenerator() {
  const { authFetch } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState('');
  const [fields, setFields] = useState({});
  const [docs, setDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selected = useMemo(() => templates.find(t => t.id === templateId) || null, [templates, templateId]);

  const loadDocs = async () => {
    const res = await authFetch('/api/documents');
    const data = await res.json().catch(() => ({}));
    if (res.ok) setDocs(Array.isArray(data.documents) ? data.documents : []);
  };

  useEffect(() => {
    (async () => {
      setError('');
      setIsLoading(true);
      try {
        const [tRes, dRes] = await Promise.all([
          authFetch('/api/templates'),
          authFetch('/api/documents'),
        ]);
        const tData = await tRes.json().catch(() => ({}));
        const dData = await dRes.json().catch(() => ({}));
        if (!tRes.ok) setError(tData?.error || 'فشل تحميل النماذج.');
        setTemplates(Array.isArray(tData.templates) ? tData.templates : []);
        setDocs(Array.isArray(dData.documents) ? dData.documents : []);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [authFetch]);

  useEffect(() => {
    if (!selected) return;
    const next = {};
    (selected.fields || []).forEach(f => { next[f.key] = fields[f.key] || ''; });
    setFields(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  const onGenerate = async (e) => {
    e.preventDefault();
    if (!templateId) return;
    setError(''); setSuccess('');
    setIsGenerating(true);
    try {
      const res = await authFetch('/api/documents/generate', {
        method: 'POST',
        body: JSON.stringify({ templateId, fields }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || 'فشل إنشاء الوثيقة.');
        return;
      }
      const filename = res.headers.get('x-filename') || 'document.pdf';
      const blob = await res.blob();
      downloadBlob(blob, filename);
      setSuccess('تم إنشاء الوثيقة وتنزيلها بنجاح!');
      await loadDocs();
    } finally {
      setIsGenerating(false);
    }
  };

  const download = async (id) => {
    const res = await authFetch(`/api/documents/${id}/download`);
    if (!res.ok) return;
    const filename = res.headers.get('x-filename') || 'document.pdf';
    const blob = await res.blob();
    downloadBlob(blob, filename);
  };

  const remove = async (id) => {
    if (!window.confirm('هل تريد حذف هذه الوثيقة؟')) return;
    const res = await authFetch(`/api/documents/${id}`, { method: 'DELETE' });
    if (res.ok) setDocs(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className="dg-shell" dir="rtl">
      <div className="dg-header">
        <div className="dg-header-icon"><FilePlus size={26} /></div>
        <div>
          <h1 className="dg-title">منشئ الوثائق القانونية</h1>
          <p className="dg-subtitle">أنشئ عقوداً وأوراقاً قانونية جاهزة وصِل إليها كـ PDF</p>
        </div>
      </div>

      {error && <div className="dg-alert error">{error}</div>}
      {success && <div className="dg-alert success">{success}</div>}

      <div className="dg-layout">
        {/* Generator */}
        <div className="dg-card">
          <div className="dg-card-title">
            <FilePlus size={16} /> إنشاء وثيقة جديدة
          </div>

          {isLoading ? (
            <div className="dg-loading">
              {[1,2,3].map(i => <div key={i} className="dg-skeleton" />)}
            </div>
          ) : (
            <form onSubmit={onGenerate} className="dg-form">
              <label className="dg-label">
                <span className="dg-label-text">اختر نوع الوثيقة</span>
                <select
                  className="dg-select"
                  value={templateId}
                  onChange={e => setTemplateId(e.target.value)}
                >
                  <option value="">— اختر نموذجاً —</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </label>

              {selected?.description && (
                <p className="dg-template-desc">{selected.description}</p>
              )}

              {selected?.fields?.map(f => (
                <label className="dg-label" key={f.key}>
                  <span className="dg-label-text">
                    {f.label}
                    {f.required && <span className="dg-required"> *</span>}
                  </span>
                  <input
                    className="dg-input"
                    value={fields[f.key] || ''}
                    onChange={e => setFields(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder || ''}
                    required={Boolean(f.required)}
                    dir="rtl"
                  />
                </label>
              ))}

              <button
                className="dg-generate-btn"
                type="submit"
                disabled={!templateId || isGenerating}
              >
                {isGenerating ? (
                  <><Loader size={15} className="dg-spin" /> جارٍ الإنشاء…</>
                ) : (
                  <><ChevronLeft size={15} /> إنشاء وتنزيل PDF</>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Documents list */}
        <div className="dg-card">
          <div className="dg-card-title">
            <FileText size={16} /> وثائقي المحفوظة
          </div>
          {docs.length === 0 ? (
            <div className="dg-empty">
              <FileText size={40} />
              <p>لم تُنشئ أي وثيقة بعد</p>
            </div>
          ) : (
            <div className="dg-docs-list">
              {docs.map((d, i) => (
                <motion.div
                  key={d.id}
                  className="dg-doc"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <div className="dg-doc-icon"><FileText size={16} /></div>
                  <div className="dg-doc-body">
                    <div className="dg-doc-title">{d.title}</div>
                    <div className="dg-doc-date">{formatDate(d.createdAt)}</div>
                  </div>
                  <div className="dg-doc-actions">
                    <button className="dg-doc-btn" type="button" onClick={() => download(d.id)} title="تنزيل">
                      <Download size={14} />
                    </button>
                    <button className="dg-doc-btn danger" type="button" onClick={() => remove(d.id)} title="حذف">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="dg-disclaimer">
        الوثائق المُنشأة نماذج قانونية للاسترشاد العام. يُنصح بمراجعة محامٍ مرخص قبل التوقيع على أي وثيقة ذات أثر قانوني.
      </div>
    </div>
  );
}
