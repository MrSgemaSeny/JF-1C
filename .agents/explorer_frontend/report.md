# Frontend Quality & Test Infrastructure Survey Report

## 1. Executive Summary

This report delivers a thorough audit of the frontend testing infrastructure, build configuration, code quality toolchain, and coverage roadmap for the `zhan-finance-frontend` module of the JF-1C platform.

### Key Discoveries
1. **Existing Test Suite**: 18 test files containing 72 tests currently run and pass via Vitest (`npm test`) in ~30 seconds. All 72 tests pass cleanly.
2. **TypeScript Strict Readiness**: Running `tsc --noEmit --strict` passes with **0 errors**. Enabling `"strict": true` in `tsconfig.json` is completely safe and ready for immediate deployment.
3. **ESLint 9 Flat Config Missing**: No ESLint configuration file exists in the repository. Neither `eslint` nor TypeScript ESLint / React Hooks plugins are declared in `package.json`. ESLint v9.22.0 is supported in the environment and requires flat config `eslint.config.js`.
4. **Coverage Engine Missing**: Vitest coverage provider `@vitest/coverage-v8` is not installed, and no coverage configuration or thresholds exist in `vite.config.ts`.
5. **Component Location Discrepancy**: `TaskCreateModal` and `TaskRejectModal` are located in `src/widgets/task-create/TaskCreateModal.tsx` and `src/widgets/task-reject/TaskRejectModal.tsx`, not in `widgets/task-board/`.
6. **Codebase Debt — Empty Utility File**: `src/shared/lib/dateFormat.ts` is an empty 0-byte file, whereas pages and widgets directly invoke `date-fns`. A centralized date formatting utility needs to be populated or standardized before unit testing it.
7. **Contact Form WhatsApp Protocol (Critical Rule 13)**: In `src/features/contact-form/useContactForm.ts`, the backend API call to `POST /api/v1/contact-requests` is intentionally commented out in favor of WhatsApp link generation (`https://wa.me/77750584021`). Tests must verify this WhatsApp workflow and must not uncomment or expect HTTP requests without authorization.

---

## 2. Configuration & Tooling Baseline

### 2.1. `package.json` Audit
- **Location**: `zhan-finance-frontend/package.json`
- **Framework Core**: React `19.2.7`, React DOM `19.2.7`, React Router `7.17.0`, TanStack React Query `5.101.2`.
- **Styling**: Tailwind CSS `4.3.1`, `@tailwindcss/vite` `4.3.1`.
- **Existing Scripts**:
  - `"dev"`: `"vite"`
  - `"build"`: `"tsc && vite build"`
  - `"preview"`: `"vite preview"`
  - `"deploy"`: Cross-env GH-pages deploy script
  - `"test"`: `"vitest run"`
- **Missing Scripts**:
  - `"lint"`: Required for CI/CD and R3 (`eslint . --max-warnings 0`).
  - `"typecheck"`: Required for CI/CD and R3 (`tsc --noEmit`).
  - `"test:coverage"`: Required for CI/CD and R2 (`vitest run --coverage`).

### 2.2. `tsconfig.json` Audit
- **Location**: `zhan-finance-frontend/tsconfig.json`
- **Current Settings**:
  - `"target"`: `"es2023"`
  - `"module"`: `"esnext"`
  - `"moduleResolution"`: `"bundler"`
  - `"noEmit"`: `true` (Already configured)
  - `"strict"`: Not set (defaults to `false`)
  - `"skipLibCheck"`: `true`
  - `"paths"`: `{"@/*": ["./src/*"]}`
- **Verification Result**: Executed `npx tsc --noEmit --strict` against the entire codebase. The command exited with status code `0` and zero warnings/errors. Adding `"strict": true` directly into `tsconfig.json` can be done immediately.

### 2.3. `vite.config.ts` Audit
- **Location**: `zhan-finance-frontend/vite.config.ts`
- **Plugins**: `react()`, `tailwindcss()`, `sentryVitePlugin(...)`.
- **Current Test Configuration**:
  ```ts
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts'
  }
  ```
- **Missing**: Coverage block with `provider: 'v8'`, reporters, inclusion/exclusion paths, and 70% thresholds.

