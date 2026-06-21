import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function RequireAuth({ children }) {
  const { token, isBooting } = useAuth();
  const location = useLocation();

  if (isBooting) return null;
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

