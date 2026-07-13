import { useEffect } from 'react';
import { useNotifications } from '@/features/notifications/NotificationContext';
import { Bell, Check, CheckCircle2, Circle, Clock } from 'lucide-react';
import { Spinner } from '@/shared/ui/Spinner';
import { twMerge } from 'tailwind-merge';
import { useTranslation } from 'react-i18next';

export function NotificationsPage() {
  const { notifications, loading, refresh, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const { t } = useTranslation(['common']);

  useEffect(() => {
    refresh();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center">
            <Bell size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('notifications.title')}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {t('notifications.unreadSubtitle', { count: unreadCount })}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-xl transition-colors"
          >
            <Check size={18} />
            <span>{t('notifications.markAllAsRead')}</span>
          </button>
        )}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
              <Bell size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{t('notifications.emptyTitle')}</h3>
            <p className="text-gray-500 max-w-sm">
              {t('notifications.emptySubtitle')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => !notification.read && markAsRead(notification.id)}
                className={twMerge(
                  "flex gap-4 p-5 sm:p-6 transition-all duration-200 group cursor-pointer",
                  !notification.read ? "bg-blue-50/30 hover:bg-blue-50/50" : "hover:bg-gray-50/50"
                )}
              >
                <div className="flex-shrink-0 mt-1">
                  {!notification.read ? (
                    <div className="relative">
                      <Circle size={20} className="text-blue-500 fill-blue-50" />
                      <div className="absolute inset-0 m-auto w-2 h-2 bg-blue-500 rounded-full" />
                    </div>
                  ) : (
                    <CheckCircle2 size={20} className="text-gray-300" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <h4 className={twMerge(
                      "text-base font-semibold truncate",
                      !notification.read ? "text-gray-900" : "text-gray-700"
                    )}>
                      {notification.title}
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 whitespace-nowrap">
                      <Clock size={12} />
                      {new Date(notification.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <p className={twMerge(
                    "text-sm leading-relaxed",
                    !notification.read ? "text-gray-600 font-medium" : "text-gray-500"
                  )}>
                    {notification.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