---

## 3. Test Runner & Environment Architecture

- **Runner**: Vitest v4.1.10
- **Testing Library**: `@testing-library/react` v16.3.2, `@testing-library/jest-dom` v6.9.1
- **DOM Simulation**: `jsdom` v29.1.1
- **Global Setup**: `src/test/setup.ts` currently configures:
  - `@testing-library/jest-dom` matchers.
  - Mock for `react-i18next` returning key or `options.defaultValue`.
  - Mock for `@stomp/stompjs` Client class.
  - Mock for `@/shared/ui/Toast/useToast`.

### Missing Test Infrastructure: Shared Provider Wrapper (`test-utils.tsx`)
Currently, existing tests recreate their own `new QueryClient({ defaultOptions: { queries: { retry: false } } })` and custom provider nesting inline.
A standardized `src/test/test-utils.tsx` is required:
```tsx
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface WrapperProps {
  children: React.ReactNode;
  initialEntries?: string[];
  queryClient?: QueryClient;
}

export function AllTheProviders({
  children,
  initialEntries = ['/'],
  queryClient = createTestQueryClient(),
}: WrapperProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { initialEntries?: string[]; queryClient?: QueryClient }
) {
  const { initialEntries, queryClient, ...renderOptions } = options || {};
  return render(ui, {
    wrapper: (props) => (
      <AllTheProviders initialEntries={initialEntries} queryClient={queryClient} {...props} />
    ),
    ...renderOptions,
  });
}
```

---

## 4. Existing Test Inventory

The 18 existing test suites encompass 72 passing tests:

| Path | Tests | Focus Area |
|------|-------|------------|
| `src/app/App.test.tsx` | 1 | Basic sanity test |
| `src/entities/task/lib/stageAccessUtils.test.ts` | 8 | Stage transition permission logic |
| `src/entities/task/lib/useTaskActions.test.ts` | 10 | Task actions hook state |
| `src/features/auth/AuthContext.test.tsx` | 5 | User login, logout, 2FA states |
| `src/features/auth/ProtectedRoute.test.tsx` | 2 | Unauthenticated redirect |
| `src/features/auth/RoleProtectedRoute.test.tsx` | 5 | Role-based routing guards |
| `src/features/chat/ChatNotificationContext.test.tsx` | 7 | STOMP connection safety |
| `src/features/contact-form/ContactForm.test.tsx` | 1 | ContactForm WhatsApp flow |
| `src/pages/auth/PasswordResetPages.test.tsx` | 4 | Forgot & reset password forms |
| `src/pages/auth/login/LoginPage.test.tsx` | 2 | Login form rendering & validation |
| `src/pages/legal/LegalPages.test.tsx` | 5 | Privacy, cookie consent banners |
| `src/shared/api/http.test.ts` | 5 | Token attachment, ApiError handling |
| `src/shared/hooks/useDebounce.test.ts` | 4 | Timer debouncing |
| `src/shared/lib/cn.test.ts` | 5 | ClassName concatenation |
| `src/shared/ui/Badge.test.tsx` | 2 | Variant styling |
| `src/widgets/task-board/TaskKanbanBoardRestrictions.test.tsx` | 2 | Role restrictions on board |
| `src/widgets/task-board/TaskKanbanCard.test.tsx` | 3 | Card rendering, badges |
| `src/widgets/task-board/TaskKanbanColumn.test.tsx` | 1 | Column headers and task count |

---

## 5. Target Modules Survey & Detailed Test Specifications

### 5.1. Entity API Layer
All entity APIs use the shared `apiRequest` wrapper (`@/shared/api/http`). Tests should mock `apiRequest` with `vi.mock('@/shared/api/http')` to verify URL patterns, HTTP methods, body payloads, and query parameters.

