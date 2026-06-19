import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { navConfig } from './nav-config';

export function DashboardSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const navItems = navConfig[user.role] || [];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-6">
        <Link to="/" className="text-2xl font-bold text-brand-green">
          Zhan Finance
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`block px-4 py-2 rounded-md text-sm font-medium ${
                isActive
                  ? 'bg-brand-green text-white'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-brand-green'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">{user.email}</p>
            <p className="text-xs font-medium text-gray-500 uppercase">{user.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-4 w-full px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
