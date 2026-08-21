# ZhanFinance (JF-1C) — Pre-Release Audit Report: Frontend & CI/CD (R1.6 & R1.7)

**Audit Date**: 2026-08-21  
**Auditor**: Frontend & CI/CD Explorer Subagent  
**Scope**: R1.6 Frontend & R1.7 Tests and CI/CD  
**Mode**: Read-Only Investigation (Zero code modifications applied)

---

## Executive Summary

This audit evaluates the frontend architecture and CI/CD testing pipelines of the ZhanFinance (JF-1C) platform.
Key areas reviewed include TanStack React Query cache key consistency, `@dnd-kit` Kanban board concurrency/race conditions, `i18next` internationalization dictionary completeness, routing integrity/dead code, test coverage across security-critical modules (Auth, CRM Row-Level Security, Billing), and GitHub Actions workflow gatekeeping.

---

## Section 1: R1.6 Frontend Audit

### 1.1 React Query Cache Key Invalidation Consistency

#### Finding FE-RQ-001: Direct API Call in Task Pool Bypasses React Query List Cache Invalidation
- **Severity**: [WARNING]
- **Module**: Frontend / Task Pool (`features/task-pool`, `entities/task`)
- **Confirmed Root Cause**:
  In `zhan-finance-frontend/src/pages/dashboard/shared/task-pool/TaskPoolPage.tsx` (lines 90–102), the `handleAssign` handler calls `assignTask(taskId, assigneeId)` directly from `taskApi.ts` and only executes local `refetch()`. It does NOT use `useAssignTaskMutation` or invoke `queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.lists() })`. As a result, task lists cached under `TASK_QUERY_KEYS.list(filter)` in other pages (e.g., `AdminTasksPage`, `EmployeeTasksPage`) remain stale with outdated assignee data until manually refetched or focused.
- **Affected Files**:
  - `zhan-finance-frontend/src/pages/dashboard/shared/task-pool/TaskPoolPage.tsx` (lines 11, 90-102)
  - `zhan-finance-frontend/src/entities/task/api/taskQueries.ts` (lines 102-112)
- **Proposed Fix**:
  Replace the raw `assignTask` call in `TaskPoolPage.tsx` with `useAssignTaskMutation()` from `taskQueries.ts`, which automatically invalidates `TASK_QUERY_KEYS.lists()` and `TASK_QUERY_KEYS.detail(taskId)`.

#### Finding FE-RQ-002: Hard Browser Reload on Task Deletion Bypasses Query Cache Management
- **Severity**: [WARNING]
- **Module**: Frontend / Task Details Modal (`entities/task/ui`)
- **Confirmed Root Cause**:
  In `zhan-finance-frontend/src/entities/task/ui/TaskDetailsModal.tsx` (lines 340–348), `handleDelete` invokes `await deleteTask(task.id)` directly followed by `window.location.reload();`. This forces a destructive full-page browser refresh instead of cleanly updating the query client cache via `useDeleteTaskMutation()` (which invalidates `TASK_QUERY_KEYS.lists()` and removes `TASK_QUERY_KEYS.detail(task.id)` from cache).
- **Affected Files**:
  - `zhan-finance-frontend/src/entities/task/ui/TaskDetailsModal.tsx` (lines 340-348)
- **Proposed Fix**:
  Use `useDeleteTaskMutation` from `taskQueries.ts` in `TaskDetailsModal.tsx`, invoke `mutateAsync(task.id)`, and close modal on completion without triggering `window.location.reload()`.

#### Finding FE-RQ-003: Task Detail Mutations in Modals Bypass Query Client Cache Invalidation
- **Severity**: [WARNING]
- **Module**: Frontend / Task Modals (`entities/task/ui`)
- **Confirmed Root Cause**:
  Multiple mutation handlers in `TaskDetailsModal.tsx` and `TaskEditModal.tsx` invoke raw API functions without invalidating React Query task lists:
  1. `TaskDetailsModal.tsx` (line 309): `archiveTask(task.id)` called directly without invalidating `TASK_QUERY_KEYS.lists()`.
  2. `TaskDetailsModal.tsx` (lines 165, 180, 197, 210, 269, 281): `updateTaskDetails(task.id, ...)` called directly for title, description, subtasks, and tags without `useUpdateTaskDetailsMutation`.
  3. `TaskDetailsModal.tsx` (lines 155, 220, 232, 244): `assignTask`, `requestReassignment`, `approveReassignment`, `rejectReassignment` called directly without React Query invalidation.
  4. `TaskEditModal.tsx` (line 48): `updateTaskDetails(task.id, ...)` called directly without React Query invalidation.