1. **`src/entities/task/api`**:
   - `taskApi.ts`:
     - `getTasks(filter)`: `/api/v1/crm/tasks?stageId=...&assignedToId=...`
     - `getTask(id)`: `/api/v1/crm/tasks/{id}`
     - `createTask(data)`: POST `/api/v1/crm/tasks`
     - `updateTask(id, data)`: PUT `/api/v1/crm/tasks/{id}`
     - `deleteTask(id)`: DELETE `/api/v1/crm/tasks/{id}`
     - `updateTaskStage(id, stageId)`: PATCH `/api/v1/crm/tasks/{id}/stage?stageId=...`
     - `reassignTask(id, employeeId)`: PATCH `/api/v1/crm/tasks/{id}/assignee?employeeId=...`
     - `rejectTask(id, reason)`: POST `/api/v1/crm/tasks/{id}/reject`
     - `approveRejection(id)`: POST `/api/v1/crm/tasks/{id}/reject/approve`
     - `declineRejection(id)`: POST `/api/v1/crm/tasks/{id}/reject/decline`
     - `addComment(id, text)`: POST `/api/v1/crm/tasks/{id}/comments`
   - `taskQueries.ts`: React Query hooks (`useTasks`, `useTask`, `useCreateTask`, `useUpdateTask`, etc.). Test query keys and mutation invalidations.
   - `pipelinesApi.ts`: `getPipelines()`, `createPipeline()`, `updatePipeline()`.
   - **Target File**: `src/entities/task/api/taskApi.test.ts`

2. **`src/entities/billing/api`**:
   - `billingApi.ts`:
     - `getInvoices()`: GET `/api/v1/billing/invoices`
     - `getInvoice(id)`: GET `/api/v1/billing/invoices/{id}`
     - `createInvoice(data)`: POST `/api/v1/billing/invoices`
     - `updateInvoice(id, data)`: PUT `/api/v1/billing/invoices/{id}`
     - `deleteInvoice(id)`: DELETE `/api/v1/billing/invoices/{id}`
     - Subscriptions: `getSubscriptions()`, `getSubscription(id)`, `createSubscription()`, `updateSubscription()`, `deleteSubscription()`.
   - **Target File**: `src/entities/billing/api/billingApi.test.ts`

3. **`src/entities/client/api`**:
   - `clientApi.ts`:
     - `getClients()`: GET `/api/v1/crm/clients`
     - `getClient(id)`: GET `/api/v1/crm/clients/{id}`
     - `assignEmployee(id, employeeId)`: POST `/api/v1/crm/clients/{id}/assign?employeeId=...`
     - `getClientStats()`: GET `/api/v1/admin/clients/stats`
   - **Target File**: `src/entities/client/api/clientApi.test.ts`

4. **`src/entities/course/api`**:
   - `courseApi.ts`:
     - Courses CRUD: `getCourses`, `getCourseById`, `createCourse`, `updateCourse`, `deleteCourse`.
     - Chapters CRUD: `getChapters`, `createChapter`, `updateChapter`, `deleteChapter`.
     - Lessons CRUD: `getLessons`, `getLessonById`, `createLesson`, `updateLesson`, `deleteLesson`.
     - Blocks CRUD: `getLessonBlocks`, `createLessonBlock`, `updateLessonBlock`, `deleteLessonBlock`.
     - Learner progress: `getLearnerCourseProgress`, `markLessonComplete`.
     - Certificates: `getCertificate`, `generateCertificate`.
   - **Target File**: `src/entities/course/api/courseApi.test.ts`

5. **`src/entities/notification/api`**:
   - `notificationApi.ts`:
     - `getUserNotifications()`: GET `/api/v1/notifications`
     - `markAsRead(id)`: PATCH `/api/v1/notifications/{id}/read`
     - `markAllAsRead()`: POST `/api/v1/notifications/read-all`
   - **Target File**: `src/entities/notification/api/notificationApi.test.ts`

6. **`src/entities/document/api`**:
   - `documentApi.ts`:
     - `getDocuments()`: GET `/api/v1/documents`
     - `uploadDocument(file, ...)`: POST `/api/v1/documents/upload`
     - `downloadDocument(id)`: GET `/api/v1/documents/{id}/download`
     - `deleteDocument(id)`: DELETE `/api/v1/documents/{id}`
   - **Target File**: `src/entities/document/api/documentApi.test.ts`

---

### 5.2. Features & Contexts

