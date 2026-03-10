import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'law_gpt_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [isBooting, setIsBooting] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const setSession = useCallback((nextToken, nextUser) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser || null);
  }, []);

  const authFetch = useCallback(
    async (url, init = {}) => {
      const headers = new Headers(init.headers || {});
      if (token) headers.set('Authorization', `Bearer ${token}`);
      if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
      const res = await fetch(url, { ...init, headers });
      return res;
    },
    [token]
  );

  const refreshMe = useCallback(async () => {
    if (!token) {
      setUser(null);
      return;
    }
    const res = await authFetch('/api/user/me');
    if (!res.ok) {
      logout();
      return;
    }
    const data = await res.json();
    setUser({ id: data.id, email: data.email });
  }, [authFetch, logout, token]);

  useEffect(() => {
    (async () => {
      try {
        await refreshMe();
      } finally {
        setIsBooting(false);
      }
    })();
  }, [refreshMe]);

  const value = useMemo(
    () => ({ token, user, isBooting, setSession, logout, authFetch, refreshMe }),
    [token, user, isBooting, setSession, logout, authFetch, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

