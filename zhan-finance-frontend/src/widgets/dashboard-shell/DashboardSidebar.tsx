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
} from 'lucide-react';
import { useNotifications } from '@/features/notifications/NotificationContext';
import { API_BASE_URL } from '@/shared/api/http';

const NAV_ICONS: Record<string, React.ReactNode> = {
  'Overview':            <LayoutDashboard size={16} />,
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
  'Settings':            <Settings size={16} />,
  'Notifications':       <Bell size={16} />,
};

function getInitials(email?: string): string {
  if (!email) return '?';
  return email.charAt(0).toUpperCase();
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Администратор',
  EMPLOYEE: 'Сотрудник',
  CLIENT: 'Клиент',
};

export function DashboardSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { unreadCount } = useNotifications();

  if (!user) return null;

  const navItems = navConfig[user.role] || [];

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-full shadow-sm">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-green flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-bold leading-none">ZF</span>
          </div>
          <span className="text-base font-bold text-gray-900 tracking-tight">Zhan Finance</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const icon = NAV_ICONS[item.label] ?? <ChevronRight size={16} />;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={`flex-shrink-0 ${isActive ? 'text-white/90' : 'text-gray-400'}`}>
                {icon}
              </span>
              <span className="flex-1">{item.label}</span>
              
              {item.label === 'Notifications' && unreadCount > 0 && (
                <span className="flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full shadow-sm">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              
              {isActive && item.label !== 'Notifications' && (
                <ChevronRight size={14} className="opacity-50" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User block */}
      <div className="p-4 border-t border-gray-100 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-green to-green-600 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
            {user.avatarUrl ? (
              <img 
                src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `${API_BASE_URL}${user.avatarUrl}`} 
                alt="Avatar" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <span className="text-white text-sm font-bold">{getInitials(user.fullName || user.email)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">{user.email}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{ROLE_LABELS[user.role] ?? user.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={15} />
          Выйти
        </button>
      </div>
    </aside>
  );
}