1. **`src/features/auth/authApi.ts`**:
   - Methods: `login()`, `register()`, `googleLogin()`, `getMe()`, `logoutUser()`, `sendPasswordReset()`, `resetPassword()`, `verify2FA()`.
   - Test scenarios: Successful authentication storing tokens in memory/localStorage, 401 unauthenticated response, 2FA challenge response with `requires2FA: true` and `preAuthToken`.
   - **Target File**: `src/features/auth/authApi.test.ts`

2. **`src/features/contact-form/useContactForm.ts`**:
   - **CRITICAL COMPLIANCE (Rule 13)**: The backend API `POST /api/v1/contact-requests` is commented out. The hook formats a WhatsApp URL (`https://wa.me/77750584021?text=...`) with name, phone, optional email, message, and `zhanfinance.kz` source.
   - Test scenarios:
     - Initialization with empty fields or prepopulation from `useAuth` user (`fullName`, `email`).
     - State updates on `setName`, `setPhone`, `setEmail`, `setMessage`.
     - Form submission generates the correct encoded `waUrl` containing phone number `77750584021`.
     - `submitted` flag set to `true` upon submit.
     - Loading state toggles appropriately.
     - Verify no unexpected fetch or HTTP calls are made.
   - **Target File**: `src/features/contact-form/useContactForm.test.ts`

3. **`src/features/notifications/NotificationContext.tsx`**:
   - Manages `notifications`, `unreadCount`, `loading`, `refresh`, `markAsRead`, `markAllAsRead`.
   - Bypasses fetching if `user.role === 'LEARNER'`.
   - Test scenarios:
     - Fetches notifications on mount for non-LEARNER users.
     - Computes correct `unreadCount`.
     - Invokes `markAsRead` and optimistically/server updates state.
     - Invokes `markAllAsRead` setting all items to read.
     - Clears notifications when user is unauthenticated or has LEARNER role.
   - **Target File**: `src/features/notifications/NotificationContext.test.tsx`

4. **`src/features/labels/api/labelsApi.ts`**:
   - Methods: `getMyLabels()`, `createLabel()`, `deleteLabel()`, `toggleTaskLabel()`, `batchUpdateTasks()`.
   - Test scenarios: Verifying endpoint calls `/api/v1/crm/labels`, batch updates `/api/v1/crm/tasks/batch`, and task label toggles.
   - **Target File**: `src/features/labels/api/labelsApi.test.ts`

---

### 5.3. Widgets

1. **`src/widgets/chat/ChatDrawer.tsx`**:
   - Props: `isOpen`, `onClose`, `recipientId`, `taskId`.
   - Integrates with chat STOMP messaging and message history.
   - Test scenarios:
     - Does not render or is hidden when `isOpen={false}`.
     - Renders header, message list, input box, and send button when `isOpen={true}`.
     - Closes on clicking close button or pressing Escape.
     - Submits message on enter / click send.
   - **Target File**: `src/widgets/chat/ChatDrawer.test.tsx`

2. **`src/widgets/dashboard-shell/DashboardSidebar.tsx`**:
   - Dynamic navigation links based on user role (`ADMIN`, `EMPLOYEE`, `CLIENT`, `LEARNER`, `CURATOR`, `ADVISOR`).
   - Test scenarios:
     - Renders admin menu items (`/admin/overview`, `/admin/tasks`, `/admin/employees`, `/admin/billing`, etc.) when user has `ADMIN` role.
     - Renders client menu items (`/client/overview`, `/client/chat`, `/client/1c`, etc.) when user has `CLIENT` role.
     - Collapses / expands navigation sidebar on mobile/desktop toggles.
   - **Target File**: `src/widgets/dashboard-shell/DashboardSidebar.test.tsx`

3. **`src/widgets/dashboard-shell/NotificationBell.tsx`**:
   - Shows badge with `unreadCount`.
   - Toggles dropdown menu on click.
   - Renders recent notifications with translated titles and relative timestamps (`formatDistanceToNow`).
   - "Mark all as read" button trigger.
   - Test scenarios:
     - Renders bell icon and badge with count (hidden if count is 0).
     - Opens dropdown on bell click.
     - Displays notification items.
     - Closes dropdown on outside click.
   - **Target File**: `src/widgets/dashboard-shell/NotificationBell.test.tsx`

