export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  SERVICES: '/services',
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile', // Redirects based on role
  ADMIN: '/admin',
  ADMIN_EMPLOYEES: '/admin/employees',
  ADMIN_CLIENTS: '/admin/clients',
  ADMIN_TASKS: '/admin/tasks',
  EMPLOYEE: '/employee',
  EMPLOYEE_CLIENTS: '/employee/clients',
  EMPLOYEE_TASKS: '/employee/tasks',
  CLIENT: '/client',
  CLIENT_TASKS: '/client/tasks',
  CLIENT_DOCUMENTS: '/client/documents',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];