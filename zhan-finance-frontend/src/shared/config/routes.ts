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
  ADMIN_CHAT: '/admin/chat',
  ADMIN_COURSES: '/admin/courses',
  ADMIN_COURSES_NEW: '/admin/courses/new',
  ADMIN_COURSES_EDIT: '/admin/courses/:id/edit',
  ADMIN_LESSON_EDIT: '/admin/courses/:courseId/lessons/:lessonId/edit',
  ADMIN_LEARNERS: '/admin/learners',
  ADMIN_INVOICES: '/admin/invoices',
  ADMIN_SUBSCRIPTIONS: '/admin/subscriptions',
  ADMIN_AUDIT_LOGS: '/admin/audit-logs',

  // Shared Dashboard Routes
  SETTINGS: '/settings',
  NOTIFICATIONS: '/notifications',
  EMPLOYEE: '/employee',
  EMPLOYEE_CLIENTS: '/employee/clients',
  EMPLOYEE_CHAT: '/employee/chat',
  EMPLOYEE_TASKS: '/employee/tasks',
  EMPLOYEE_TASK_DETAILS: '/employee/tasks/:id',
  EMPLOYEE_DOCUMENTS: '/employee/documents',
  EMPLOYEE_CALENDAR: '/employee/calendar',
  CLIENT: '/client',
  CLIENT_DOCUMENTS: '/client/documents',
  CLIENT_CHAT: '/client/chat',
  CLIENT_CALENDAR: '/client/calendar',
  CLIENT_SERVICES: '/client/services',
  
  // Learner Routes
  LEARNER_COURSES: '/courses',
  LEARNER_COURSE_DETAILS: '/courses/:id',
  LEARNER_LESSON: '/courses/:courseId/lessons/:lessonId',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];