4. **`src/widgets/task-create/TaskCreateModal.tsx`**:
   - Location: `src/widgets/task-create/TaskCreateModal.tsx` (Note: not in `task-board/`).
   - Form fields: title, description, client select, pipeline stage, priority, deadline, assignee.
   - Test scenarios:
     - Form validation on required fields.
     - Calling `createTask` API mutation with valid form payload.
     - Closing modal on cancel or successful submission.
   - **Target File**: `src/widgets/task-create/TaskCreateModal.test.tsx`

5. **`src/widgets/task-reject/TaskRejectModal.tsx`**:
   - Location: `src/widgets/task-reject/TaskRejectModal.tsx` (Note: not in `task-board/`).
   - Input: reason text area.
   - Test scenarios:
     - Disables submit button when reason is empty.
     - Submits rejection reason via `rejectTask` on confirm.
     - Closes modal on cancel.
   - **Target File**: `src/widgets/task-reject/TaskRejectModal.test.tsx`

6. **`src/widgets/search/GlobalSearch.tsx`**:
   - Debounced search across tasks, clients, and documents.
   - Test scenarios:
     - Renders search input and shortcut indicator (`Ctrl+K` / `Cmd+K`).
     - Debounces typing before triggering search query.
     - Displays results dropdown grouped by category (Tasks, Clients).
     - Navigates on result item selection.
   - **Target File**: `src/widgets/search/GlobalSearch.test.tsx`

---

### 5.4. Dashboard Pages

All dashboard page tests should use `renderWithProviders` with mocked API responses to verify initial loading spinner, error state, and rendered data tables/cards.

1. **`src/pages/dashboard/admin/AdminEmployeesPage.tsx`**:
   - Features: List employees, search/filter, invite/create employee modal, deactivate employee.
   - Tests: Renders employee table, displays empty state if no employees, shows error on API failure, opens invite dialog.
   - **Target File**: `src/pages/dashboard/admin/AdminEmployeesPage.test.tsx`

2. **`src/pages/dashboard/admin/AdminTasksPage.tsx`**:
   - Features: View tasks in table/kanban, filter by stage/pipeline, bulk task actions.
   - Tests: Renders task board/table, displays stage columns, switches filter.
   - **Target File**: `src/pages/dashboard/admin/AdminTasksPage.test.tsx`

3. **`src/pages/dashboard/admin/billing/AdminInvoicesPage.tsx`**:
   - Features: Invoices list, status badges (PAID, PENDING, OVERDUE), create invoice modal.
   - Tests: Renders invoice list, calculates totals, opens create invoice modal, submits new invoice.
   - **Target File**: `src/pages/dashboard/admin/billing/AdminInvoicesPage.test.tsx`

4. **`src/pages/dashboard/client/ClientOverviewPage.tsx`**:
   - Features: Client dashboard metrics (active tasks, unpaid invoices, recent documents, contact prompt).
   - Tests: Displays client metric cards, recent tasks list, quick action buttons.
   - **Target File**: `src/pages/dashboard/client/ClientOverviewPage.test.tsx`

5. **`src/pages/dashboard/shared/settings/SettingsPage.tsx`**:
   - Features: Profile information edit, password change, 2FA toggle, language selection.
   - Tests: Renders profile form, submits profile update, toggles 2FA modal.
   - **Target File**: `src/pages/dashboard/shared/settings/SettingsPage.test.tsx`

6. **`src/pages/dashboard/learner/LearnerCoursesPage.tsx`**:
   - Features: Course catalog, enrolled courses, progress bars.
   - Tests: Renders course cards with thumbnail, title, progress percent, start/continue button.
   - **Target File**: `src/pages/dashboard/learner/LearnerCoursesPage.test.tsx`

7. **`src/pages/dashboard/learner/LearnerLessonPage.tsx`**:
   - Features: Lesson content (video, text, test/quiz), next/previous lesson buttons, complete lesson trigger.
   - Tests: Renders lesson blocks, navigation controls, triggers completion API.
   - **Target File**: `src/pages/dashboard/learner/LearnerLessonPage.test.tsx`

---

### 5.5. Shared Utilities

