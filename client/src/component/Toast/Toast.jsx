import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import './Toast.css';

const ICONS = { success: CheckCircle, error: AlertCircle, info: Info };

function ToastItem({ toast }) {
  const { removeToast } = useApp();
  const Icon = ICONS[toast.type] ?? Info;
  return (
    <div className={`toast-item toast-${toast.type}`} role="alert">
      <Icon size={15} className="toast-icon" />
      <span className="toast-text">{toast.message}</span>
      <button className="toast-close" onClick={() => removeToast(toast.id)} aria-label="Dismiss">
        <X size={13} />
      </button>
    </div>
  );
}

export default function Toasts() {
  const { toasts } = useApp();
  if (!toasts.length) return null;
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map(t => <ToastItem key={t.id} toast={t} />)}
    </div>
  );
}
