# Handoff Report — Frontend & CI/CD Audit (R1.6 & R1.7)

## 1. Observation
- **React Query Invalidation**:
  - `TaskPoolPage.tsx:94`: `assignTask(taskId, assigneeId)` called directly; only local `refetch()` executed, failing to invalidate `TASK_QUERY_KEYS.lists()`.
  - `TaskDetailsModal.tsx:343-345`: `deleteTask(task.id)` followed by `window.location.reload()`.
  - `TaskDetailsModal.tsx:155,165,180,197,210,220,232,244,269,281,309` and `TaskEditModal.tsx:48`: multiple mutation actions (`archiveTask`, `updateTaskDetails`, `assignTask`, `requestReassignment`, `approveReassignment`, `rejectReassignment`) bypass React Query mutations and list cache invalidation.
- **dnd-kit Kanban Concurrency**:
  - `TaskKanbanBoard.tsx:275`: `item.stageId = parseInt(stageIdStr, 10)` performs in-place mutation of the dragged item during `onDragOver`.
  - `TaskKanbanBoard.tsx:287-329` and `353-370`: `updateTaskStage` dispatched asynchronously without concurrency locking / disabling in-flight cards or debouncing `handleMoveRight`.
- **i18next Strings**:
  - 407 non-`t()` wrapped Cyrillic text strings identified in JSX components across `zhan-finance-frontend/src`.
  - `i18n.ts:28-57`: only `ru` and `en` bundles configured; no Kazakh (`kk`) dictionary registered.
- **Dead Routes & Imports**:
  - `App.tsx:195`: hardcoded string `"/employee/tasks/pool"` instead of `ROUTES.EMPLOYEE_TASK_POOL`.
  - `ProfilePage.tsx`: orphaned component; `ROUTES.PROFILE` in `App.tsx:132` maps to `DashboardRedirect`.
  - `EmployeeTasksPage.tsx:5,19`: imports `TaskGridBoard` and `TaskGridBoardRef` but renders `TaskKanbanBoard`.
  - 62 unused named imports across 28 frontend files.
- **Tests & CI/CD**:
  - Auth test coverage: `AuthServiceUnitTests.java`, `RefreshTokenRotationTest.java`, `TwoFactorServiceTest.java`, `UserServiceTest.java`, `SecurityConfigTest.java`, `ApiRateLimitFilterTest.java`, `JwtServiceTest.java`. Missing tests for pending employee login, OAuth auto-provisioning edge cases, and logout endpoint invalidation.
  - CRM row-level coverage: `CrmAccessServiceTest.java` lacks test cases for client pre-final stage transitions (`"На проверке"`, `"Review"`, `"Согласование"`, `stage.isPreFinal()`), `canUpdateTaskDetails`, `canAssignTask`, `canUnassignTask`, and `canCreateTaskFor` cross-employee protection.
  - Billing test coverage: backend services tested in `InvoiceAccessServiceTest.java`, `InvoiceServiceTest.java`, `InvoiceStatusTransitionTest.java`, `InvoiceOverdueSchedulerTest.java`, `SubscriptionServiceTest.java`. Missing frontend billing tests and subscription renewal scheduler tests.
  - CI Workflows: `.github/workflows/ci.yml` (frontend) and `.github/workflows/deploy-backend.yml` (backend) strictly block deployment if tests fail (`needs: build` and sequential `./gradlew test` exit codes). Missing PR validation workflows and path filters on `ci.yml`.

## 2. Logic Chain
1. *Query Cache*: Because `TaskPoolPage` and modals execute raw API requests instead of React Query mutation hooks that call `queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.lists() })`, any list view cached under different filter arguments (`['tasks', 'list', {}]`, `['tasks', 'list', undefined]`) fails to receive fresh server state, creating stale UI across navigation transitions.
2. *Kanban Drag Race*: Mutating `item.stageId` in `onDragOver` alters the local memory object before network confirmation. If rapid drag operations occur while `updateTaskStage` is in flight, out-of-order responses can overwrite newer state with older responses.
3. *Internationalization*: Raw Cyrillic text in JSX prevents dynamic language switching to English (and future Kazakh), causing mixed-language UI.
4. *Test Gaps*: While `CrmAccessService` implements fine-grained stage and assignment rules, untested branches (such as client pre-final stage transitions and unassign rules) risk regressions during refactoring.
5. *CI Gatekeeping*: Both `ci.yml` and `deploy-backend.yml` correctly enforce that test suites must pass before any deployment step can execute. However, because workflows only trigger on pushes to `main`, broken code can still be pushed to feature branches without automated CI feedback before merge.

## 3. Caveats
- Read-only audit conducted with zero source code changes applied.
- Production Sentry integration is noted as paused for backend due to Spring Boot 4.1 compatibility, but frontend Sentry is configured.
- No live multi-user network load test was executed for the dnd-kit race condition; finding is established via static code and state flow analysis.

## 4. Conclusion
The frontend and CI/CD pipelines are structurally solid and securely gate production deployments behind test suites. However, 6 [WARNING] issues (React Query cache invalidation gaps, dnd-kit drag concurrency risks, hardcoded UI strings, and lack of PR CI checks) and 7 [INFO] items (dead routes, orphaned pages, unused imports, missing test scenarios, missing `kk` dictionary) should be scheduled for remediation in Phase 2.

## 5. Verification Method
- **Frontend Build & Test**:
  - Run `npx vitest run` in `zhan-finance-frontend/` (all 17 test files pass).
  - Run `npm run build` in `zhan-finance-frontend/` (TypeScript compilation + Vite build).
- **Backend Test**:
  - Run `./gradlew test` in `zhan-finance-backend/` (all 35 JUnit test classes pass).
- **Audit File Inspection**:
  - Read `c:\Users\murat\IdeaProjects\JF-1C\.agents\frontend_ci_explorer_1\frontend_ci_audit.md`.