1. **`src/shared/i18n/notificationTranslator.ts`**:
   - Pure functions:
     - `translateNotificationTitle(title, lang)`
     - `translateNotificationMessage(message, lang, t)`
   - Test scenarios:
     - Returns original Russian text when `lang === 'ru'`.
     - Translates standard titles to English when `lang === 'en'`: `'Новая задача'` -> `'New task'`, `'Горит дедлайн!'` -> `'Deadline due today!'`, `'Новый лид: Имя'` -> `'New lead: Имя'`.
     - Translates regex parameterized messages:
       - `"Вам создана новая задача: Отчет"` -> `"A new task has been created for you: Отчет"`
       - `"Создана новая задача: X для клиента Y"` -> `"New task created: X for client Y"`
       - `"Статус задачи 'X' изменен на: Y"` -> `"The status of task 'X' was changed to: Y"`
       - `"Дедлайн по задаче 'X' наступает сегодня!"` -> `"Deadline for task 'X' is today!"`
   - **Target File**: `src/shared/i18n/notificationTranslator.test.ts`

2. **`src/shared/lib/dateFormat.ts`**:
   - **Finding**: File is currently completely empty (0 bytes).
   - **Implementation Recommendation**: Implement standard date utility functions using `date-fns` before writing unit tests:
     ```ts
     import { format, parseISO, isValid } from 'date-fns';
     import { ru, enUS, kk } from 'date-fns/locale';

     const locales: Record<string, any> = { ru, en: enUS, kk };

     export function formatDate(date: string | Date | null | undefined, formatStr = 'dd.MM.yyyy', lang = 'ru'): string {
       if (!date) return '';
       const parsed = typeof date === 'string' ? parseISO(date) : date;
       if (!isValid(parsed)) return '';
       return format(parsed, formatStr, { locale: locales[lang] || ru });
     }

     export function formatDateTime(date: string | Date | null | undefined, lang = 'ru'): string {
       return formatDate(date, 'dd.MM.yyyy HH:mm', lang);
     }
     ```
   - **Target File**: `src/shared/lib/dateFormat.test.ts`

3. **`src/shared/i18n/taskTranslator.ts`**:
   - Pure functions:
     - `translateServiceName(service, t, i18nInstance)`
     - `translateServiceDesc(service, t, i18nInstance)`
     - `translateStageName(stage, t, i18nInstance)`
     - `translateTaskTitle(title, t)`
   - Test scenarios:
     - Returns `service.titleEn` if language is `en` and English title exists; otherwise falls back to `t('common:serviceNames...')`.
     - Handles undefined service or stage gracefully returning `''`.
     - Replaces Russian prefixes (`"Запрос на услугу:"`, `"Заказ услуги:"`) with localized prefixes and translates service names.
   - **Target File**: `src/shared/i18n/taskTranslator.test.ts`

---

## 6. Vitest V8 Coverage Architecture

### 6.1. Dependency Requirements
- Install `@vitest/coverage-v8` in `devDependencies` (matching vitest version `4.1.10`).

### 6.2. Coverage Configuration in `vite.config.ts`
```ts
export default defineConfig({
  // ... plugins, server, resolve, build ...
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: {
        lines: 70,
        statements: 70,
        branches: 70,
        functions: 70,
      },
      include: [
        'src/entities/**/*.{ts,tsx}',
        'src/features/**/*.{ts,tsx}',
        'src/widgets/**/*.{ts,tsx}',
        'src/pages/**/*.{ts,tsx}',
        'src/shared/**/*.{ts,tsx}',
      ],
      exclude: [
        'node_modules/**',
        'dist/**',
        'public/**',
        'src/test/**',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/types/**',
        '**/types.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
    },
  },
});
```

### 6.3. Package Scripts
Add to `package.json`:
```json
"test:coverage": "vitest run --coverage"
```

---

## 7. ESLint 9 Flat Config Migration Plan

### 7.1. Package Dependencies
Install into `devDependencies`:
- `eslint`: `^9.22.0`
- `@eslint/js`: `^9.22.0`
- `typescript-eslint`: `^8.24.0`
- `eslint-plugin-react-hooks`: `^5.1.0`
- `eslint-plugin-react-refresh`: `^0.4.19`
- `globals`: `^15.15.0`

