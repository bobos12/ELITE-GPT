import './App.css';
import EliteChat from './pages/Chat';
import Home from './pages/Home';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import "./index.css"
import Login from './pages/Login';
import Signup from './pages/Signup';
import Account from './pages/Account';
import DocumentGenerator from './pages/DocumentGenerator';
import LegalTemplates from './pages/LegalTemplates';
import KnowledgeBase from './pages/KnowledgeBase';
import { AuthProvider } from './auth/AuthContext';
import RequireAuth from './auth/RequireAuth';
import Navbar from './component/Navbar/Navbar';

function AppLayout() {
  const location = useLocation();
  const hideNavbar = location.pathname.startsWith('/chat');
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
            <Route
              path="/kb"
              element={
                <KnowledgeBase />
              }
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
