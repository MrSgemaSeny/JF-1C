import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { ToastOptions } from './ToastContext';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  message: string;
  options?: ToastOptions;
  onClose: () => void;
}

const toastConfig = {
  success: {
    icon: CheckCircle2,
    colors: 'bg-green-50 border-green-200 text-green-800',
    iconColor: 'text-green-500',
    defaultDuration: 3000,
  },
  error: {
    icon: AlertCircle,
    colors: 'bg-red-50 border-red-200 text-red-800',
    iconColor: 'text-red-500',
    defaultDuration: 6000,
  },
  warning: {
    icon: AlertTriangle,
    colors: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    iconColor: 'text-yellow-500',
    defaultDuration: 5000,
  },
  info: {
    icon: Info,
    colors: 'bg-blue-50 border-blue-200 text-blue-800',
    iconColor: 'text-blue-500',
    defaultDuration: 4000,
  },
};

export function Toast({ type, message, options, onClose }: ToastProps) {
  const config = toastConfig[type];
  const Icon = config.icon;
  const duration = options?.duration || config.defaultDuration;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <AnimatePresence>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`pointer-events-auto flex items-start gap-3 w-[350px] p-4 rounded-2xl shadow-lg border backdrop-blur-md ${config.colors}`}
      >
        <Icon className={`shrink-0 w-5 h-5 mt-0.5 ${config.iconColor}`} />
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-relaxed">{message}</p>
          
          {options?.action && (
            <button
              onClick={() => {
                options.action?.onClick();
                onClose();
              }}
              className={`mt-2 text-xs font-bold uppercase tracking-wider hover:opacity-70 transition ${config.iconColor}`}
            >
              {options.action.label}
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="shrink-0 p-1 -mr-1 -mt-1 rounded-full opacity-50 hover:opacity-100 transition hover:bg-black/5"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
