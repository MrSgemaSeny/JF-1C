import { ROUTES } from '@/shared/config/routes';
import type { UserRole } from '@/features/auth/authApi';

export interface NavItem {
  label: string;
  href: string;
}

export const navConfig: Record<UserRole, NavItem[]> = {
  ADMIN: [
    { label: 'Overview', href: ROUTES.ADMIN },
    { label: 'Employees', href: ROUTES.ADMIN_EMPLOYEES },
    { label: 'Clients', href: ROUTES.ADMIN_CLIENTS },
    { label: 'Tasks', href: ROUTES.ADMIN_TASKS },
    { label: 'Archive (Done)', href: ROUTES.ADMIN_ARCHIVE_DONE },
    { label: 'Archive (Cancelled)', href: ROUTES.ADMIN_ARCHIVE_CANCELLED },
    { label: 'Notifications', href: ROUTES.NOTIFICATIONS },
  ],
  EMPLOYEE: [
    { label: 'Overview', href: ROUTES.EMPLOYEE },
    { label: 'My Clients', href: ROUTES.EMPLOYEE_CLIENTS },
    { label: 'My Tasks', href: ROUTES.EMPLOYEE_TASKS },
    { label: 'Documents', href: ROUTES.EMPLOYEE_DOCUMENTS },
    { label: 'Notifications', href: ROUTES.NOTIFICATIONS },
  ],
  CLIENT: [
    { label: 'Overview', href: ROUTES.CLIENT },
    { label: 'Documents', href: ROUTES.CLIENT_DOCUMENTS },
    { label: 'Notifications', href: ROUTES.NOTIFICATIONS },
  ],
};
