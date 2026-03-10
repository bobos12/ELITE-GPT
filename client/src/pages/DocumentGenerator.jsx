import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import './docgen.css';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
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

  const selected = useMemo(() => templates.find((t) => t.id === templateId) || null, [templates, templateId]);

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
        const [tplRes, docsRes] = await Promise.all([authFetch('/api/templates'), authFetch('/api/documents')]);
        const tplData = await tplRes.json().catch(() => ({}));
        const docsData = await docsRes.json().catch(() => ({}));
        if (!tplRes.ok) setError(tplData?.error || 'Failed to load templates.');
        setTemplates(Array.isArray(tplData.templates) ? tplData.templates : []);
        setDocs(Array.isArray(docsData.documents) ? docsData.documents : []);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [authFetch]);

  useEffect(() => {
    if (!selected) return;
    const next = {};
    (selected.fields || []).forEach((f) => {
      next[f.key] = fields[f.key] || '';
    });
    setFields(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  const onGenerate = async (e) => {
    e.preventDefault();
    if (!templateId) return;
    setError('');
    setIsGenerating(true);
    try {
      const res = await authFetch('/api/documents/generate', {
        method: 'POST',
        body: JSON.stringify({ templateId, fields })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || 'Failed to generate document.');
        return;
      }
      const filename = res.headers.get('x-filename') || 'document.pdf';
      const blob = await res.blob();
      downloadBlob(blob, filename);
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
    if (!window.confirm('Delete this document?')) return;
    const res = await authFetch(`/api/documents/${id}`, { method: 'DELETE' });
    if (res.ok) setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="dg-shell">
      <header className="dg-header">
        <div className="dg-title">Document Generator</div>
        <div className="dg-subtitle">Generate contracts / agreements as PDF.</div>
      </header>

      {error && <div className="dg-panel error">{error}</div>}

      <div className="dg-grid">
        <div className="dg-panel">
          <div className="dg-section-title">Generate</div>
          {isLoading ? (
            <div className="dg-muted">Loading…</div>
          ) : (
            <form onSubmit={onGenerate} className="dg-form">
              <label className="dg-label">
                Template
                <select className="dg-select" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                  <option value="">Select…</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </label>

              {selected?.fields?.length ? (
                <div className="dg-fields">
                  {selected.fields.map((f) => (
                    <label className="dg-label" key={f.key}>
                      {f.label || f.key}
                      <input
                        className="dg-input"
                        value={fields[f.key] || ''}
                        onChange={(e) => setFields((p) => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder || ''}
                        required={Boolean(f.required)}
                      />
                    </label>
                  ))}
                </div>
              ) : null}

              <button className="dg-button" type="submit" disabled={!templateId || isGenerating}>
                {isGenerating ? 'Generating…' : 'Generate PDF'}
              </button>
            </form>
          )}
        </div>

        <div className="dg-panel">
          <div className="dg-section-title">My Documents</div>
          {docs.length ? (
            <div className="dg-docs">
              {docs.map((d) => (
                <div key={d.id} className="dg-doc">
                  <div className="dg-doc-title">{d.title}</div>
                  <div className="dg-doc-meta">{new Date(d.createdAt).toLocaleString()}</div>
                  <div className="dg-doc-actions">
                    <button className="dg-button secondary" type="button" onClick={() => download(d.id)}>
                      Download
                    </button>
                    <button className="dg-button danger" type="button" onClick={() => remove(d.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="dg-muted">No documents yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

