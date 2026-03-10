import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Link } from 'react-router-dom';
import '../auth/auth.css';

function formatDate(d) {
  try {
    return new Date(d).toLocaleString();
  } catch {
    return '';
  }
}

export default function Account() {
  const { user, logout, authFetch } = useAuth();
  const [history, setHistory] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useMemo(
    () => async () => {
      setError('');
      setIsLoading(true);
      try {
        const [hRes, dRes] = await Promise.all([authFetch('/api/user/history'), authFetch('/api/documents')]);
        const hData = await hRes.json().catch(() => ({}));
        const dData = await dRes.json().catch(() => ({}));
        if (!hRes.ok) {
          setError(hData?.error || 'Failed to load history.');
          return;
        }
        if (!dRes.ok) {
          setError(dData?.error || 'Failed to load documents.');
          return;
        }
        setHistory(hData.history || []);
        setDocuments(dData.documents || []);
      } finally {
        setIsLoading(false);
      }
    },
    [authFetch]
  );

  useEffect(() => {
    load();
  }, [load]);

  const clearAll = async () => {
    if (!window.confirm('Clear all history?')) return;
    const res = await authFetch('/api/user/history', { method: 'DELETE' });
    if (res.ok) setHistory([]);
  };

  const deleteOne = async (id) => {
    const res = await authFetch(`/api/user/history/${id}`, { method: 'DELETE' });
    if (res.ok) setHistory((prev) => prev.filter((x) => x._id !== id));
  };

  const downloadDoc = async (id) => {
    const res = await authFetch(`/api/documents/${id}/download`);
    if (!res.ok) return;
    const filename = res.headers.get('x-filename') || 'document.pdf';
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const deleteDoc = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    const res = await authFetch(`/api/documents/${id}`, { method: 'DELETE' });
    if (res.ok) setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="account-shell">
      <header className="account-header">
        <div>
          <div className="account-title">My Cases / History</div>
          <div className="account-subtitle">{user?.email}</div>
        </div>
        <div className="account-actions">
          <Link className="account-link" to="/chat">Back to chat</Link>
          <Link className="account-link" to="/document-generator">Document Generator</Link>
          <button className="account-button secondary" onClick={logout}>Log out</button>
        </div>
      </header>

      <main className="account-main">
        <div className="history-top">
          <div className="history-title">Generated Documents</div>
          <div />
        </div>

        {isLoading ? (
          <div className="panel">Loading…</div>
        ) : documents.length ? (
          <div className="history-list">
            {documents.map((d) => (
              <div key={d.id} className="history-item">
                <div className="history-meta">{formatDate(d.createdAt)}</div>
                <div className="history-q"><span>Title:</span> {d.title}</div>
                <div className="history-actions">
                  <button className="account-button secondary" onClick={() => downloadDoc(d.id)}>Download</button>
                  <button className="account-button danger" onClick={() => deleteDoc(d.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="panel">No generated documents yet.</div>
        )}

        <div className="history-top">
          <div className="history-title">Search / Chat History</div>
          <button className="account-button secondary" onClick={clearAll} disabled={!history.length}>Clear all</button>
        </div>

        {error && <div className="panel error">{error}</div>}
        {isLoading ? null : history.length ? (
          <div className="history-list">
            {history.map((h) => (
              <div key={h._id} className="history-item">
                <div className="history-meta">{formatDate(h.createdAt)}</div>
                <div className="history-q"><span>Q:</span> {h.query}</div>
                <div className="history-a"><span>A:</span> {h.reply}</div>
                <div className="history-actions">
                  <button className="account-button danger" onClick={() => deleteOne(h._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="panel">No history yet. Ask something in the chat.</div>
        )}
      </main>
    </div>
  );
}