- **Affected Files**:
  - `zhan-finance-frontend/src/entities/task/ui/TaskDetailsModal.tsx` (lines 155, 165, 180, 197, 210, 220, 232, 244, 269, 281, 309)
  - `zhan-finance-frontend/src/entities/task/ui/TaskEditModal.tsx` (line 48)
- **Proposed Fix**:
  Refactor modal actions to use mutation hooks from `taskQueries.ts` (`useArchiveTaskMutation`, `useUpdateTaskDetailsMutation`, `useAssignTaskMutation`) so query client lists and details are consistently synchronized.

---

### 1.2 dnd-kit Kanban Concurrency and Race Conditions

#### Finding FE-KBN-001: In-Place Mutation of Dragged Item in `onDragOver` Prior to Confirmation
- **Severity**: [WARNING]
- **Module**: Frontend / Task Kanban Board (`widgets/task-board`)
- **Confirmed Root Cause**:
  In `zhan-finance-frontend/src/widgets/task-board/TaskKanbanBoard.tsx` (line 275), inside `onDragOver`:
  `item.stageId = parseInt(stageIdStr, 10);`
  The task object `item` is directly mutated in place during dragging before the user drops the item or the server confirms the transition. If the drag operation is cancelled or aborted, the object in the parent cache or snapshot may retain the mutated `stageId`.
- **Affected Files**:
  - `zhan-finance-frontend/src/widgets/task-board/TaskKanbanBoard.tsx` (lines 258-285)
- **Proposed Fix**:
  Clone the item immutably when moving between column arrays (`const updatedItem = { ...item, stageId: parseInt(stageIdStr, 10) };`) instead of directly modifying `item.stageId`.

#### Finding FE-KBN-002: Missing Concurrency Lock / Debounce on Rapid Stage Movements
- **Severity**: [WARNING]
- **Module**: Frontend / Task Kanban Board (`widgets/task-board`)
- **Confirmed Root Cause**:
  In `zhan-finance-frontend/src/widgets/task-board/TaskKanbanBoard.tsx`:
  1. Lines 287–329 (`onDragEnd`): When moving a card, `updateTaskStage({ id: taskIdNum, stageId: targetStageId })` is executed asynchronously. There is no `inFlightTaskIds` tracking or disable state on the dragged card. A user performing rapid sequential drag actions can dispatch multiple concurrent stage update requests for the same card or multiple cards out of order.
  2. Lines 353–370 (`handleMoveRight`): The quick-move arrow handler does not check if a mutation is already pending for that task, allowing multi-click double submits that send duplicate or conflicting PATCH requests to `/api/v1/tasks/{id}/stage`.
- **Affected Files**:
  - `zhan-finance-frontend/src/widgets/task-board/TaskKanbanBoard.tsx` (lines 287-329, 353-370)
- **Proposed Fix**:
  Maintain a `pendingTaskIds` set in component state or use `isPending` state from `useUpdateTaskStage()`. Disable dragging/clicking for tasks currently in `pendingTaskIds` until the mutation promise resolves.

---

### 1.3 i18next Internationalization Dictionary Completeness

