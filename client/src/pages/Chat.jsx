import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Send, Scale, User, Menu, Plus, Search, Trash2, Edit3,
  Copy, Star, StarOff, RefreshCw, Lightbulb, ChevronRight,
  Settings, FileText, X, MessageSquare, Bookmark, LayoutDashboard,
  Globe, AlignLeft, Paperclip, AlertCircle, Building2, HardHat,
  Landmark, Home, Shield, ThumbsUp, ThumbsDown, Bot,
  LogOut, BookOpen, ChevronDown, BookMarked, CheckCircle2,
  MinusCircle, XCircle, ChevronUp,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../auth/AuthContext';
import { useApp } from '../context/AppContext';
import MarkdownRenderer from '../component/MarkdownRenderer/MarkdownRenderer';
import Toasts from '../component/Toast/Toast';
import SpeechToTextButton from '../component/SpeechToText/SpeechToTextButton';
import './Chat.css';

// ─── constants ───────────────────────────────────────────────────────────────
const WELCOME_CARDS = [
  {
    label: 'الأحوال الشخصية',
    desc: 'الزواج والطلاق وقانون الأسرة المصري',
    Icon: Scale,
    query: 'ما هي إجراءات الطلاق والخلع وأحكام الحضانة في القانون المصري؟',
  },
  {
    label: 'تأسيس الشركات',
    desc: 'تسجيل الشركات والمؤسسات في مصر',
    Icon: Building2,
    query: 'ما هي شروط تأسيس شركة ذات مسؤولية محدودة في مصر ورأس المال المطلوب؟',
  },
  {
    label: 'قانون العمل',
    desc: 'حقوق الموظف وفق قانون العمل رقم 12/2003',
    Icon: HardHat,
    query: 'ما هي حقوق العامل في الإجازة السنوية ومكافأة نهاية الخدمة وفق قانون العمل المصري رقم 12 لسنة 2003؟',
  },
  {
    label: 'رفع الدعاوى',
    desc: 'إجراءات التقاضي والمحاكم الابتدائية',
    Icon: Landmark,
    query: 'كيف يُقدَّم البلاغ الجنائي وما هي إجراءات رفع الدعوى أمام النيابة العامة في مصر؟',
  },
  {
    label: 'الملكية والعقارات',
    desc: 'توثيق العقود وسندات الملكية العقارية',
    Icon: Home,
    query: 'ما هي إجراءات نقل ملكية العقار وتسجيله في الشهر العقاري وفق القانون المصري؟',
  },
  {
    label: 'الجرائم والعقوبات',
    desc: 'التشريعات الجنائية وقانون العقوبات',
    Icon: Shield,
    query: 'ما هي عقوبة النصب والاحتيال وجرائم الاستيلاء على المال في قانون العقوبات المصري؟',
  },
];

const GROUP_LABELS = {
  today: 'اليوم',
  yesterday: 'أمس',
  thisWeek: 'هذا الأسبوع',
  earlier: 'سابقاً',
};

// ─── helpers ─────────────────────────────────────────────────────────────────
function initialsFromEmail(email) {
  if (!email) return 'U';
  const name = String(email).split('@')[0] || '';
  const parts = name.split(/[._-]+/).filter(Boolean);
  const chars = (parts.length ? parts : [name]).join('');
  return ((chars[0] || 'U') + (chars[1] || '')).toUpperCase();
}

function titleFromText(text) {
  const raw = String(text || '').replace(/\s+/g, ' ').trim();
  if (!raw) return 'محادثة جديدة';
  const cleaned = raw.replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  const stop = new Set(['a','an','the','and','or','but','to','of','in','on','for','with','is','are','i','me','you','ما','هل','كيف','متى','من','هذا','هذه','في','على','عن','ا','و','أن']);
  const words = cleaned.split(' ').filter(Boolean).filter(w => !stop.has(w.toLowerCase())).slice(0, 6).join(' ');
  const t = words || raw;
  return t.length > 52 ? `${t.slice(0, 52).trim()}…` : t;
}

function groupChatsByDate(chats) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today); lastWeek.setDate(lastWeek.getDate() - 7);
  const groups = { today: [], yesterday: [], thisWeek: [], earlier: [] };
  for (const c of chats) {
    const d = new Date(c.createdAt || c.updatedAt || Date.now());
    if (d >= today) groups.today.push(c);
    else if (d >= yesterday) groups.yesterday.push(c);
    else if (d >= lastWeek) groups.thisWeek.push(c);
    else groups.earlier.push(c);
  }
  return groups;
}

function formatTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// ─── component ───────────────────────────────────────────────────────────────
export default function EliteChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authFetch, user, logout } = useAuth();
  const { favorites, addFavorite, removeFavorite, isFavorite, settings, updateSettings, addToast } = useApp();

  // sidebar
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [sidebarPanel, setSidebarPanel] = useState('chats');
  const [chatSearch, setChatSearch] = useState('');

  // chats
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState('');
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  // messages & streaming
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingId, setStreamingId] = useState(null);
  const [streamingText, setStreamingText] = useState('');
  const animFrameRef = useRef(null);

  // input
  const [input, setInput] = useState('');

  // document
  const [uploadedDoc, setUploadedDoc] = useState(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docModalOpen, setDocModalOpen] = useState(false);

  // UI
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // reactions
  const [likedMsgs, setLikedMsgs] = useState(new Set());
  const [dislikedMsgs, setDislikedMsgs] = useState(new Set());

  // STT
  const [sttError, setSttError] = useState('');
  const [sttState, setSttState] = useState({ mode: '', isActive: false, isTranscribing: false });
  const sttBaseRef = useRef('');
  const [sttStopSignal, setSttStopSignal] = useState(0);

  // refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const renameInputRef = useRef(null);

  // ── responsive sidebar ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 1024) setSidebarOpen(true); };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // ── scroll to bottom ──────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, isLoading]);

  // ── auto-resize textarea ──────────────────────────────────────────────────
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(44, Math.min(el.scrollHeight, 180))}px`;
  }, [input]);

  // ── close overlays on route change ───────────────────────────────────────
  useEffect(() => {
    setProfileOpen(false);
    setSettingsOpen(false);
    setDocModalOpen(false);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, [location.pathname]);

  // ── focus rename input ────────────────────────────────────────────────────
  useEffect(() => {
    if (renamingId) renameInputRef.current?.focus();
  }, [renamingId]);

  // ── open chat from router state ───────────────────────────────────────────
  useEffect(() => {
    const requested = location.state?.chatId;
    if (!requested || isLoadingChats || !chats.length || requested === activeChatId) return;
    if (chats.some(c => c.id === requested)) loadChat(requested);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, isLoadingChats, chats]);

  // ── streaming cleanup ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, []);

  // ── data loading ──────────────────────────────────────────────────────────
  const loadChats = useCallback(async () => {
    setIsLoadingChats(true);
    try {
      const res = await authFetch('/api/chat/chats');
      const data = await res.json().catch(() => ({}));
      if (res.ok) setChats(Array.isArray(data.chats) ? data.chats : []);
    } finally {
      setIsLoadingChats(false);
    }
  }, [authFetch]);

  const loadChat = useCallback(async (id) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setStreamingId(null);
    setStreamingText('');
    const res = await authFetch(`/api/chat/chats/${id}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return;
    const msgs = (data.chat?.messages || []).map((x, idx) => ({
      id: `${id}_${idx}`,
      type: x.role === 'assistant' ? 'assistant' : 'user',
      content: x.content,
      timestamp: x.createdAt ? new Date(x.createdAt) : new Date(),
    }));
    setMessages(msgs);
    setActiveChatId(id);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, [authFetch]);

  useEffect(() => {
    (async () => { await loadChats(); })();
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
    return chats.filter(c => String(c.title || '').toLowerCase().includes(q));
  }, [chats, chatSearch]);

  const filteredFavs = useMemo(() => {
    const q = chatSearch.trim().toLowerCase();
    if (!q) return favorites;
    return favorites.filter(f => String(f.content || '').toLowerCase().includes(q));
  }, [favorites, chatSearch]);

  const groupedChats = useMemo(() => groupChatsByDate(filteredChats), [filteredChats]);

  // ── chat operations ───────────────────────────────────────────────────────
  const newChat = useCallback(async () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setStreamingId(null);
    setStreamingText('');
    const res = await authFetch('/api/chat/chats', { method: 'POST', body: JSON.stringify({ title: 'محادثة جديدة' }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return;
    await loadChats();
    setActiveChatId(data.chat.id);
    setMessages([]);
    if (window.innerWidth < 1024) setSidebarOpen(false);
    setUploadedDoc(null);
  }, [authFetch, loadChats]);

  const commitRename = useCallback(async () => {
    const id = renamingId;
    const title = renameValue.trim();
    setRenamingId(null);
    if (!title || !id) return;
    const res = await authFetch(`/api/chat/chats/${id}`, { method: 'PATCH', body: JSON.stringify({ title }) });
    if (res.ok) await loadChats();
  }, [renamingId, renameValue, authFetch, loadChats]);

  const deleteChat = useCallback(async (id) => {
    const res = await authFetch(`/api/chat/chats/${id}`, { method: 'DELETE' });
    if (!res.ok) return;
    const remaining = chats.filter(c => c.id !== id);
    await loadChats();
    if (activeChatId === id) {
      setActiveChatId('');
      if (remaining.length) await loadChat(remaining[0].id);
      else await newChat();
    }
    addToast('تم حذف المحادثة', 'success');
  }, [authFetch, chats, activeChatId, loadChats, loadChat, newChat, addToast]);

  const maybeUpdateChatTitle = useCallback(async ({ chatId, title }) => {
    if (!chatId || !title) return;
    const current = chats.find(c => c.id === chatId)?.title || '';
    if (String(current).trim().toLowerCase() !== 'محادثة جديدة' && String(current).trim() !== '') return;
    try {
      await authFetch(`/api/chat/chats/${chatId}`, { method: 'PATCH', body: JSON.stringify({ title }) });
      await loadChats();
    } catch {}
  }, [chats, authFetch, loadChats]);

  // ── streaming animation ───────────────────────────────────────────────────
  const startStreaming = useCallback((content, msgId) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    const total = content.length;
    const targetMs = Math.min(2400, Math.max(600, total * 10));
    const charsPerFrame = Math.max(1, Math.ceil(total / ((targetMs / 1000) * 60)));
    setStreamingId(msgId);
    setStreamingText('');
    let idx = 0;
    const tick = () => {
      idx = Math.min(idx + charsPerFrame, total);
      setStreamingText(content.slice(0, idx));
      if (idx < total) { animFrameRef.current = requestAnimationFrame(tick); }
      else { setStreamingId(null); setStreamingText(''); }
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  // ── send message ──────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    if (isLoading || streamingId) return;
    const text = input.trim();
    if (!text) return;

    if (sttState.isActive) setSttStopSignal(n => n + 1);
    sttBaseRef.current = '';

    let apiMsg = text;
    if (uploadedDoc?.text) {
      apiMsg = `[المستند: ${uploadedDoc.name}]\n\n${uploadedDoc.text}\n\n---\n\nسؤال المستخدم: ${text}`;
    }

    const userMsg = { id: Date.now(), type: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setInput('');
    inputRef.current?.focus();

    try {
      const res = await authFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: apiMsg, chatId: activeChatId || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) { logout(); navigate('/login', { replace: true }); return; }

      const content = data?.reply || (res.ok ? 'لا توجد إجابة.' : 'خطأ في الخادم.');
      const returnedId = data?.chatId;
      if (returnedId && returnedId !== activeChatId) setActiveChatId(returnedId);

      const assistantMsg = {
        id: Date.now() + 1,
        type: 'assistant',
        content,
        timestamp: new Date(),
        citations: data?.citations || [],
        confidence: data?.confidence || 'medium',
        confidenceReason: data?.confidenceReason || '',
        isOutOfScope: data?.isOutOfScope || false,
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsLoading(false);
      startStreaming(content, assistantMsg.id);

      await loadChats();
      await maybeUpdateChatTitle({ chatId: returnedId || activeChatId, title: titleFromText(text) });
    } catch {
      setIsLoading(false);
      setMessages(prev => [...prev, {
        id: Date.now() + 1, type: 'assistant',
        content: 'خطأ في الشبكة. يرجى التحقق من الاتصال والمحاولة مرة أخرى.',
        timestamp: new Date(),
      }]);
    }
  }, [isLoading, streamingId, input, sttState.isActive, uploadedDoc, activeChatId, authFetch, logout, navigate, startStreaming, loadChats, maybeUpdateChatTitle]);

  // ── message actions ───────────────────────────────────────────────────────
  const copyMsg = useCallback(async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      addToast('تم النسخ إلى الحافظة', 'success');
    } catch { addToast('فشل النسخ', 'error'); }
  }, [addToast]);

  const toggleFavorite = useCallback((msg) => {
    if (isFavorite(msg.id)) {
      removeFavorite(msg.id);
      addToast('تم إزالة الرد من المحفوظات', 'info');
    } else {
      addFavorite(msg);
      addToast('تم حفظ الرد', 'success');
    }
  }, [isFavorite, removeFavorite, addFavorite, addToast]);

  const toggleLike = useCallback((id) => {
    setLikedMsgs(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
    setDislikedMsgs(prev => { const n = new Set(prev); n.delete(id); return n; });
  }, []);

  const toggleDislike = useCallback((id) => {
    setDislikedMsgs(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
    setLikedMsgs(prev => { const n = new Set(prev); n.delete(id); return n; });
  }, []);

  const sendAction = useCallback(async (prompt, userLabel) => {
    if (isLoading || streamingId) return;
    const userMsg = { id: Date.now(), type: 'user', content: userLabel, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    try {
      const res = await authFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, chatId: activeChatId || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      const content = data?.reply || 'لا توجد إجابة.';
      const assistantMsg = {
        id: Date.now() + 1,
        type: 'assistant',
        content,
        timestamp: new Date(),
        citations: data?.citations || [],
        confidence: data?.confidence || 'medium',
        confidenceReason: data?.confidenceReason || '',
        isOutOfScope: data?.isOutOfScope || false,
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsLoading(false);
      startStreaming(content, assistantMsg.id);
    } catch {
      setIsLoading(false);
    }
  }, [isLoading, streamingId, activeChatId, authFetch, startStreaming]);

  const regenerate = useCallback((msgIdx) => {
    const userMsg = messages.slice(0, msgIdx).reverse().find(m => m.type === 'user');
    if (!userMsg) return;
    setMessages(prev => prev.slice(0, msgIdx));
    sendAction(userMsg.content, 'إعادة توليد الإجابة');
  }, [messages, sendAction]);

  const explainSimply = useCallback((content, originalQuestion) => {
    const topic = originalQuestion ? `الموضوع القانوني: ${originalQuestion}\n\n` : '';
    sendAction(
      `${topic}اشرح الإجابة القانونية التالية بأسلوب بسيط يفهمه شخص عادي وبدون مصطلحات قانونية معقدة، مع الإبقاء على الدقة القانونية:\n\n${content}`,
      'اشرح بأسلوب أبسط'
    );
  }, [sendAction]);

  const continueResponse = useCallback((content, originalQuestion) => {
    const topic = originalQuestion ? `الموضوع القانوني: ${originalQuestion}\n\n` : '';
    sendAction(
      `${topic}أكمل الإجابة القانونية التالية بإضافة تفاصيل قانونية إضافية من القانون المصري مع الاستشهاد بالمواد ذات الصلة. لا تُعِد كتابة ما سبق ذكره، بل أضف فقط ما لم يُذكَر:\n\n${content}`,
      'أكمل الإجابة'
    );
  }, [sendAction]);

  // ── document upload ───────────────────────────────────────────────────────
  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (file.size > 10 * 1024 * 1024) { addToast('حجم الملف أكبر من 10 ميغابايت', 'error'); return; }
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowed.includes(file.type)) { addToast('يرجى رفع ملف PDF أو DOCX أو TXT', 'error'); return; }
    setIsUploadingDoc(true);
    addToast(`جاري تحميل: ${file.name}`, 'info');
    try {
      const fd = new FormData();
      fd.append('document', file);
      const res = await authFetch('/api/analyze/upload', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { addToast(data.error || 'فشل تحليل المستند', 'error'); return; }
      setUploadedDoc({ name: file.name, text: data.text, truncated: data.truncated });
      setDocModalOpen(true);
      addToast(`تم تحميل: ${file.name}`, 'success');
    } catch { addToast('خطأ في رفع الملف', 'error'); }
    finally { setIsUploadingDoc(false); }
  }, [authFetch, addToast]);

  const summarizeDoc = useCallback(() => {
    if (!uploadedDoc) return;
    setDocModalOpen(false);
    sendAction(
      `قم بتلخيص المستند التالي بشكل شامل ومنظم، مع إبراز النقاط القانونية الرئيسية:\n\n[المستند: ${uploadedDoc.name}]\n\n${uploadedDoc.text}`,
      `تلخيص: ${uploadedDoc.name}`
    );
  }, [uploadedDoc, sendAction]);

  // ── STT ──────────────────────────────────────────────────────────────────
  const handleSttState = useCallback((next) => {
    if (next.isActive && !sttState.isActive) { sttBaseRef.current = input; setSttError(''); }
    setSttState(next);
  }, [sttState.isActive, input]);

  const handleSttText = useCallback(({ text, isFinal }) => {
    const t = String(text || '').trim();
    if (!t) return;
    setInput(() => {
      const base = String(sttBaseRef.current || '').trim();
      const combined = base ? `${base} ${t}` : t;
      if (isFinal) sttBaseRef.current = combined;
      return combined;
    });
  }, []);

  // ── keyboard ──────────────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
  }, [handleSubmit]);

  // ── citation panel state ──────────────────────────────────────────────────
  const [expandedCitations, setExpandedCitations] = useState(new Set());
  const [openArticles, setOpenArticles] = useState(new Set());

  const toggleCitations = useCallback((msgId) => {
    setExpandedCitations(prev => {
      const n = new Set(prev);
      n.has(msgId) ? n.delete(msgId) : n.add(msgId);
      return n;
    });
  }, []);

  const toggleArticle = useCallback((key) => {
    setOpenArticles(prev => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  }, []);

  // ── computed ──────────────────────────────────────────────────────────────
  const showWelcome = messages.length === 0;
  const charCount = input.length;
  const MAX_CHARS = 4000;
  const activeTitle = chats.find(c => c.id === activeChatId)?.title || '';

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <div className="ec-root" dir="rtl">
      <Toasts />

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && window.innerWidth < 1024 && (
          <motion.div
            className="ec-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      <aside className={`ec-sidebar ${sidebarOpen ? 'ec-sidebar--open' : ''}`} aria-label="القائمة الجانبية">

        {/* Brand */}
        <div className="ec-sb-brand">
          <div className="ec-sb-logo"><Scale size={16} /></div>
          <div className="ec-sb-brand-text">
            <span className="ec-sb-wordmark">ELITE</span>
            <span className="ec-sb-tagline">Legal AI</span>
          </div>
          <button className="ec-sb-close" type="button" onClick={() => setSidebarOpen(false)} aria-label="إغلاق">
            <X size={15} />
          </button>
        </div>

        {/* New chat */}
        <div className="ec-sb-new-wrap">
          <button className="ec-sb-new" type="button" onClick={newChat}>
            <Plus size={15} />
            <span>استشارة جديدة</span>
          </button>
        </div>

        {/* Search */}
        <div className="ec-sb-search">
          <Search size={13} className="ec-sb-search-icon" />
          <input
            value={chatSearch}
            onChange={e => setChatSearch(e.target.value)}
            placeholder="بحث في المحادثات…"
            aria-label="بحث"
          />
          {chatSearch && (
            <button className="ec-sb-search-clear" onClick={() => setChatSearch('')} aria-label="مسح">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="ec-sb-tabs" role="tablist">
          <button role="tab" aria-selected={sidebarPanel === 'chats'}
            className={`ec-sb-tab ${sidebarPanel === 'chats' ? 'active' : ''}`}
            onClick={() => setSidebarPanel('chats')}>
            <MessageSquare size={12} /> المحادثات
          </button>
          <button role="tab" aria-selected={sidebarPanel === 'favs'}
            className={`ec-sb-tab ${sidebarPanel === 'favs' ? 'active' : ''}`}
            onClick={() => setSidebarPanel('favs')}>
            <Bookmark size={12} /> المحفوظات
          </button>
        </div>

        {/* List */}
        <div className="ec-sb-list">
          {sidebarPanel === 'chats' ? (
            isLoadingChats ? (
              <div className="ec-sb-skeletons">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="ec-sb-skeleton" style={{ width: `${65 + (i % 4) * 9}%` }} />
                ))}
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="ec-sb-empty">
                <MessageSquare size={26} />
                <span>{chatSearch ? 'لا نتائج' : 'لا توجد محادثات'}</span>
              </div>
            ) : (
              Object.entries(groupedChats).map(([key, items]) => {
                if (!items.length) return null;
                return (
                  <div key={key} className="ec-sb-group">
                    <div className="ec-sb-group-label">{GROUP_LABELS[key]}</div>
                    {items.map(chat => (
                      <div key={chat.id} className={`ec-sb-item ${chat.id === activeChatId ? 'active' : ''}`}>
                        {renamingId === chat.id ? (
                          <input
                            ref={renameInputRef}
                            className="ec-sb-rename"
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            onBlur={commitRename}
                            onKeyDown={e => {
                              if (e.key === 'Enter') commitRename();
                              if (e.key === 'Escape') setRenamingId(null);
                            }}
                          />
                        ) : (
                          <button className="ec-sb-item-btn" type="button" onClick={() => loadChat(chat.id)}>
                            <MessageSquare size={12} className="ec-sb-item-icon" />
                            <span className="ec-sb-item-title">{chat.title || 'محادثة'}</span>
                          </button>
                        )}
                        {renamingId !== chat.id && (
                          <div className="ec-sb-item-actions">
                            <button className="ec-sb-action" type="button" title="إعادة تسمية"
                              onClick={e => { e.stopPropagation(); setRenamingId(chat.id); setRenameValue(chat.title || ''); }}>
                              <Edit3 size={11} />
                            </button>
                            <button className="ec-sb-action danger" type="button" title="حذف"
                              onClick={e => { e.stopPropagation(); deleteChat(chat.id); }}>
                              <Trash2 size={11} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })
            )
          ) : (
            filteredFavs.length === 0 ? (
              <div className="ec-sb-empty">
                <Bookmark size={26} />
                <span>لا توجد محفوظات</span>
              </div>
            ) : (
              filteredFavs.map(fav => (
                <div key={fav.id} className="ec-sb-fav">
                  <p className="ec-sb-fav-text">{String(fav.content || '').slice(0, 90)}…</p>
                  <button className="ec-sb-action danger" type="button"
                    onClick={() => { removeFavorite(fav.id); addToast('تم الحذف من المحفوظات', 'info'); }}>
                    <Trash2 size={11} />
                  </button>
                </div>
              ))
            )
          )}
        </div>

        {/* Footer */}
        <div className="ec-sb-footer">
          <button className="ec-sb-footer-btn" type="button" onClick={() => navigate('/dashboard')}>
            <LayoutDashboard size={14} />
            <span>لوحة التحكم</span>
          </button>
          <button className="ec-sb-footer-btn" type="button" onClick={() => navigate('/kb')}>
            <BookOpen size={14} />
            <span>قاعدة المعرفة</span>
          </button>
          <button className="ec-sb-footer-btn danger" type="button" onClick={logout}>
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────────────────────── */}
      <div className={`ec-main ${sidebarOpen ? 'ec-main--shifted' : ''}`}>

        {/* Top bar */}
        <header className="ec-topbar">
          <div className="ec-topbar-left">
            <button className="ec-icon-btn" type="button" onClick={() => setSidebarOpen(v => !v)} aria-label="القائمة">
              <Menu size={18} />
            </button>
            <div className="ec-topbar-title-group" dir="rtl">
              <div className="ec-topbar-title">{activeTitle || 'ELITE Legal AI'}</div>
              <div className="ec-topbar-model">
                <Bot size={11} />
                <span>مساعد قانوني ذكي</span>
              </div>
            </div>
          </div>

          <div className="ec-topbar-right">
            <div className="ec-status-badge">
              <span className="ec-status-dot" />
              <span>متاح</span>
            </div>
            <button className="ec-icon-btn" type="button" onClick={newChat} title="محادثة جديدة">
              <Plus size={17} />
            </button>
            <button className="ec-icon-btn" type="button" onClick={() => setSettingsOpen(v => !v)} title="الإعدادات" aria-expanded={settingsOpen}>
              <Settings size={16} />
            </button>

            {/* Profile */}
            <div className="ec-profile-wrap">
              <button className="ec-avatar" type="button" onClick={() => setProfileOpen(v => !v)}
                aria-haspopup="true" aria-expanded={profileOpen} title={user?.email}>
                {initialsFromEmail(user?.email)}
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <>
                    <button className="ec-profile-backdrop" type="button" onClick={() => setProfileOpen(false)} aria-label="إغلاق" />
                    <motion.div className="ec-profile-menu" role="menu"
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}>
                      <div className="ec-profile-header">
                        <div className="ec-profile-avatar-lg">{initialsFromEmail(user?.email)}</div>
                        <div className="ec-profile-email">{user?.email}</div>
                      </div>
                      <div className="ec-profile-divider" />
                      <button className="ec-profile-item" role="menuitem" onClick={() => { setProfileOpen(false); navigate('/account'); }}>
                        <User size={13} /> الحساب والسجل
                      </button>
                      <button className="ec-profile-item" role="menuitem" onClick={() => { setProfileOpen(false); navigate('/dashboard'); }}>
                        <LayoutDashboard size={13} /> لوحة التحكم
                      </button>
                      <button className="ec-profile-item" role="menuitem" onClick={() => { setProfileOpen(false); navigate('/kb'); }}>
                        <BookOpen size={13} /> قاعدة المعرفة
                      </button>
                      <div className="ec-profile-divider" />
                      <button className="ec-profile-item danger" role="menuitem" onClick={logout}>
                        <LogOut size={13} /> تسجيل الخروج
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Settings panel */}
        <AnimatePresence>
          {settingsOpen && (
            <motion.div className="ec-settings-panel"
              initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.18 }}>
              <div className="ec-settings-header">
                <span>الإعدادات</span>
                <button className="ec-icon-btn" type="button" onClick={() => setSettingsOpen(false)}><X size={15} /></button>
              </div>
              <div className="ec-settings-row">
                <label className="ec-settings-label"><Globe size={13} /> اللغة</label>
                <select className="ec-settings-select" value={settings.language} onChange={e => updateSettings({ language: e.target.value })}>
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div className="ec-settings-row">
                <label className="ec-settings-label"><AlignLeft size={13} /> طول الإجابة</label>
                <select className="ec-settings-select" value={settings.responseLength} onChange={e => updateSettings({ responseLength: e.target.value })}>
                  <option value="brief">مختصر</option>
                  <option value="detailed">مفصّل</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── MESSAGES AREA ─────────────────────────────────────────────── */}
        <div className={`ec-messages-wrap${showWelcome ? ' ec-messages-wrap--welcome' : ''}`}>
          <div className="ec-messages">

            {/* Welcome screen */}
            {showWelcome && (
              <motion.div className="ec-welcome"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                <div className="ec-welcome-glow" aria-hidden="true" />
                <div className="ec-welcome-icon">
                  <Scale size={32} />
                </div>
                <h1 className="ec-welcome-title">مرحباً بك في ELITE</h1>
                <p className="ec-welcome-sub">مستشارك القانوني الذكي — متخصص في القانون المصري</p>
                <div className="ec-welcome-cards">
                  {WELCOME_CARDS.map((card, i) => (
                    <motion.button
                      key={i}
                      className="ec-welcome-card"
                      type="button"
                      onClick={() => { setInput(card.query); inputRef.current?.focus(); }}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.98 }}>
                      <div className="ec-welcome-card-icon">
                        <card.Icon size={18} />
                      </div>
                      <span className="ec-welcome-card-label">{card.label}</span>
                      <span className="ec-welcome-card-desc">{card.desc}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Message list */}
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => {
                const isStreaming = streamingId === msg.id;
                const displayContent = isStreaming ? streamingText : msg.content;

                if (msg.type === 'user') {
                  return (
                    <motion.div key={msg.id} className="ec-msg-user"
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}>
                      <div className="ec-msg-user-meta">
                        <span className="ec-msg-user-time">{formatTime(msg.timestamp)}</span>
                        <button className="ec-msg-user-copy" type="button" title="نسخ" onClick={() => copyMsg(msg.content)}>
                          <Copy size={11} />
                        </button>
                      </div>
                      <div className="ec-msg-user-bubble" dir="rtl">{msg.content}</div>
                    </motion.div>
                  );
                }

                return (
                  <motion.div key={msg.id} className="ec-msg-ai"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}>

                    {/* AI Header */}
                    <div className="ec-msg-ai-header">
                      <div className="ec-msg-ai-avatar">
                        <Scale size={14} />
                      </div>
                      <div className="ec-msg-ai-identity">
                        <span className="ec-msg-ai-name">ELITE Legal AI</span>
                        <span className="ec-msg-ai-model">مساعد قانوني ذكي</span>
                      </div>
                      <span className="ec-msg-timestamp">{formatTime(msg.timestamp)}</span>
                      {isStreaming && (
                        <div className="ec-streaming-dots" aria-label="يكتب">
                          <span /><span /><span />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="ec-msg-ai-body" dir="rtl">
                      <MarkdownRenderer content={displayContent} />
                      {isStreaming && <span className="ec-cursor" aria-hidden="true" />}
                    </div>

                    {/* Confidence badge + out-of-scope warning */}
                    {!isStreaming && (
                      <>
                        {msg.isOutOfScope && (
                          <div className="ec-out-of-scope">
                            <XCircle size={13} />
                            <span>هذا السؤال خارج نطاق القانون المصري — يُنصح بمراجعة مختص في المجال المناسب.</span>
                          </div>
                        )}

                        {msg.confidence && (
                          <div className={`ec-confidence ec-confidence--${msg.confidence}`}>
                            {msg.confidence === 'high' && <CheckCircle2 size={13} />}
                            {msg.confidence === 'medium' && <MinusCircle size={13} />}
                            {msg.confidence === 'low' && <AlertCircle size={13} />}
                            <span className="ec-confidence-label">
                              {msg.confidence === 'high' && 'ثقة عالية'}
                              {msg.confidence === 'medium' && 'ثقة متوسطة'}
                              {msg.confidence === 'low' && 'ثقة منخفضة'}
                            </span>
                            {msg.confidenceReason && (
                              <span className="ec-confidence-reason">— {msg.confidenceReason}</span>
                            )}
                          </div>
                        )}

                        {Array.isArray(msg.citations) && msg.citations.length > 0 && (
                          <div className="ec-citations">
                            <button
                              className="ec-citations-toggle"
                              type="button"
                              onClick={() => toggleCitations(msg.id)}
                              aria-expanded={expandedCitations.has(msg.id)}
                            >
                              <BookMarked size={13} />
                              <span>المواد القانونية المستشهد بها ({msg.citations.length})</span>
                              {expandedCitations.has(msg.id) ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>

                            {expandedCitations.has(msg.id) && (
                              <div className="ec-citations-list">
                                {msg.citations.map((cite, ci) => {
                                  const key = `${msg.id}_${cite.id}`;
                                  const isOpen = openArticles.has(key);
                                  return (
                                    <div key={cite.id} className="ec-cite-card">
                                      <button
                                        className="ec-cite-header"
                                        type="button"
                                        onClick={() => toggleArticle(key)}
                                      >
                                        <div className="ec-cite-ref">
                                          <span className="ec-cite-num">[{ci + 1}]</span>
                                          <span className="ec-cite-law">{cite.law_name}</span>
                                        </div>
                                        <div className="ec-cite-meta">
                                          <span className="ec-cite-article">المادة {cite.article_number}</span>
                                          <span className="ec-cite-year">رقم {cite.law_number} / {cite.year}</span>
                                          {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                        </div>
                                      </button>
                                      {isOpen && (
                                        <div className="ec-cite-body" dir="rtl">
                                          {cite.chapter && (
                                            <p className="ec-cite-chapter">{cite.chapter}</p>
                                          )}
                                          <p className="ec-cite-text">{cite.article_text}</p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}


                    {/* Actions */}
                    {!isStreaming && (
                      <div className="ec-msg-actions">
                        <div className="ec-msg-actions-group">
                          <button className="ec-msg-action icon-only" type="button" title="نسخ" onClick={() => copyMsg(msg.content)}>
                            <Copy size={13} />
                          </button>
                          <button className={`ec-msg-action icon-only ${likedMsgs.has(msg.id) ? 'active-like' : ''}`}
                            type="button" title="مفيد" onClick={() => toggleLike(msg.id)}>
                            <ThumbsUp size={13} />
                          </button>
                          <button className={`ec-msg-action icon-only ${dislikedMsgs.has(msg.id) ? 'active-dislike' : ''}`}
                            type="button" title="غير مفيد" onClick={() => toggleDislike(msg.id)}>
                            <ThumbsDown size={13} />
                          </button>
                        </div>
                        <div className="ec-msg-actions-sep" />
                        <div className="ec-msg-actions-group">
                          <button className="ec-msg-action" type="button" onClick={() => regenerate(idx)}>
                            <RefreshCw size={12} /> إعادة
                          </button>
                          <button className="ec-msg-action" type="button" onClick={() => {
                              const q = messages.slice(0, idx).reverse().find(m => m.type === 'user')?.content;
                              explainSimply(msg.content, q);
                            }}>
                            <Lightbulb size={12} /> تبسيط
                          </button>
                          <button className="ec-msg-action" type="button" onClick={() => {
                              const q = messages.slice(0, idx).reverse().find(m => m.type === 'user')?.content;
                              continueResponse(msg.content, q);
                            }}>
                            <ChevronRight size={12} /> أكمل
                          </button>
                          <button className={`ec-msg-action ${isFavorite(msg.id) ? 'active' : ''}`}
                            type="button" onClick={() => toggleFavorite(msg)}>
                            {isFavorite(msg.id) ? <StarOff size={12} /> : <Star size={12} />}
                            {isFavorite(msg.id) ? 'محفوظ' : 'حفظ'}
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Loading indicator */}
            {isLoading && (
              <motion.div className="ec-msg-ai" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <div className="ec-msg-ai-header">
                  <div className="ec-msg-ai-avatar"><Scale size={14} /></div>
                  <div className="ec-msg-ai-identity">
                    <span className="ec-msg-ai-name">ELITE Legal AI</span>
                    <span className="ec-msg-ai-model">يفكر…</span>
                  </div>
                </div>
                <div className="ec-thinking">
                  <div className="ec-thinking-dots"><span /><span /><span /></div>
                  <span className="ec-thinking-label">يحلل سؤالك القانوني</span>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ── INPUT AREA ────────────────────────────────────────────────── */}
        <div className="ec-input-area">

          {/* Doc banner */}
          {uploadedDoc && (
            <div className="ec-doc-banner">
              <FileText size={13} />
              <span className="ec-doc-name">{uploadedDoc.name}</span>
              {uploadedDoc.truncated && <span className="ec-doc-truncated">مقتطع</span>}
              <div className="ec-doc-actions">
                <button className="ec-doc-action" type="button" onClick={() => setDocModalOpen(true)}>تفاصيل</button>
                <button className="ec-doc-action ec-doc-clear" type="button" onClick={() => setUploadedDoc(null)}><X size={11} /></button>
              </div>
            </div>
          )}

          {/* STT error */}
          {sttError && (
            <div className="ec-stt-error">
              <AlertCircle size={12} />
              <span>{sttError}</span>
            </div>
          )}

          {/* Input card */}
          <div className="ec-input-card">
            <textarea
              ref={inputRef}
              className="ec-textarea"
              value={input}
              onChange={e => { if (e.target.value.length <= MAX_CHARS) setInput(e.target.value); }}
              onKeyDown={handleKeyDown}
              placeholder="اكتب استشارتك القانونية…"
              rows={1}
              dir="auto"
              aria-label="نص الرسالة"
            />
            <div className="ec-input-toolbar">
              <div className="ec-toolbar-left">
                <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" className="ec-file-input" onChange={handleFileChange} aria-label="رفع مستند" />
                <button className={`ec-tool-btn ${isUploadingDoc ? 'loading' : ''}`} type="button"
                  title="رفع مستند PDF/DOCX" onClick={() => fileInputRef.current?.click()} disabled={isUploadingDoc}>
                  <Paperclip size={15} />
                </button>
                <SpeechToTextButton
                  onStateChange={handleSttState}
                  onText={handleSttText}
                  onError={setSttError}
                  stopSignal={sttStopSignal}
                  className="ec-tool-btn"
                />
              </div>
              <div className="ec-toolbar-right">
                {charCount > 0 && (
                  <span className={`ec-char-count ${charCount > MAX_CHARS * 0.9 ? 'warn' : ''}`}>
                    {charCount}/{MAX_CHARS}
                  </span>
                )}
                <button className={`ec-send-btn ${input.trim() ? 'ready' : ''}`} type="button"
                  onClick={handleSubmit}
                  disabled={isLoading || !!streamingId || !input.trim()}
                  aria-label="إرسال">
                  <Send size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── DOCUMENT MODAL ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {docModalOpen && uploadedDoc && (
          <motion.div className="ec-modal-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setDocModalOpen(false)}>
            <motion.div className="ec-modal"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 24, stiffness: 260 }}
              onClick={e => e.stopPropagation()}>
              <div className="ec-modal-header">
                <div className="ec-modal-title"><FileText size={15} /><span>{uploadedDoc.name}</span></div>
                <button className="ec-icon-btn" type="button" onClick={() => setDocModalOpen(false)}><X size={15} /></button>
              </div>
              {uploadedDoc.truncated && (
                <div className="ec-modal-note">
                  <AlertCircle size={12} />
                  <span>تم اقتصار المستند على 8000 حرف للمعالجة.</span>
                </div>
              )}
              <div className="ec-modal-preview" dir="rtl">{uploadedDoc.text?.slice(0, 600)}…</div>
              <div className="ec-modal-actions">
                <button className="ec-modal-btn primary" type="button" onClick={summarizeDoc}>
                  <FileText size={13} /> تلخيص المستند
                </button>
                <button className="ec-modal-btn" type="button" onClick={() => {
                  setDocModalOpen(false);
                  setInput(`اسألني عن ${uploadedDoc.name}: `);
                  inputRef.current?.focus();
                }}>اسأل عن المستند</button>
                <button className="ec-modal-btn danger" type="button" onClick={() => { setUploadedDoc(null); setDocModalOpen(false); }}>
                  <X size={13} /> إزالة
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
