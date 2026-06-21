import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const AppCtx = createContext(null);
const FAV_KEY = 'lgpt_favs';
const SET_KEY = 'lgpt_settings';

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

const DEFAULT_SETTINGS = { language: 'ar', responseLength: 'detailed' };

export function AppProvider({ children }) {
  const [favorites, setFavorites] = useState(() => load(FAV_KEY, []));
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...load(SET_KEY, {}) }));
  const [toasts, setToasts] = useState([]);

  const addFavorite = useCallback((msg) => {
    setFavorites(prev => {
      if (prev.some(f => f.id === msg.id)) return prev;
      const next = [{ ...msg, savedAt: Date.now() }, ...prev].slice(0, 200);
      localStorage.setItem(FAV_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFavorite = useCallback((id) => {
    setFavorites(prev => {
      const next = prev.filter(f => f.id !== id);
      localStorage.setItem(FAV_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback((id) => favorites.some(f => f.id === id), [favorites]);

  const updateSettings = useCallback((updates) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem(SET_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-4), { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const value = useMemo(() => ({
    favorites, addFavorite, removeFavorite, isFavorite,
    settings, updateSettings,
    toasts, addToast, removeToast,
  }), [favorites, addFavorite, removeFavorite, isFavorite, settings, updateSettings, toasts, addToast, removeToast]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be within AppProvider');
  return ctx;
}
