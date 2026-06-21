import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scale, MessageSquare, Bookmark, Plus, FileText, BookOpen,
  Zap, ArrowRight, TrendingUp,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../auth/AuthContext';
import { useApp } from '../context/AppContext';
import './Dashboard.css';

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <motion.div
      className="db-stat"
      style={{ '--accent': accent }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="db-stat-icon"><Icon size={20} /></div>
      <div className="db-stat-body">
        <div className="db-stat-value">{value}</div>
        <div className="db-stat-label">{label}</div>
      </div>
    </motion.div>
  );
}

const QUICK = [
  { icon: Plus,      label: 'استشارة جديدة',   path: '/chat',               primary: true },
  { icon: FileText,  label: 'نماذج قانونية',    path: '/templates' },
  { icon: Zap,       label: 'منشئ المستندات',   path: '/document-generator' },
  { icon: BookOpen,  label: 'قاعدة المعرفة',    path: '/kb' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { authFetch, user } = useAuth();
  const { favorites } = useApp();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/chat/chats')
      .then(r => r.json())
      .then(d => setChats(d.chats || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authFetch]);

  const recentChats = chats.slice(0, 6);
  const recentFavs = favorites.slice(0, 4);
  const username = user?.email?.split('@')[0] || '';

  return (
    <div className="db-root" dir="rtl">
      <div className="db-inner">

        {/* Header */}
        <motion.div
          className="db-header"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="db-header-brand">
            <div className="db-brand-icon"><Scale size={22} /></div>
            <div>
              <h1 className="db-title">لوحة التحكم</h1>
              <p className="db-subtitle">
                مرحباً{username ? ` ${username}` : ''}، ما الذي يمكنني مساعدتك به اليوم؟
              </p>
            </div>
          </div>
          <button className="db-back-btn" type="button" onClick={() => navigate('/chat')}>
            <Plus size={15} />
            <span>استشارة جديدة</span>
          </button>
        </motion.div>

        {/* Stats */}
        <div className="db-stats">
          <StatCard
            icon={MessageSquare}
            label="إجمالي المحادثات"
            value={loading ? '—' : chats.length}
            accent="var(--jade-500)"
          />
          <StatCard
            icon={Bookmark}
            label="الردود المحفوظة"
            value={favorites.length}
            accent="#8B5CF6"
          />
          <StatCard
            icon={TrendingUp}
            label="المساعد القانوني"
            value="متاح"
            accent="var(--jade-400)"
          />
        </div>

        {/* Quick actions */}
        <section className="db-section">
          <h2 className="db-section-title">إجراءات سريعة</h2>
          <div className="db-quick-grid">
            {QUICK.map((q, i) => (
              <motion.button
                key={q.path}
                className={`db-quick-btn ${q.primary ? 'primary' : ''}`}
                type="button"
                onClick={() => navigate(q.path)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
              >
                <q.icon size={18} />
                <span>{q.label}</span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Two-column */}
        <div className="db-two-col">

          {/* Recent chats */}
          <section className="db-section">
            <div className="db-section-header">
              <h2 className="db-section-title">المحادثات الأخيرة</h2>
              <button className="db-see-all" type="button" onClick={() => navigate('/chat')}>
                عرض الكل <ArrowRight size={13} />
              </button>
            </div>

            {loading ? (
              <div className="db-skeletons">
                {[1, 2, 3].map(n => <div key={n} className="db-skeleton" />)}
              </div>
            ) : recentChats.length ? (
              <div className="db-chat-list">
                {recentChats.map((c, i) => (
                  <motion.button
                    key={c.id}
                    className="db-chat-item"
                    type="button"
                    onClick={() => navigate('/chat', { state: { chatId: c.id } })}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.04 }}
                  >
                    <div className="db-chat-icon"><MessageSquare size={14} /></div>
                    <div className="db-chat-info">
                      <div className="db-chat-title">{c.title || 'محادثة جديدة'}</div>
                      <div className="db-chat-date">
                        {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString('ar-EG') : ''}
                      </div>
                    </div>
                    <ArrowRight size={13} className="db-chat-arrow" />
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="db-empty">
                <MessageSquare size={32} />
                <p>لا توجد محادثات بعد</p>
                <button className="db-empty-cta" type="button" onClick={() => navigate('/chat')}>
                  ابدأ محادثتك الأولى
                </button>
              </div>
            )}
          </section>

          {/* Saved responses */}
          <section className="db-section">
            <div className="db-section-header">
              <h2 className="db-section-title">الردود المحفوظة</h2>
            </div>

            {recentFavs.length ? (
              <div className="db-fav-list">
                {recentFavs.map((f, i) => (
                  <motion.div
                    key={f.id}
                    className="db-fav-item"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.04 }}
                  >
                    <Bookmark size={13} className="db-fav-icon" />
                    <p className="db-fav-text">
                      {String(f.content || '').slice(0, 120)}{f.content?.length > 120 ? '…' : ''}
                    </p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="db-empty">
                <Bookmark size={32} />
                <p>لا توجد ردود محفوظة بعد</p>
                <p className="db-empty-hint">يمكنك حفظ أي رد من صفحة المحادثة</p>
              </div>
            )}
          </section>
        </div>

      </div>
    </div>
  );
}
