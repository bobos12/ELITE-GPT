import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Scale, Crown, User, Menu, Plus, Search, Trash2, Edit3, Copy, Download } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

function initialsFromEmail(email) {
  if (!email) return 'U';
  const name = String(email).split('@')[0] || '';
  const parts = name.split(/[._-]+/).filter(Boolean);
  const chars = (parts.length ? parts : [name]).join('');
  const a = chars[0] || 'U';
  const b = chars[1] || '';
  return (a + b).toUpperCase();
}

const EliteChat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authFetch, user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: "Welcome to ELITE. Ask your question about Egyptian law and I’ll help.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const messagesEndRef = useRef(null);

  const suggestedPrompts = [
    'What are the legal requirements for marriage in Egypt?',
    'How do I register a company in Egypt?',
    'What documents are needed for an Egyptian birth certificate?'
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setProfileOpen(false);
    setSidebarOpen(false);
  }, [location.pathname]);

  const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const loadChats = async () => {
    setIsLoadingChats(true);
    try {
      const res = await authFetch('/api/chat/chats');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      setChats(Array.isArray(data.chats) ? data.chats : []);
    } finally {
      setIsLoadingChats(false);
    }
  };

  const loadChat = async (id) => {
    const res = await authFetch(`/api/chat/chats/${id}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return;
    const m = (data.chat?.messages || []).map((x, idx) => ({
      id: `${id}_${idx}`,
      type: x.role === 'assistant' ? 'assistant' : 'user',
      content: x.content,
      timestamp: x.createdAt ? new Date(x.createdAt) : new Date()
    }));
    setMessages(
      m.length
        ? m
        : [
            {
              id: 1,
              type: 'assistant',
              content: "Welcome to ELITE. Ask your question about Egyptian law and Iâ€™ll help.",
              timestamp: new Date()
            }
          ]
    );
    setActiveChatId(id);
    setSidebarOpen(false);
  };

  useEffect(() => {
    (async () => {
      await loadChats();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isLoadingChats) return;
    if (activeChatId) return;
    if (chats.length) loadChat(chats[0].id);
    else newChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingChats, activeChatId]);

  const filteredChats = useMemo(() => {
    const q = chatSearch.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((c) => String(c.title || '').toLowerCase().includes(q));
  }, [chats, chatSearch]);

  const newChat = async () => {
    const res = await authFetch('/api/chat/chats', { method: 'POST', body: JSON.stringify({ title: 'New chat' }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return;
    const chat = data.chat;
    await loadChats();
    setActiveChatId(chat.id);
    setSidebarOpen(false);
    setMessages([
      {
        id: 1,
        type: 'assistant',
        content: "Welcome to ELITE. Ask your question about Egyptian law and Iâ€™ll help.",
        timestamp: new Date()
      }
    ]);
  };

  const renameChat = async (id) => {
    const current = chats.find((c) => c.id === id)?.title || '';
    const next = window.prompt('Rename chat', current);
    if (!next || !next.trim()) return;
    const res = await authFetch(`/api/chat/chats/${id}`, { method: 'PATCH', body: JSON.stringify({ title: next.trim() }) });
    if (res.ok) await loadChats();
  };

  const deleteChat = async (id) => {
    if (!window.confirm('Delete this chat?')) return;
    const res = await authFetch(`/api/chat/chats/${id}`, { method: 'DELETE' });
    if (!res.ok) return;
    const remaining = chats.filter((c) => c.id !== id);
    await loadChats();
    if (activeChatId === id) {
      setActiveChatId('');
      if (remaining.length) await loadChat(remaining[0].id);
      else await newChat();
    }
  };

  const copyConversation = async () => {
    const text = messages
      .map((m) => `${m.type === 'assistant' ? 'Assistant' : 'User'}: ${m.content}`)
      .join('\n\n')
      .trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  const exportTxt = () => {
    const text = messages
      .map((m) => `${m.type === 'assistant' ? 'Assistant' : 'User'}: ${m.content}`)
      .join('\n\n')
      .trim();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_${activeChatId || 'new'}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    const messageToSend = input.trim();
    if (!messageToSend) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageToSend,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setInput('');

    try {
      const res = await authFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend, chatId: activeChatId || undefined })
      });

      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      const content = data?.reply || (res.ok ? 'No reply.' : 'Server error.');
      const returnedChatId = data?.chatId;
      if (returnedChatId && returnedChatId !== activeChatId) setActiveChatId(returnedChatId);

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, type: 'assistant', content, timestamp: new Date() }
      ]);

      await loadChats();
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: 'assistant',
          content: 'Network error talking to server.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="elite-chat">
      <header className="elite-header">
        <button className="icon-btn" type="button" onClick={() => setSidebarOpen((v) => !v)} aria-label="Toggle sidebar">
          <Menu size={18} />
        </button>
        <button className="brand" type="button" onClick={() => navigate('/')} aria-label="Go to home">
          <Crown size={24} />
          <div>
            <div className="title">ELITE</div>
            <div className="subtitle">Legal AI Advisor</div>
          </div>
        </button>
        <div className="header-right">
          <button className="icon-btn" type="button" onClick={newChat} aria-label="New chat">
            <Plus size={18} />
          </button>
          <button className="icon-btn" type="button" onClick={copyConversation} aria-label="Copy conversation">
            <Copy size={18} />
          </button>
          <button className="icon-btn" type="button" onClick={exportTxt} aria-label="Export as txt">
            <Download size={18} />
          </button>
          <div className="status">
            <span className="dot" />
            <span>Online</span>
          </div>
          <div className="profile">
            <button
              className="profile-button"
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              title={user?.email || 'Profile'}
            >
              <span className="profile-avatar">{initialsFromEmail(user?.email)}</span>
            </button>
            {profileOpen && (
              <>
                <button className="profile-backdrop" type="button" onClick={() => setProfileOpen(false)} aria-label="Close profile menu" />
                <div className="profile-menu" role="menu">
                  <div className="profile-email">{user?.email}</div>
                  <button className="profile-item" type="button" onClick={() => navigate('/account')}>
                    Account & History
                  </button>
                  <button className="profile-item danger" type="button" onClick={logout}>
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="layout">
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sb-top">
            <button className="sb-new" type="button" onClick={newChat}>
              <Plus size={18} />
              New chat
            </button>
          </div>
          <div className="sb-search">
            <Search size={16} />
            <input value={chatSearch} onChange={(e) => setChatSearch(e.target.value)} placeholder="Search chats…" aria-label="Search chats" />
          </div>
          <div className="sb-list">
            {isLoadingChats ? (
              <div className="sb-empty">Loading…</div>
            ) : filteredChats.length ? (
              filteredChats.map((c) => (
                <div key={c.id} className={`sb-item ${c.id === activeChatId ? 'active' : ''}`}>
                  <button className="sb-item-main" type="button" onClick={() => loadChat(c.id)} title={c.title}>
                    <div className="sb-item-title">{c.title}</div>
                    <div className="sb-item-meta">{c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : ''}</div>
                  </button>
                  <button className="sb-item-icon" type="button" onClick={() => renameChat(c.id)} aria-label="Rename chat">
                    <Edit3 size={16} />
                  </button>
                  <button className="sb-item-icon danger" type="button" onClick={() => deleteChat(c.id)} aria-label="Delete chat">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            ) : (
              <div className="sb-empty">No chats yet.</div>
            )}
          </div>
          <div className="sb-bottom">
            <button className="sb-link" type="button" onClick={() => navigate('/account')}>My Cases / History</button>
            <button className="sb-link" type="button" onClick={() => navigate('/templates')}>Templates</button>
            <button className="sb-link" type="button" onClick={() => navigate('/document-generator')}>Document Generator</button>
            <button className="sb-link" type="button" onClick={() => navigate('/kb')}>Knowledge Base / FAQ</button>
          </div>
        </aside>
        {sidebarOpen ? <button className="sb-backdrop" type="button" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar" /> : null}

        <main className="elite-main">
        <div className="messages">
          {messages.map((m) => (
            <div key={m.id} className={`row ${m.type}`}>
              <div className="avatar">{m.type === 'assistant' ? <Scale size={18} /> : <User size={18} />}</div>
              <div className="bubble">
                <div className="meta">
                  <span className="name">{m.type === 'assistant' ? 'ELITE Legal AI' : 'You'}</span>
                  <span className="time">{formatTime(m.timestamp)}</span>
                </div>
                <div className="text">{m.content}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="row assistant">
              <div className="avatar">
                <Scale size={18} />
              </div>
              <div className="bubble">
                <div className="text typing">Thinking…</div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        </main>
      </div>

      <footer className="elite-footer">
        <div className="prompts">
          {suggestedPrompts.map((p) => (
            <button key={p} type="button" className="prompt" onClick={() => setInput(p)}>
              {p}
            </button>
          ))}
        </div>

        <form className="composer" onSubmit={handleSubmit}>
          <textarea
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a legal question..."
            rows={1}
          />
          <button className="send" type="submit" disabled={isLoading || !input.trim()}>
            <Send size={18} />
          </button>
        </form>

        <div className="disclaimer">
          ELITE Legal AI provides general information only. Consult a qualified lawyer before making legal decisions.
        </div>
      </footer>

      <style>{`
        .elite-chat { min-height: 100vh; display: flex; flex-direction: column; background: #0a0a0a; color: #fff; }
        .elite-header { display:flex; gap: .75rem; align-items:center; padding: 1rem 1.25rem; border-bottom: 1px solid rgba(255,215,0,0.2); background: rgba(0,0,0,0.6); backdrop-filter: blur(12px); position: sticky; top: 0; z-index: 20; }
        .brand { display:flex; gap: .75rem; align-items:center; background: transparent; border: none; color: inherit; cursor: pointer; padding: 0; }
        .title { font-weight: 800; letter-spacing: .18em; }
        .subtitle { font-size: .85rem; color: rgba(255,255,255,0.65); margin-top: .1rem; }
        .header-right { margin-left: auto; display:flex; gap: .6rem; align-items:center; flex-wrap: wrap; justify-content:flex-end; }
        .icon-btn { width: 40px; height: 40px; border-radius: 12px; border: 1px solid rgba(255,215,0,0.22); background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.9); cursor: pointer; display:grid; place-items:center; }
        .icon-btn:hover { border-color: rgba(255,215,0,0.45); }
        .status { display:flex; gap:.5rem; align-items:center; font-size:.9rem; color: rgba(255,255,255,0.8); }
        .dot { width: 10px; height: 10px; border-radius: 999px; background: #22c55e; box-shadow: 0 0 12px rgba(34,197,94,0.6); }

        .profile { position: relative; }
        .profile-button { background: transparent; border: none; cursor: pointer; padding: 0; }
        .profile-avatar { width: 38px; height: 38px; border-radius: 999px; display: grid; place-items: center; font-weight: 700; letter-spacing: .02em; color: rgba(255,255,255,0.95); border: 1px solid rgba(255,215,0,0.35); background: radial-gradient(circle at 30% 30%, rgba(255,215,0,0.22), rgba(255,255,255,0.04)); box-shadow: 0 0 0 4px rgba(255,215,0,0.06); }
        .profile-button:hover .profile-avatar { border-color: rgba(255,215,0,0.65); transform: translateY(-1px); }
        .profile-backdrop { position: fixed; inset: 0; background: transparent; border: none; z-index: 8; }
        .profile-menu { position: absolute; right: 0; top: calc(100% + 12px); width: min(320px, 86vw); border: 1px solid rgba(255,215,0,0.22); background: rgba(0,0,0,0.92); backdrop-filter: blur(12px); border-radius: 14px; padding: 10px; z-index: 9; box-shadow: 0 18px 50px rgba(0,0,0,0.45); }
        .profile-email { font-size: .85rem; color: rgba(255,255,255,0.7); padding: 8px 10px 10px; border-bottom: 1px solid rgba(255,215,0,0.12); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .profile-item { width: 100%; margin-top: 8px; height: 40px; border-radius: 12px; border: 1px solid rgba(255,215,0,0.18); background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.9); cursor: pointer; font-weight: 600; }
        .profile-item:hover { border-color: rgba(255,215,0,0.35); }
        .profile-item.danger { border-color: rgba(239,68,68,0.45); background: rgba(239,68,68,0.08); }
        .profile-item.danger:hover { border-color: rgba(239,68,68,0.7); }
        .layout { flex: 1; display:flex; min-height: 0; }
        .sidebar { width: 300px; flex: 0 0 300px; border-right: 1px solid rgba(255,215,0,0.16); background: rgba(0,0,0,0.55); backdrop-filter: blur(12px); padding: .9rem; display:flex; flex-direction:column; gap: .85rem; position: relative; z-index: 15; }
        .sb-top { display:flex; gap: .5rem; }
        .sb-new { width: 100%; height: 42px; border-radius: 12px; border: 1px solid rgba(255,215,0,0.25); background: linear-gradient(135deg, rgba(255,215,0,0.18), rgba(255,255,255,0.03)); color: rgba(255,255,255,0.95); cursor: pointer; display:flex; align-items:center; justify-content:center; gap: .5rem; font-weight: 800; }
        .sb-new:hover { border-color: rgba(255,215,0,0.5); }
        .sb-search { display:flex; align-items:center; gap: .5rem; border: 1px solid rgba(255,215,0,0.2); background: rgba(255,255,255,0.03); border-radius: 12px; padding: .55rem .7rem; color: rgba(255,255,255,0.6); }
        .sb-search input { background: transparent; border: none; outline: none; color: rgba(255,255,255,0.9); width: 100%; }
        .sb-list { flex: 1; overflow:auto; display:flex; flex-direction:column; gap: .4rem; padding-right: .2rem; }
        .sb-empty { color: rgba(255,255,255,0.6); padding: .6rem .2rem; }
        .sb-item { display:flex; gap: .35rem; align-items:stretch; }
        .sb-item-main { flex: 1; text-align:left; border: 1px solid rgba(255,215,0,0.14); background: rgba(255,255,255,0.02); border-radius: 12px; padding: .6rem .65rem; cursor: pointer; color: rgba(255,255,255,0.9); }
        .sb-item.active .sb-item-main { border-color: rgba(255,215,0,0.55); background: rgba(255,215,0,0.08); }
        .sb-item-title { font-weight: 800; font-size: .92rem; line-height: 1.2; overflow:hidden; text-overflow: ellipsis; white-space: nowrap; }
        .sb-item-meta { margin-top: .2rem; color: rgba(255,255,255,0.55); font-size: .78rem; }
        .sb-item-icon { width: 38px; border-radius: 12px; border: 1px solid rgba(255,215,0,0.14); background: rgba(255,255,255,0.02); cursor: pointer; display:grid; place-items:center; color: rgba(255,255,255,0.8); }
        .sb-item-icon:hover { border-color: rgba(255,215,0,0.4); }
        .sb-item-icon.danger { border-color: rgba(239,68,68,0.35); color: rgba(255,200,200,0.9); }
        .sb-item-icon.danger:hover { border-color: rgba(239,68,68,0.7); }
        .sb-bottom { border-top: 1px solid rgba(255,215,0,0.12); padding-top: .75rem; display:grid; gap: .4rem; }
        .sb-link { height: 38px; border-radius: 12px; border: 1px solid rgba(255,215,0,0.14); background: rgba(255,255,255,0.02); color: rgba(255,255,255,0.85); cursor:pointer; text-align:left; padding: 0 .7rem; }
        .sb-link:hover { border-color: rgba(255,215,0,0.35); }
        .sb-backdrop { display:none; }

        .elite-main { flex: 1; padding: 1.25rem; overflow:auto; }
        .messages { max-width: 980px; margin: 0 auto; display:flex; flex-direction:column; gap: .9rem; }
        .row { display:flex; gap: .75rem; align-items:flex-start; }
        .row.user { flex-direction: row-reverse; }
        .avatar { width: 34px; height: 34px; border-radius: 12px; display:flex; align-items:center; justify-content:center; border: 1px solid rgba(255,215,0,0.25); background: rgba(255,215,0,0.06); }
        .bubble { max-width: min(760px, 92%); border: 1px solid rgba(255,215,0,0.2); background: rgba(255,255,255,0.04); border-radius: 16px; padding: .75rem .9rem; }
        .row.user .bubble { background: rgba(255,215,0,0.08); }
        .meta { display:flex; justify-content:space-between; gap: 1rem; margin-bottom: .35rem; color: rgba(255,255,255,0.65); font-size:.8rem; }
        .text { white-space: pre-wrap; line-height: 1.55; }
        .typing { color: rgba(255,255,255,0.7); }
        .elite-footer { border-top: 1px solid rgba(255,215,0,0.2); padding: 1rem 1.25rem; background: rgba(0,0,0,0.65); backdrop-filter: blur(12px); }
        .prompts { max-width: 980px; margin: 0 auto .75rem; display:flex; gap: .5rem; flex-wrap: wrap; }
        .prompt { background: rgba(255,215,0,0.08); border: 1px solid rgba(255,215,0,0.2); color: rgba(255,255,255,0.9); padding: .4rem .6rem; border-radius: 999px; cursor: pointer; font-size: .85rem; }
        .prompt:hover { border-color: rgba(255,215,0,0.35); }
        .composer { max-width: 980px; margin: 0 auto; display:flex; gap: .6rem; align-items:flex-end; }
        .input { flex:1; resize:none; min-height: 48px; max-height: 140px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,215,0,0.25); color: #fff; border-radius: 14px; padding: .75rem .9rem; outline: none; }
        .input:focus { border-color: rgba(255,215,0,0.55); box-shadow: 0 0 0 4px rgba(255,215,0,0.12); }
        .send { width: 48px; height: 48px; border-radius: 14px; border: none; background: linear-gradient(135deg, #ffd700, #ffed4e); cursor:pointer; display:flex; align-items:center; justify-content:center; }
        .send:disabled { background: #444; color: #aaa; cursor: not-allowed; }
        .disclaimer { max-width: 980px; margin: .7rem auto 0; color: rgba(255,255,255,0.55); font-size: .8rem; line-height: 1.4; }

        @media (max-width: 900px) {
          .sidebar { position: fixed; left: 0; top: 0; bottom: 0; transform: translateX(-105%); transition: transform .18s ease; width: min(86vw, 320px); z-index: 40; }
          .sidebar.open { transform: translateX(0); }
          .sb-backdrop { display:block; position: fixed; inset: 0; background: rgba(0,0,0,0.45); border: none; z-index: 30; }
          .elite-main { padding: 1rem; }
        }
      `}</style>
    </div>
  );
};

export default EliteChat;
