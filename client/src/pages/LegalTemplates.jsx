import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import './templates.css';

export default function LegalTemplates() {
  const { authFetch } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((t) => `${t.title} ${t.description}`.toLowerCase().includes(q));
  }, [templates, query]);

  useEffect(() => {
    (async () => {
      setError('');
      setIsLoading(true);
      try {
        const res = await authFetch('/api/templates');
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data?.error || 'Failed to load templates.');
          return;
        }
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
    if (!res.ok) {
      setError(data?.error || 'Failed to load template.');
      return;
    }
    setSelected(data.template || null);
  };

  return (
    <div className="tpl-shell">
      <header className="tpl-header">
        <div className="tpl-title">Legal Templates</div>
        <div className="tpl-subtitle">Ready-to-use models you can generate as PDF.</div>
      </header>

      <div className="tpl-search">
        <input
          className="tpl-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search templates…"
          aria-label="Search templates"
        />
      </div>

      {error && <div className="tpl-panel error">{error}</div>}

      <div className="tpl-grid">
        <div className="tpl-list">
          {isLoading ? (
            <div className="tpl-panel">Loading…</div>
          ) : filtered.length ? (
            filtered.map((t) => (
              <button key={t.id} className="tpl-card" type="button" onClick={() => openTemplate(t.id)}>
                <div className="tpl-card-title">{t.title}</div>
                <div className="tpl-card-desc">{t.description}</div>
              </button>
            ))
          ) : (
            <div className="tpl-panel">No templates.</div>
          )}
        </div>

        <div className="tpl-preview">
          {selected ? (
            <>
              <div className="tpl-preview-title">{selected.title}</div>
              <div className="tpl-preview-desc">{selected.description}</div>
              <div className="tpl-preview-meta">
                Fields: {(selected.fields || []).map((f) => f.label || f.key).join(', ') || 'None'}
              </div>
              <pre className="tpl-preview-body">{selected.body || ''}</pre>
            </>
          ) : (
            <div className="tpl-panel">Select a template to preview.</div>
          )}
        </div>
      </div>
    </div>
  );
}

