import { ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  type: AlertType;
  title?: string;
  children: ReactNode;
  className?: string;
}

const alertConfig = {
  success: {
    icon: CheckCircle2,
    colors: 'bg-green-50 border-green-200 text-green-800',
    iconColor: 'text-green-500',
  },
  error: {
    icon: AlertCircle,
    colors: 'bg-red-50 border-red-200 text-red-800',
    iconColor: 'text-red-500',
  },
  warning: {
    icon: AlertTriangle,
    colors: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    iconColor: 'text-yellow-500',
  },
  info: {
    icon: Info,
    colors: 'bg-blue-50 border-blue-200 text-blue-800',
    iconColor: 'text-blue-500',
  },
};

export function Alert({ type, title, children, className = '' }: AlertProps) {
  const config = alertConfig[type];
  const Icon = config.icon;

  return (
    <div className={`flex items-start gap-3 w-full p-4 rounded-2xl border ${config.colors} ${className}`}>
      <Icon className={`shrink-0 w-5 h-5 mt-0.5 ${config.iconColor}`} />
      <div className="flex-1 min-w-0">
        {title && <h5 className="font-bold mb-1">{title}</h5>}
        <div className="text-sm font-medium leading-relaxed opacity-90">
          {children}
        </div>
      </div>
    </div>
  );
}
