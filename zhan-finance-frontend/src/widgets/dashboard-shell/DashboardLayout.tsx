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

function HeaderProfile() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateStr = time.toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'ru-RU', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });
  
  const timeStr = time.toLocaleTimeString(i18n.language === 'en' ? 'en-US' : 'ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="flex items-center gap-4 bg-gray-50 px-4 py-1.5 rounded-full border border-gray-100">
      <div className="flex flex-col text-right">
        <span className="text-sm font-bold text-gray-900 capitalize">{dateStr}</span>
        <span className="text-xs font-medium text-gray-500">{timeStr}</span>
      </div>
      {user?.avatarUrl && (
        <img 
          src={user.avatarUrl} 
          alt={user.fullName} 
          className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm"
        />
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
            <div className="flex items-center gap-4 pl-4 ml-auto">
              <HeaderProfile />
              <div className="w-px h-8 bg-gray-200 mx-2"></div>
              <LanguageSwitcher />
              <NotificationBell />
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
