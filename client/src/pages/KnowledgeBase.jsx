import { useEffect, useMemo, useState } from 'react';
import './kb.css';

export default function KnowledgeBase() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((x) => `${x.question} ${x.answer}`.toLowerCase().includes(q));
  }, [items, query]);

  useEffect(() => {
    (async () => {
      setError('');
      setIsLoading(true);
      try {
        const res = await fetch('/api/kb/faq');
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data?.error || 'Failed to load FAQ.');
          return;
        }
        setItems(Array.isArray(data.items) ? data.items : []);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <div className="kb-shell">
      <header className="kb-header">
        <div className="kb-title">Knowledge Base / FAQ</div>
        <div className="kb-subtitle">Common legal questions and answers.</div>
      </header>

      <div className="kb-search">
        <input
          className="kb-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          aria-label="Search FAQ"
        />
      </div>

      {error && <div className="kb-panel error">{error}</div>}
      {isLoading ? (
        <div className="kb-panel">Loading…</div>
      ) : filtered.length ? (
        <div className="kb-list">
          {filtered.map((x) => (
            <details key={x.id} className="kb-item">
              <summary className="kb-q">{x.question}</summary>
              <div className="kb-a">{x.answer}</div>
            </details>
          ))}
        </div>
      ) : (
        <div className="kb-panel">No results.</div>
      )}
    </div>
  );
}