#### Finding FE-I18N-001: 407 Non-i18n Hardcoded UI Strings Across Components
- **Severity**: [WARNING]
- **Module**: Frontend / i18n (`shared/i18n`, multiple UI components)
- **Confirmed Root Cause**:
  A comprehensive scan of `zhan-finance-frontend/src` identified 407 instances of hardcoded Cyrillic text embedded directly in JSX rather than resolved via `t()` dictionary keys.
  Key verified instances include:
  - `GenerateDocumentButton.tsx` (lines 70, 78, 90): "Сгенерировать", "Выберите шаблон", "Нет доступных шаблонов"
  - `TaskCard.tsx` (line 232): "Отказ", "Сотрудник отказался от задачи"
  - `TaskDetailsModal.tsx` (lines 454, 741, 745): "Подписано", "Ожидает подписи", "Ожидается отказ"
  - `TotpVerifyForm.tsx` (lines 149, 154, 156): 2FA warning text and privacy policy links
  - `UserLabelManager.tsx` (lines 56, 73, 84, 109, 111, 119, 137, 143, 152, 175, 181, 188, 199): Labels manager UI labels, buttons, and validation text
  - `SolutionPicker.tsx` (line 224) and `questions.ts` (lines 8–12): Business questionnaire questions and options ("Какая у вас форма бизнеса?", "ИП", "ТОО", etc.)
  - `LeadsPage.tsx` (lines 15–27, 33–50): Lead status mappings ("Новая", "В работе", "Успешно", "Отказ") and question labels
  - `AdminSecurityPage.tsx` (lines 29, 48, 66, 105, 150, 162, 163): 2FA setup instructions and button text
  - `ServiceModal.tsx` (lines 73, 79): File upload format and size validation alerts
- **Affected Files**:
  - `zhan-finance-frontend/src/entities/document-template/ui/GenerateDocumentButton.tsx`
  - `zhan-finance-frontend/src/entities/task/ui/TaskCard.tsx`
  - `zhan-finance-frontend/src/entities/task/ui/TaskDetailsModal.tsx`
  - `zhan-finance-frontend/src/features/auth/ui/TotpVerifyForm.tsx`
  - `zhan-finance-frontend/src/features/labels/ui/UserLabelManager.tsx`
  - `zhan-finance-frontend/src/features/solution-picker/SolutionPicker.tsx`
  - `zhan-finance-frontend/src/features/solution-picker/questions.ts`
  - `zhan-finance-frontend/src/pages/admin/leads/LeadsPage.tsx`
  - `zhan-finance-frontend/src/pages/admin-security/ui/AdminSecurityPage.tsx`
  - `zhan-finance-frontend/src/features/service-modal/ServiceModal.tsx`
- **Proposed Fix**:
  Extract hardcoded strings into `src/shared/i18n/locales/ru/*.json` and `src/shared/i18n/locales/en/*.json` under respective namespaces (`crm`, `tasks`, `modals`, `landing`), and replace JSX text with `t('namespace.key')`.

#### Finding FE-I18N-002: Kazakh (`kk`) Locale Dictionaries Missing in i18n Configuration
- **Severity**: [INFO]
- **Module**: Frontend / i18n (`shared/i18n`)
- **Confirmed Root Cause**:
  `zhan-finance-frontend/src/shared/i18n/i18n.ts` (lines 28–57) only configures `ru` and `en` resource bundles. Despite ZhanFinance being a SaaS CRM for Kazakhstani bookkeeping, Kazakh language (`kk`) dictionaries are not yet registered.
- **Affected Files**:
  - `zhan-finance-frontend/src/shared/i18n/i18n.ts` (lines 24-57)
- **Proposed Fix**:
  Add `kk` locale bundle under `src/shared/i18n/locales/kk/` and register in `i18n.ts` for Kazakh language support.

---

### 1.4 Router Definitions, Dead Routes, and Unused Imports

#### Finding FE-RT-001: Route Constant Inconsistency for Employee Task Pool
- **Severity**: [INFO]
- **Module**: Frontend / Router (`app/App.tsx`, `shared/config/routes.ts`)
- **Confirmed Root Cause**:
  In `zhan-finance-frontend/src/app/App.tsx` (line 195), the route for Employee Task Pool is defined with a raw string literal `<Route path="/employee/tasks/pool" element={<TaskPoolPage />} />` instead of using the existing constant `ROUTES.EMPLOYEE_TASK_POOL` defined in `routes.ts` (line 55).
- **Affected Files**:
  - `zhan-finance-frontend/src/app/App.tsx` (line 195)
  - `zhan-finance-frontend/src/shared/config/routes.ts` (line 55)
- **Proposed Fix**:
  Change line 195 in `App.tsx` to `<Route path={ROUTES.EMPLOYEE_TASK_POOL} element={<TaskPoolPage />} />`.

