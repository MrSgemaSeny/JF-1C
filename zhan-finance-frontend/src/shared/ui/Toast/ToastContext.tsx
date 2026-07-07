import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast, ToastType } from './Toast';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  duration?: number;
  action?: ToastAction;
}

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  options?: ToastOptions;
}

interface ToastContextType {
  toast: {
    success: (message: string, options?: ToastOptions) => void;
    error: (message: string, options?: ToastOptions) => void;
    warning: (message: string, options?: ToastOptions) => void;
    info: (message: string, options?: ToastOptions) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let globalToast: ToastContextType['toast'] = {
  success: () => console.warn('Toast not initialized'),
  error: () => console.warn('Toast not initialized'),
  warning: () => console.warn('Toast not initialized'),
  info: () => console.warn('Toast not initialized'),
};

export const toast = {
  success: (msg: string, opt?: ToastOptions) => globalToast.success(msg, opt),
  error: (msg: string, opt?: ToastOptions) => globalToast.error(msg, opt),
  warning: (msg: string, opt?: ToastOptions) => globalToast.warning(msg, opt),
  info: (msg: string, opt?: ToastOptions) => globalToast.info(msg, opt),
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const MAX_TOASTS = 3;

  const addToast = useCallback((type: ToastType, message: string, options?: ToastOptions) => {
    setToasts((prev) => {
      const newToast = { id: Math.random().toString(36).substring(2, 9), type, message, options };
      const nextToasts = [...prev, newToast];
      if (nextToasts.length > MAX_TOASTS) {
        return nextToasts.slice(nextToasts.length - MAX_TOASTS);
      }
      return nextToasts;
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastMethods = {
    success: (msg: string, opt?: ToastOptions) => addToast('success', msg, opt),
    error: (msg: string, opt?: ToastOptions) => addToast('error', msg, opt),
    warning: (msg: string, opt?: ToastOptions) => addToast('warning', msg, opt),
    info: (msg: string, opt?: ToastOptions) => addToast('info', msg, opt),
  };

  // Bind to global toast
  globalToast = toastMethods;

  return (
    <ToastContext.Provider value={{ toast: toastMethods }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            type={t.type}
            message={t.message}
            options={t.options}
            onClose={() => removeToast(t.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
}
