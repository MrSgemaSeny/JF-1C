import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import { DashboardSidebar } from './DashboardSidebar';
import { Menu } from 'lucide-react';
import { GlobalSearch } from '@/widgets/search/GlobalSearch';
import { NotificationBell } from './NotificationBell';
import { LanguageSwitcher } from '@/shared/ui/LanguageSwitcher';
import { useAuth } from '@/features/auth/AuthContext';
import { useTranslation } from 'react-i18next';

import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/config/routes';
import { useNotifications } from '@/features/notifications/NotificationContext';
import { Bell, CheckCircle2, Globe, Mail, LogOut } from 'lucide-react';

function HeaderProfile() {
  const { user, logout } = useAuth();
  const { i18n } = useTranslation();
  const { unreadCount } = useNotifications();
  const [time, setTime] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const dateStr = time.toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'ru-RU', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });
  
  const timeStr = time.toLocaleTimeString(i18n.language === 'en' ? 'en-US' : 'ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const displayRole = user?.role === 'ADMIN' ? 'Администратор' : user?.role === 'EMPLOYEE' ? 'Сотрудник' : 'Клиент';

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-4 bg-gray-50 px-4 py-1.5 rounded-full border border-gray-100 hover:bg-gray-100 transition-colors focus:outline-none"
      >
        <div className="flex flex-col text-right">
          <span className="text-sm font-bold text-gray-900 capitalize">{dateStr}</span>
          <span className="text-xs font-medium text-gray-500">{timeStr}</span>
        </div>
        {user?.avatarUrl ? (
          <img 
            src={user.avatarUrl} 
            alt={user?.fullName || ''} 
            className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-brand-green flex items-center justify-center border-2 border-white shadow-sm text-white font-bold text-sm">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[340px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-brand-green flex items-center justify-center border-2 border-white shadow-sm text-white font-bold text-lg">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-gray-900 truncate">{user?.fullName}</span>
              <span className="text-xs font-medium text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-full w-fit mt-1">{displayRole}</span>
            </div>
          </div>

          <div className="p-2 border-b border-gray-100">
            <Link to={ROUTES.NOTIFICATIONS} onClick={() => setIsOpen(false)} className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <Bell size={16} className="text-gray-400" />
                Уведомления
              </div>
              {unreadCount > 0 && <span className="text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">{unreadCount > 99 ? '99+' : unreadCount}</span>}
            </Link>
            {user?.role !== 'ADMIN' && (
              <Link to={user?.role === 'EMPLOYEE' ? ROUTES.EMPLOYEE_TASKS : ROUTES.CLIENT} onClick={() => setIsOpen(false)} className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors mt-1">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-gray-400" />
                  Мои задачи
                </div>
              </Link>
            )}
          </div>

          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center justify-between px-3 py-2 text-sm text-gray-700">
              <div className="flex items-center gap-3">
                <Globe size={16} className="text-gray-400" />
                Язык
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <LanguageSwitcher />
              </div>
            </div>
          </div>

          <div className="p-2">
            <a href="mailto:orkathebestt@gmail.com" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
              <Mail size={16} className="text-gray-400" />
              Поддержка
            </a>
            <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium mt-1">
              <LogOut size={16} className="text-red-500" />
              Выйти
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function DashboardLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  return (
    <div className="flex h-[100dvh] bg-gray-50 overflow-hidden">
      <DashboardSidebar 
        isMobileOpen={isMobileOpen} 
        onMobileClose={() => setIsMobileOpen(false)}
        isDesktopCollapsed={isDesktopCollapsed}
        onDesktopToggle={() => setIsDesktopCollapsed(p => !p)}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-green flex items-center justify-center">
              <span className="text-white text-xs font-bold leading-none">ZF</span>
            </div>
            <span className="font-bold text-gray-900">Zhan Finance</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={24} />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto relative flex flex-col">
          {/* Desktop Topbar */}
          <div className="hidden lg:flex items-center justify-between px-8 py-4 border-b border-gray-200 bg-white z-10">
            <GlobalSearch />
            <div className="flex items-center pl-4 ml-auto">
              <HeaderProfile />
            </div>
          </div>
          
          <div className="flex-1 flex flex-col min-h-0 p-4 md:p-8">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