#### Finding FE-RT-002: Orphaned Page Component `ProfilePage.tsx`
- **Severity**: [INFO]
- **Module**: Frontend / Pages (`pages/profile`)
- **Confirmed Root Cause**:
  The file `zhan-finance-frontend/src/pages/profile/ProfilePage.tsx` exists and defines a user profile page with logout button. However, `ROUTES.PROFILE` (`/profile`) in `App.tsx` (line 132) renders `<DashboardRedirect />` instead of `ProfilePage`. `ProfilePage` is never imported or routed anywhere in the application.
- **Affected Files**:
  - `zhan-finance-frontend/src/pages/profile/ProfilePage.tsx`
  - `zhan-finance-frontend/src/app/App.tsx` (line 132)
- **Proposed Fix**:
  Either wire `ProfilePage` to a dedicated route (e.g. `/profile/settings` or `/account`) or delete `ProfilePage.tsx` if superseded by `DashboardRedirect` and `SettingsPage`.

#### Finding FE-RT-003: Orphaned Component Import in `EmployeeTasksPage.tsx`
- **Severity**: [INFO]
- **Module**: Frontend / Employee Tasks (`pages/dashboard/employee`)
- **Confirmed Root Cause**:
  In `zhan-finance-frontend/src/pages/dashboard/employee/EmployeeTasksPage.tsx` (lines 5 and 19), `TaskGridBoard` and `TaskGridBoardRef` are imported and a `useRef<TaskGridBoardRef>` is created, but the page actually renders `TaskKanbanBoard` (line 71).
- **Affected Files**:
  - `zhan-finance-frontend/src/pages/dashboard/employee/EmployeeTasksPage.tsx` (lines 5, 19, 71-75)
- **Proposed Fix**:
  Remove `TaskGridBoard` import in `EmployeeTasksPage.tsx` and type `boardRef` as `useRef<TaskKanbanBoardRef>(null)`.

#### Finding FE-RT-004: 62 Unused Named Imports Across Frontend Codebase
- **Severity**: [INFO]
- **Module**: Frontend / Code Quality (various modules)
- **Confirmed Root Cause**:
  Static analysis detected 62 unused named imports across 28 files:
  - `taskQueries.ts` (line 10): unused import `StageDto`
  - `AdminTemplatesPage.tsx` (line 12): unused import `Plus`
  - `AdminCourseEditPage.tsx` (lines 8, 11): unused imports `LessonDto`, `EyeOff`
  - `AdminEmployeesPage.tsx` (lines 10, 11): unused imports `ShieldAlert`, `ShieldCheck`
  - `AdvisorWorkloadPage.tsx` (lines 6, 8, 12, 13): unused imports `type EmployeeWorkloadDto`, `Users`, `Briefcase`, `CheckSquare`, `UserCheck`, `UserPlus`, `ArrowRight`
  - `LeadsPage.tsx` (lines 4, 5, 6): unused imports `Calendar`, `Mail`, `CheckCircle2`, `XCircle`
  - `SettingsPage.tsx` (line 10) & `DashboardSidebar.tsx` (line 11): unused import `API_BASE_URL`
  - `TaskCard.tsx` (lines 6, 9): unused imports `ChevronDown`, `Trash2`
  - `TaskDetailsModal.tsx` (lines 3, 4): unused imports `User`, `CheckSquare`, `Square`
  - `TaskKanbanBoard.tsx` (lines 15, 18): unused imports `arrayMove`, `StageDto`
- **Affected Files**: 28 files in `zhan-finance-frontend/src/`
- **Proposed Fix**:
  Clean up unused imports and types.

---

## Section 2: R1.7 Tests and CI/CD Audit

### 2.1 Test Suite Coverage Analysis

#### 2.1.1 Auth Flow Coverage
- **Status**: Partially Covered
- **Existing Test Classes**:
  - `AuthServiceUnitTests.java` (Register success, Duplicate email conflict, Login bad credentials, Login success)
  - `RefreshTokenRotationTest.java` (Token creation, Rotation, Reuse detection / revocation, Expiration)
  - `TwoFactorServiceTest.java` (TOTP setup, Secret generation, PreAuthToken validation, Brute-force rate limiting)
  - `UserServiceTest.java` (User CRUD, Password update)
  - `SecurityConfigTest.java` (Actuator security, Public vs Protected endpoint access)
  - `ApiRateLimitFilterTest.java` (IP bucket limits, Rate limit headers)
  - Frontend: `AuthContext.test.tsx`, `ProtectedRoute.test.tsx`, `RoleProtectedRoute.test.tsx`, `LoginPage.test.tsx`, `http.test.ts`
