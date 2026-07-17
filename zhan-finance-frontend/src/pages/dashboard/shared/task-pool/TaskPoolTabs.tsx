import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/AuthContext';
import { ROUTES } from '@/shared/config/routes';
import { twMerge } from 'tailwind-merge';

export function TaskPoolTabs() {
  const { t } = useTranslation(['common']);
  const { user } = useAuth();
  const location = useLocation();

  if (user?.role !== 'ADMIN') {
    return null;
  }

  const tabs = [
    { name: t('nav.taskPool', 'Пул задач'), href: ROUTES.ADMIN_TASK_POOL },
    { name: t('nav.archiveDone', 'Архив (Успешно)'), href: ROUTES.ADMIN_ARCHIVE_DONE },
    { name: t('nav.archiveCancelled', 'Архив (Отказ)'), href: ROUTES.ADMIN_ARCHIVE_CANCELLED },
  ];

  return (
    <div className="mb-6 border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.href;
          return (
            <NavLink
              key={tab.name}
              to={tab.href}
              className={twMerge(
                isActive
                  ? 'border-brand-green text-brand-green'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors'
              )}
            >
              {tab.name}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
