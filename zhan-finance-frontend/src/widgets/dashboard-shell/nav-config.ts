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
  ],
  EMPLOYEE: [
    { label: 'Overview', href: ROUTES.EMPLOYEE },
    { label: 'My Clients', href: ROUTES.EMPLOYEE_CLIENTS },
    { label: 'My Tasks', href: ROUTES.EMPLOYEE_TASKS },
  ],
  CLIENT: [
    { label: 'Overview', href: ROUTES.CLIENT },
    { label: 'My Requests', href: ROUTES.CLIENT_TASKS },
    { label: 'Documents', href: ROUTES.CLIENT_DOCUMENTS },
  ],
};