- **Missing Test Scenarios**:
  1. Registration approval flow: Employee/Curator/Advisor registration initializes `enabled = false` and `registrationStatus = PENDING`. Missing test verifying that login attempts return `UNAUTHORIZED` with proper error context rather than unhandled server errors.
  2. Google OAuth flow: Backend token verification and auto-provisioning test for new vs existing Google OAuth users.
  3. Logout endpoint: Integration test verifying complete refresh token revocation and cookie clearing.

#### 2.1.2 CRM Row-Level Security (`CrmAccessServiceTest`)
- **Status**: Covered with Gaps
- **Existing Test Classes**:
  - `CrmAccessServiceTest.java` (Client read isolation, Employee won/lost stage restriction, Admin full access, Non-admin final stage lock, Advisor access rules)
  - `AdvisorSecurityIntegrationTest.java` (Advisor cross-client task and document access)
  - `ClientServiceTest.java` (Client creation and assignment)
  - `TaskServiceIntegrationTests.java` (Task lifecycle integration)
  - `PipelineIntegrationTests.java` (Pipeline stages)
  - `CalendarServiceTest.java` (Calendar event ownership)
  - Frontend: `stageAccessUtils.test.ts`, `useTaskActions.test.ts`, `TaskKanbanBoardRestrictions.test.tsx`
- **Missing Test Scenarios in `CrmAccessServiceTest`**:
  1. Client pre-final stage transitions (`CrmAccessService.java` lines 91–101): Logic permitting clients to transition tasks from `"На проверке"`, `"Review"`, `"Согласование"` or `isPreFinal()` to `WON` or `OPEN` is NOT covered by any test case.
  2. `canUpdateTaskDetails`: No unit test asserting that an Employee cannot update details of a task assigned to a different employee.
  3. `canAssignTask`: No unit test asserting that non-admins cannot assign tasks belonging to other users or tasks in closed stages.
  4. `canUnassignTask`: No unit test asserting that only `ADMIN` can unassign tasks and that unassigning closed tasks is forbidden.
  5. `canCreateTaskFor`: No unit test asserting that an Employee cannot create tasks for a client assigned to another employee.

#### 2.1.3 Billing Module Coverage
- **Status**: Partially Covered
- **Existing Test Classes**:
  - `InvoiceAccessServiceTest.java` (Admin, Employee, Client, Advisor read/write permissions)
  - `InvoiceOverdueSchedulerTest.java` (Overdue invoice transition cron)
  - `InvoiceServiceTest.java` (Invoice creation, Audit logging, Finance summary calculations)
  - `InvoiceStatusTransitionTest.java` (Terminal state immutability for PAID and CANCELED invoices)
  - `SubscriptionServiceTest.java` (Subscription creation, Overlap guard validation, Status activation/cancellation)
- **Missing Test Scenarios in Billing**:
  1. Frontend Billing Tests: Zero frontend unit/component tests exist for `AdminInvoicesPage.tsx`, `AdminSubscriptionsPage.tsx`, or `billingApi.ts`.
  2. Subscription Expiry / Renewal: Missing scheduler integration test for subscription expiration transitions.
  3. Invoice Search / Client IDOR: Missing test verifying that a Client cannot list or query another client's invoice summaries via path or query parameters.

---

### 2.2 CI/CD Pipeline Configuration Audit

#### Workflow Verification Summary

| Workflow File | Trigger Condition | Test Step | Build Step | Deploy Target | Deploy Blocks on Test Failure? |
|---|---|---|---|---|---|
| `.github/workflows/ci.yml` | `push: branches: [main]` | `npx vitest run` | `npm run build` | GitHub Pages | **YES** (`deploy` job has `needs: build`) |
| `.github/workflows/deploy-backend.yml` | `push: branches: [main]` (paths: `zhan-finance-backend/**`) | `./gradlew test bootJar --no-daemon` | `bootJar` | Fly.io (`flyctl deploy`) | **YES** (`deploy` step only runs after `./gradlew test` passes) |
| `.github/workflows/db-backup.yml` | `schedule: cron '0 3 * * *'` & `workflow_dispatch` | N/A | N/A | Fly.io Postgres Backup | N/A |