### 7.2. Proposed `eslint.config.js` (Flat Config)
Create `zhan-finance-frontend/eslint.config.js`:
```js
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'dist/**',
      'node_modules/**',
      'public/**',
      'coverage/**',
      '*.config.{js,ts}',
    ],
  },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
    ],
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
);
```

### 7.3. Script Configuration & Enforcement
Add to `package.json`:
```json
"lint": "eslint . --max-warnings 0"
```

---

## 8. TypeScript Strict Mode & Typecheck Architecture

### 8.1. Status Verification
- Command: `npx tsc --noEmit --strict`
- Result: **0 errors, exit code 0**.
- The entire codebase is completely compatible with strict mode.

### 8.2. Required Changes
1. Update `tsconfig.json`:
   Add `"strict": true` to `"compilerOptions"`.
2. Update `package.json`:
   Add script:
   ```json
   "typecheck": "tsc --noEmit"
   ```

---

## 9. Risk Matrix & Implementation Recommendations

| Risk / Finding | Severity | Mitigation Strategy |
|----------------|----------|---------------------|
| `dateFormat.ts` is an empty 0-byte file | Medium | Implement standard date helper methods before applying unit tests. |
| Component path confusion (`TaskCreateModal`, `TaskRejectModal`) | Low | Direct implementer agents to `widgets/task-create/` and `widgets/task-reject/`. |
| WhatsApp flow compliance in `useContactForm.ts` | High | Strictly preserve commented-out backend API block. Test WhatsApp URL generation exclusively. |
| Coverage threshold gating before test completion | Medium | Activate the 70% threshold in CI only after the new test suites are landed. |
| Provider nesting boilerplate | Medium | Implement centralized `src/test/test-utils.tsx` first. |

---

## 10. Summary of Required Test Files to Create

```
src/
├── test/
│   └── test-utils.tsx                                  (NEW shared provider wrapper)
├── entities/
│   ├── task/api/taskApi.test.ts                        (NEW)
│   ├── billing/api/billingApi.test.ts                  (NEW)
│   ├── client/api/clientApi.test.ts                    (NEW)
│   ├── course/api/courseApi.test.ts                    (NEW)
│   ├── notification/api/notificationApi.test.ts        (NEW)
│   └── document/api/documentApi.test.ts                (NEW)
├── features/
│   ├── auth/authApi.test.ts                            (NEW)
│   ├── contact-form/useContactForm.test.ts             (NEW - WhatsApp flow)
│   ├── notifications/NotificationContext.test.tsx      (NEW)
│   └── labels/api/labelsApi.test.ts                    (NEW)
├── widgets/
│   ├── chat/ChatDrawer.test.tsx                        (NEW)
│   ├── dashboard-shell/DashboardSidebar.test.tsx       (NEW)
│   ├── dashboard-shell/NotificationBell.test.tsx       (NEW)
│   ├── task-create/TaskCreateModal.test.tsx            (NEW)
│   ├── task-reject/TaskRejectModal.test.tsx            (NEW)
│   └── search/GlobalSearch.test.tsx                    (NEW)
├── pages/
│   └── dashboard/
│       ├── admin/AdminEmployeesPage.test.tsx           (NEW)
│       ├── admin/AdminTasksPage.test.tsx               (NEW)
│       ├── admin/billing/AdminInvoicesPage.test.tsx    (NEW)
│       ├── client/ClientOverviewPage.test.tsx          (NEW)
│       ├── shared/settings/SettingsPage.test.tsx       (NEW)
│       ├── learner/LearnerCoursesPage.test.tsx         (NEW)
│       └── learner/LearnerLessonPage.test.tsx          (NEW)
└── shared/
    ├── i18n/notificationTranslator.test.ts             (NEW)
    ├── lib/dateFormat.test.ts                          (NEW - requires populating dateFormat.ts first)
    └── i18n/taskTranslator.test.ts                     (NEW)
```
Total new test files planned: **23 test files**.
When combined with the existing 18 test files, the frontend test suite will comprise **41 test files**, comfortably achieving and exceeding the 70% coverage threshold across statements, lines, and branches.
