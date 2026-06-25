export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  SERVICES: '/services',
  LOGIN: '/login',
  REGISTER: '/register',
  COMPLETE_PROFILE: '/complete-profile',
  PROFILE: '/profile', // Redirects based on role
  ADMIN: '/admin',
  ADMIN_EMPLOYEES: '/admin/employees',
  ADMIN_CLIENTS: '/admin/clients',
  ADMIN_TASKS: '/admin/tasks',
  ADMIN_TASK_DETAILS: '/admin/tasks/:id',
  ADMIN_ARCHIVE_DONE: '/admin/archive/done',
  ADMIN_ARCHIVE_CANCELLED: '/admin/archive/cancelled',

  // Shared Dashboard Routes
  SETTINGS: '/settings',
  NOTIFICATIONS: '/notifications',
  EMPLOYEE: '/employee',
  EMPLOYEE_CLIENTS: '/employee/clients',
  EMPLOYEE_TASKS: '/employee/tasks',
  EMPLOYEE_TASK_DETAILS: '/employee/tasks/:id',
  EMPLOYEE_DOCUMENTS: '/employee/documents',
  CLIENT: '/client',
  CLIENT_DOCUMENTS: '/client/documents',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];