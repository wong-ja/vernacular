import { useEffect, useState, useCallback, createContext, useContext, ReactNode } from 'react';

type ToastType = 'success' | 'warning' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextValue {
  addToast: (type: ToastType, title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const typeStyles: Record<ToastType, { bg: string; text: string; icon: string }> = {
  success: { bg: 'bg-success-bg border-success', text: 'text-success-text', icon: '\u2713' },
  warning: { bg: 'bg-warning-bg border-warning', text: 'text-warning-text', icon: '\u26A0' },
  error: { bg: 'bg-error-bg border-error', text: 'text-error-text', icon: '\u2715' },
  info: { bg: 'bg-info-bg border-info', text: 'text-info-text', icon: '\u2139' },
};

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, title: string, description?: string) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, type, title, description }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 max-w-[380px]">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const style = typeStyles[toast.type];

  return (
    <div className={`${style.bg} border rounded-lg p-4 shadow-md animate-in slide-in-from-right`}>
      <div className="flex items-start gap-3">
        <span className={`text-lg ${style.text}`}>{style.icon}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${style.text}`}>{toast.title}</p>
          {toast.description && (
            <p className={`text-xs mt-1 ${style.text} opacity-80`}>{toast.description}</p>
          )}
        </div>
        <button onClick={onDismiss} className={`${style.text} opacity-60 hover:opacity-100 cursor-pointer`} aria-label="Dismiss">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
