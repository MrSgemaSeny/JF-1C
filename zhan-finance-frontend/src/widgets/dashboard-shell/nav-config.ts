import { ROUTES } from '@/shared/config/routes';
import type { UserRole } from '@/features/auth/authApi';

export interface NavItem {
  label: string;
  href: string;
}

export const navConfig: Record<UserRole, NavItem[]> = {
  ADMIN: [
    { label: 'Overview', href: ROUTES.ADMIN },
    { label: 'Courses', href: ROUTES.ADMIN_COURSES },
    { label: 'Learners', href: ROUTES.ADMIN_LEARNERS },
    { label: 'Chat', href: ROUTES.ADMIN_CHAT },
    { label: 'Employees', href: ROUTES.ADMIN_EMPLOYEES },
    { label: 'Clients', href: ROUTES.ADMIN_CLIENTS },
    { label: 'Лиды', href: ROUTES.ADMIN_LEADS },
    { label: 'Список задач', href: ROUTES.ADMIN_TASKS },
    { label: 'Task Pool', href: ROUTES.ADMIN_TASK_POOL },
    { label: 'Invoices', href: ROUTES.ADMIN_INVOICES },
    { label: 'Subscriptions', href: ROUTES.ADMIN_SUBSCRIPTIONS },
    { label: 'Audit Logs', href: ROUTES.ADMIN_AUDIT_LOGS },
    { label: 'Templates', href: ROUTES.ADMIN_TEMPLATES },
    { label: 'Settings', href: ROUTES.SETTINGS },
    { label: 'Notifications', href: ROUTES.NOTIFICATIONS },
  ],
  EMPLOYEE: [
    { label: 'Overview', href: ROUTES.EMPLOYEE },
    { label: 'Calendar', href: ROUTES.EMPLOYEE_CALENDAR },
    { label: 'Chat', href: ROUTES.EMPLOYEE_CHAT },
    { label: 'My Clients', href: ROUTES.EMPLOYEE_CLIENTS },
    { label: 'Лиды', href: ROUTES.ADMIN_LEADS },
    { label: 'Задачи', href: ROUTES.EMPLOYEE_TASKS },
    { label: 'Documents', href: ROUTES.EMPLOYEE_DOCUMENTS },
    { label: 'Settings', href: ROUTES.SETTINGS },
    { label: 'Notifications', href: ROUTES.NOTIFICATIONS },
  ],
  CLIENT: [
    { label: 'Overview', href: ROUTES.CLIENT },
    { label: 'Services', href: ROUTES.CLIENT_SERVICES },
    { label: 'Calendar', href: ROUTES.CLIENT_CALENDAR },
    { label: 'Chat', href: ROUTES.CLIENT_CHAT },
    { label: 'Documents', href: ROUTES.CLIENT_DOCUMENTS },
    { label: 'Settings', href: ROUTES.SETTINGS },
    { label: 'Notifications', href: ROUTES.NOTIFICATIONS },
  ],
  LEARNER: [
    { label: 'Courses', href: ROUTES.LEARNER_COURSES },
  ],
};
