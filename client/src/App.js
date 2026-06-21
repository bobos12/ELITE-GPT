import './App.css';
import EliteChat from './pages/Chat';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import './index.css';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Account from './pages/Account';
import DocumentGenerator from './pages/DocumentGenerator';
import LegalTemplates from './pages/LegalTemplates';
import KnowledgeBase from './pages/KnowledgeBase';
import { AuthProvider } from './auth/AuthContext';
import { AppProvider } from './context/AppContext';
import RequireAuth from './auth/RequireAuth';
import Navbar from './component/Navbar/Navbar';
import { useEffect } from 'react';

function AppLayout() {
  const location = useLocation();
  const hideNavbar = location.pathname.startsWith('/chat') ||
                     location.pathname.startsWith('/dashboard') ||
                     location.pathname === '/login' ||
                     location.pathname === '/signup';

  useEffect(() => {
    if (!location.hash) return;
    const id = decodeURIComponent(location.hash.slice(1));
    const el = document.getElementById(id);
    if (!el) return;
    window.setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }, [location.pathname, location.hash]);

  return (
    <>
      {!hideNavbar && <Navbar />}
      <div className={hideNavbar ? undefined : 'app-content'}>
        <Outlet />
      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/home" element={<Navigate to="/" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/chat"
                element={
                  <RequireAuth>
                    <EliteChat />
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <Dashboard />
                  </RequireAuth>
                }
              />
              <Route
                path="/account"
                element={
                  <RequireAuth>
                    <Account />
                  </RequireAuth>
                }
              />
              <Route
                path="/document-generator"
                element={
                  <RequireAuth>
                    <DocumentGenerator />
                  </RequireAuth>
                }
              />
              <Route
                path="/templates"
                element={
                  <RequireAuth>
                    <LegalTemplates />
                  </RequireAuth>
                }
              />
              <Route path="/kb" element={<KnowledgeBase />} />
            </Route>
          </Routes>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
