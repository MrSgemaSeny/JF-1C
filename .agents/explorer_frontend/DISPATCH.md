# DISPATCH: Frontend Survey Explorer

Working directory: c:\Users\murat\IdeaProjects\JF-1C\.agents\explorer_frontend
Original Request: c:\Users\murat\IdeaProjects\JF-1C\.agents\ORIGINAL_REQUEST.md
Output report: c:\Users\murat\IdeaProjects\JF-1C\.agents\explorer_frontend\report.md

Mission:
Survey frontend architecture in zhan-finance-frontend, existing Vitest and RTL configuration, test files, entity APIs, features, widgets, pages, shared utils, ESLint 9 setup, and TypeScript configuration.
Enumerate all test targets, missing coverage, lint issues, and typecheck status.
Do not write or modify source code. Only explore and produce report.md.

## 2026-09-15T05:18:00Z
User Request:
Survey the frontend codebase and testing / quality infrastructure in zhan-finance-frontend:
1. Review package.json, vite.config.ts, tsconfig.json, eslint configuration.
2. What test runner is configured? (Vitest, @testing-library/react, jsdom, coverage-v8).
3. Survey existing tests and identify existing test mocks/utilities (render with providers, query client, router mocks).
4. Survey target test modules specified in ORIGINAL_REQUEST.md:
   - Entity API layer (entities/task/api, entities/billing/api, entities/client/api, entities/course/api, entities/notification/api, entities/document/api).
   - Features & Contexts (features/auth/authApi, features/contact-form/useContactForm [note rule on WhatsApp flow vs backend api], features/notifications/NotificationContext, features/labels/api).
   - Widgets (widgets/chat/ChatDrawer, widgets/dashboard-shell/DashboardSidebar, widgets/dashboard-shell/NotificationBell, widgets/task-board/TaskCreateModal, widgets/task-board/TaskRejectModal, widgets/search/GlobalSearch).
   - Dashboard Pages (AdminEmployeesPage, AdminTasksPage, AdminInvoicesPage, ClientOverviewPage, SettingsPage, LearnerCoursesPage, LearnerLessonPage).
   - Shared Utilities (notificationTranslator, dateFormat, taskTranslator).
5. Survey Vitest coverage configuration in vite.config.ts:
   - How to configure V8 coverage thresholds (>=70% lines/statements). What files should be included/excluded?
6. Survey ESLint configuration:
   - Current ESLint version and config. What is needed for ESLint 9 flat config (eslint.config.js) with TypeScript ESLint and React Hooks plugins enforcing 0 warnings?
   - Current lint status (any existing errors/warnings?).
7. Survey TypeScript typecheck:
   - tsconfig.json strict mode, `noEmit` script in package.json (`npm run typecheck`). Current typecheck status.
