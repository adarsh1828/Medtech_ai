import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', title = '') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    const newToast = { id, message, type, title };
    setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5 toasts

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  // Expose to window for components or non-react handlers
  useEffect(() => {
    window.showMedTechToast = (msg, type, title) => showToast(msg, type, title);
    return () => {
      delete window.showMedTechToast;
    };
  }, [showToast]);

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} className="toast-icon toast-icon-success" />;
      case 'error':
        return <AlertCircle size={18} className="toast-icon toast-icon-error" />;
      case 'warning':
        return <AlertTriangle size={18} className="toast-icon toast-icon-warning" />;
      case 'info':
      default:
        return <Info size={18} className="toast-icon toast-icon-info" />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-item toast-${toast.type}`}
            role="status"
          >
            <div className="toast-icon-wrap">
              {getToastIcon(toast.type)}
            </div>
            <div className="toast-content">
              {toast.title && <div className="toast-title">{toast.title}</div>}
              <div className="toast-message">{toast.message}</div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="toast-close-btn"
              aria-label="Close notification"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: (msg) => console.log('Toast:', msg),
      removeToast: () => {}
    };
  }
  return context;
}