#### Finding CI-001: Missing Pull Request Validation Workflows
- **Severity**: [WARNING]
- **Module**: CI/CD (`.github/workflows`)
- **Confirmed Root Cause**:
  Both `ci.yml` and `deploy-backend.yml` only trigger on `push` to `main`. There is no `pull_request` trigger or dedicated PR validation workflow. Consequently:
  1. Branches and Pull Requests are not automatically tested before merging into `main`.
  2. A broken test on a feature branch will only be caught after merging to `main`, which immediately halts the deployment pipeline on `main`.
- **Affected Files**:
  - `.github/workflows/ci.yml` (lines 3-6)
  - `.github/workflows/deploy-backend.yml` (lines 3-9)
- **Proposed Fix**:
  Add `pull_request: branches: [main]` triggers to `ci.yml` (running `vitest` and `npm run build` without the `deploy` job) and `deploy-backend.yml` (running `./gradlew test` without `flyctl deploy`), or create a unified `pr-checks.yml` workflow.

#### Finding CI-002: Missing Frontend Path Filter in `ci.yml`
- **Severity**: [INFO]
- **Module**: CI/CD (`.github/workflows/ci.yml`)
- **Confirmed Root Cause**:
  `ci.yml` does not specify a `paths` filter. Any push to `main` (including documentation updates or backend-only code changes) triggers a full frontend build and redeployment to GitHub Pages.
- **Affected Files**:
  - `.github/workflows/ci.yml` (lines 3-6)
- **Proposed Fix**:
  Add `paths: ['zhan-finance-frontend/**', '.github/workflows/ci.yml']` to `ci.yml`.

---

## Clean Subcategories (No Issue Found)

1. **CI Deployment Block Integrity**: Verified that neither `ci.yml` nor `deploy-backend.yml` contains `continue-on-error: true` or ignores test failures. If any test fails, deployment to GitHub Pages or Fly.io is strictly blocked.
2. **PostgreSQL Automated Backups**: Verified `.github/workflows/db-backup.yml` executes nightly at 03:00 UTC with 3-attempt retry logic and Telegram failure alerts.
3. **Frontend API Error & 401 Interception**: Verified `zhan-finance-frontend/src/shared/api/http.ts` provides centralized error formatting (`ApiError`), single-flight refresh token handling, and Toast notifications.

---

## Audit Matrix Summary

| ID | Module | Area | Severity | Status |
|---|---|---|---|---|
| FE-RQ-001 | Frontend | Task Pool React Query List Invalidation | [WARNING] | Confirmed |
| FE-RQ-002 | Frontend | Task Details Hard Reload on Delete | [WARNING] | Confirmed |
| FE-RQ-003 | Frontend | Task Modals Direct API Calls | [WARNING] | Confirmed |
| FE-KBN-001 | Frontend | dnd-kit Direct Object Mutation in DragOver | [WARNING] | Confirmed |
| FE-KBN-002 | Frontend | dnd-kit Missing Concurrency Lock on Rapid Drag | [WARNING] | Confirmed |
| FE-I18N-001 | Frontend | 407 Hardcoded Cyrillic UI Strings | [WARNING] | Confirmed |
| FE-I18N-002 | Frontend | Missing Kazakh (`kk`) Locale Resources | [INFO] | Confirmed |
| FE-RT-001 | Frontend | Inconsistent Task Pool Route Constant | [INFO] | Confirmed |
| FE-RT-002 | Frontend | Orphaned `ProfilePage.tsx` Component | [INFO] | Confirmed |
| FE-RT-003 | Frontend | Orphaned `TaskGridBoard` Import in EmployeeTasksPage | [INFO] | Confirmed |
| FE-RT-004 | Frontend | 62 Unused Named Imports | [INFO] | Confirmed |
| CI-001 | CI/CD | Missing Pull Request Validation Workflows | [WARNING] | Confirmed |
| CI-002 | CI/CD | Missing Path Filter on Frontend CI Workflow | [INFO] | Confirmed |
