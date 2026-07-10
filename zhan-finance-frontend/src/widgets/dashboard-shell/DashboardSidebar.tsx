import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { navConfig } from './nav-config';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  ClipboardList,
  Archive,
  XCircle,
  FileText,
  Briefcase,
  LogOut,
  ChevronRight,
  Bell,
  Settings,
  MessageCircle,
  CalendarDays,
  X,
  BookOpen,
  CreditCard,
  RefreshCw,
  History,
  User,
} from 'lucide-react';
import { useNotifications } from '@/features/notifications/NotificationContext';
import { API_BASE_URL, getSecureImageUrl } from '@/shared/api/http';
import { twMerge } from 'tailwind-merge';

const NAV_ICONS: Record<string, React.ReactNode> = {
  'Overview':            <LayoutDashboard size={16} />,
  'Calendar':            <CalendarDays size={16} />,
  'Chat':                <MessageCircle size={16} />,
  'Employees':           <UserCheck size={16} />,
  'Clients':             <Users size={16} />,
  'Tasks':               <ClipboardList size={16} />,
  'My Tasks':            <ClipboardList size={16} />,
  'My Clients':          <Users size={16} />,
  'Archive (Done)':      <Archive size={16} />,
  'Archive (Cancelled)': <XCircle size={16} />,
  'Documents':           <FileText size={16} />,
  'My Requests':         <Briefcase size={16} />,
  'Services':            <Briefcase size={16} />,
  'Courses':             <BookOpen size={16} />,
  'Learners':            <Users size={16} />,
  'Invoices':            <CreditCard size={16} />,
  'Subscriptions':       <RefreshCw size={16} />,
  'Audit Logs':          <History size={16} />,
  'Settings':            <Settings size={16} />,
  'Notifications':       <Bell size={16} />,
};



const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Администратор',
  EMPLOYEE: 'Сотрудник',
  CLIENT: 'Клиент',
  LEARNER: 'Обучающийся',
};

interface DashboardSidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
  isDesktopCollapsed: boolean;
  onDesktopToggle: () => void;
}

export function DashboardSidebar({ 
  isMobileOpen, 
  onMobileClose, 
  isDesktopCollapsed, 
  onDesktopToggle 
}: DashboardSidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { unreadCount } = useNotifications();

  if (!user) return null;

  const navItems = navConfig[user.role] || [];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onMobileClose}
        />
      )}

      <aside className={twMerge(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none lg:static lg:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full",
        isDesktopCollapsed ? "lg:w-20" : "w-[280px] lg:w-64"
      )}>
        {/* Logo area */}
        <div className="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-gray-100 min-h-[64px]">
          <Link to="/" className="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0" onClick={() => { if (window.innerWidth < 1024) onMobileClose(); }}>
            <div className="w-8 h-8 rounded-lg bg-brand-green flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold leading-none">ZF</span>
            </div>
            {!isDesktopCollapsed && (
              <span className="text-base font-bold text-gray-900 tracking-tight whitespace-nowrap truncate transition-opacity">
                Zhan Finance
              </span>
            )}
          </Link>
          
          {/* Mobile Close Button */}
          <button onClick={onMobileClose} className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Desktop Collapse Button */}
        <button 
          onClick={onDesktopToggle}
          className="hidden lg:flex absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center text-gray-400 hover:text-brand-green hover:border-brand-green shadow-sm z-50 transition-colors"
        >
          <ChevronRight size={14} className={twMerge("transition-transform duration-300", !isDesktopCollapsed && "rotate-180")} />
        </button>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto overflow-x-hidden px-3 relative">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            const icon = NAV_ICONS[item.label] ?? <ChevronRight size={16} />;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => { if (window.innerWidth < 1024) onMobileClose(); }}
                className={twMerge(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative",
                  isActive
                    ? 'bg-brand-green text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  isDesktopCollapsed ? 'justify-center px-0' : ''
                )}
                title={isDesktopCollapsed ? item.label : undefined}
              >
                <span className={twMerge("shrink-0", isActive ? 'text-white/90' : 'text-gray-400 group-hover:text-brand-green')}>
                  {icon}
                </span>
                
                {!isDesktopCollapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    
                    {item.label === 'Notifications' && unreadCount > 0 && (
                      <span className="flex items-center justify-center min-w-[20px] h-5 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full shadow-sm shrink-0">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                    
                    {isActive && item.label !== 'Notifications' && (
                      <ChevronRight size={14} className="opacity-50 shrink-0" />
                    )}
                  </>
                )}

                {/* Always show dot indicator if collapsed and has notifications */}
                {isDesktopCollapsed && item.label === 'Notifications' && unreadCount > 0 && (
                  <span className="absolute top-2.5 right-2 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User block */}
        <div className="p-4 border-t border-gray-100">
          <div className={twMerge("flex items-center gap-3 mb-4", isDesktopCollapsed && "justify-center")}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-green to-green-600 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
              {user.avatarUrl ? (
                <img 
                  src={getSecureImageUrl(user.avatarUrl)}
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <User size={20} className="text-white" />
              )}
            </div>
            {!isDesktopCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{user.email}</p>
                <p className="text-[11px] text-gray-400 mt-0.5 truncate">{ROLE_LABELS[user.role] ?? user.role}</p>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            title={isDesktopCollapsed ? "Выйти" : undefined}
            className={twMerge(
              "flex items-center w-full rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors",
              isDesktopCollapsed ? "justify-center p-2" : "gap-2 px-3 py-2.5"
            )}
          >
            <LogOut size={16} />
            {!isDesktopCollapsed && <span>Выйти</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

