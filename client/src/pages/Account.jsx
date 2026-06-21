import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText, MessageSquare, Download, Trash2,
  Scale, ArrowRight, LogOut, Clock, ExternalLink,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import './Account.css';

function formatDate(d) {
  try {
    return new Date(d).toLocaleDateString('ar-EG', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch { return ''; }
}

function initialsFromEmail(email) {
  const name = String(email || '').split('@')[0] || '';
  const parts = name.split(/[._-]+/).filter(Boolean);
  const chars = (parts.length ? parts : [name]).join('');
  return ((chars[0] || 'U') + (chars[1] || '')).toUpperCase();
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export default function Account() {
  const { user, logout, authFetch } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('chats');
  const [chats, setChats] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setError('');
      setIsLoading(true);
      try {
        const [cRes, dRes, hRes] = await Promise.all([
          authFetch('/api/chat/chats'),
          authFetch('/api/documents'),
          authFetch('/api/user/history'),
        ]);
        const cData = await cRes.json().catch(() => ({}));
        const dData = await dRes.json().catch(() => ({}));
        const hData = await hRes.json().catch(() => ({}));
        if (cRes.ok) setChats(Array.isArray(cData.chats) ? cData.chats : []);
        if (dRes.ok) setDocuments(Array.isArray(dData.documents) ? dData.documents : []);
        if (hRes.ok) setHistory(Array.isArray(hData.history) ? hData.history : []);
        if (!cRes.ok || !dRes.ok) setError('حدث خطأ أثناء تحميل البيانات.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [authFetch]);

  const downloadDoc = async (id) => {
    const res = await authFetch(`/api/documents/${id}/download`);
    if (!res.ok) return;
    const filename = res.headers.get('x-filename') || 'document.pdf';
    const blob = await res.blob();
    downloadBlob(blob, filename);
  };

  const deleteDoc = async (id) => {
    if (!window.confirm('هل تريد حذف هذه الوثيقة؟')) return;
    const res = await authFetch(`/api/documents/${id}`, { method: 'DELETE' });
    if (res.ok) setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const TABS = [
    { id: 'chats', label: 'المحادثات', icon: MessageSquare, count: chats.length },
    { id: 'documents', label: 'وثائقي', icon: FileText, count: documents.length },
    { id: 'history', label: 'سجل الأسئلة', icon: Clock, count: history.length },
  ];

  return (
    <div className="acc-root" dir="rtl">
      <div className="acc-inner">

        {/* Profile card */}
        <motion.div
          className="acc-profile-card"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="acc-avatar">{initialsFromEmail(user?.email)}</div>
          <div className="acc-profile-info">
            <div className="acc-profile-name">{user?.email?.split('@')[0]}</div>
            <div className="acc-profile-email">{user?.email}</div>
          </div>
          <div className="acc-profile-actions">
            <button className="acc-btn-ghost" onClick={() => navigate('/chat')}>
              <Scale size={15} /> الاستشارات
            </button>
            <button className="acc-btn-ghost" onClick={() => navigate('/dashboard')}>
              <ArrowRight size={15} /> لوحة التحكم
            </button>
            <button className="acc-btn-danger" onClick={logout}>
              <LogOut size={15} /> خروج
            </button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="acc-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`acc-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <t.icon size={15} />
              <span>{t.label}</span>
              {t.count > 0 && <span className="acc-tab-badge">{t.count}</span>}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="acc-content">
          {error && <div className="acc-error">{error}</div>}

          {isLoading ? (
            <div className="acc-loading">
              {[1,2,3].map(i => <div key={i} className="acc-skeleton" />)}
            </div>
          ) : (
            <>
              {/* Chats */}
              {tab === 'chats' && (
                <div className="acc-list">
                  {chats.length === 0 ? (
                    <div className="acc-empty">
                      <MessageSquare size={40} />
                      <p>لا توجد محادثات بعد. ابدأ استشارتك الأولى.</p>
                      <button className="acc-btn-primary" onClick={() => navigate('/chat')}>
                        ابدأ محادثة
                      </button>
                    </div>
                  ) : chats.map((c, i) => (
                    <motion.div
                      key={c.id}
                      className="acc-item"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <div className="acc-item-icon"><MessageSquare size={16} /></div>
                      <div className="acc-item-body">
                        <div className="acc-item-title">{c.title || 'محادثة'}</div>
                        <div className="acc-item-date">{formatDate(c.updatedAt || c.createdAt)}</div>
                      </div>
                      <Link className="acc-item-action" to="/chat" state={{ chatId: c.id }}>
                        <ExternalLink size={14} /> فتح
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Documents */}
              {tab === 'documents' && (
                <div className="acc-list">
                  {documents.length === 0 ? (
                    <div className="acc-empty">
                      <FileText size={40} />
                      <p>لا توجد وثائق منشأة بعد.</p>
                      <button className="acc-btn-primary" onClick={() => navigate('/document-generator')}>
                        أنشئ وثيقة
                      </button>
                    </div>
                  ) : documents.map((d, i) => (
                    <motion.div
                      key={d.id}
                      className="acc-item"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <div className="acc-item-icon acc-item-icon--gold"><FileText size={16} /></div>
                      <div className="acc-item-body">
                        <div className="acc-item-title">{d.title}</div>
                        <div className="acc-item-date">{formatDate(d.createdAt)}</div>
                      </div>
                      <div className="acc-item-actions">
                        <button className="acc-item-action" onClick={() => downloadDoc(d.id)}>
                          <Download size={14} /> تنزيل
                        </button>
                        <button className="acc-item-action danger" onClick={() => deleteDoc(d.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* History */}
              {tab === 'history' && (
                <div className="acc-list">
                  {history.length === 0 ? (
                    <div className="acc-empty">
                      <Clock size={40} />
                      <p>لا يوجد سجل أسئلة بعد.</p>
                    </div>
                  ) : history.map((h, i) => (
                    <motion.div
                      key={h.id || i}
                      className="acc-item acc-item--history"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <div className="acc-item-body">
                        <div className="acc-item-title">
                          <span className="acc-history-q">س: </span>
                          {String(h.query || '').slice(0, 120)}{h.query?.length > 120 ? '…' : ''}
                        </div>
                        <div className="acc-item-reply">
                          <span className="acc-history-a">ج: </span>
                          {String(h.reply || '').slice(0, 160)}{h.reply?.length > 160 ? '…' : ''}
                        </div>
                        <div className="acc-item-date">{formatDate(h.createdAt)}</div>
                      </div>
                      <Link className="acc-item-action" to="/chat" state={{ chatId: h.chatId }}>
                        <ExternalLink size={14} /> فتح
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
