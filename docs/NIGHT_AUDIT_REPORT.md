# Night Engineering Audit & Refactoring Summary — JF-1C (ZhanFinance)
Date: 2026-07-31

This report summarizes all critical bug fixes, security enhancements, UI polish, and backend optimizations completed during tonight's systematic audit.

---

## 1. Critical Demo & File Upload Bug Fixes
- **Non-blocking Multi-step Operations**:
  - In `TaskCreateModal.tsx`, `SolutionPicker.tsx`, `HomeServices.tsx`, and `ServicesCatalog.tsx`, secondary file attachment uploads are now wrapped in isolated per-file `try/catch` handlers.
  - **Root Cause Fix**: Previously, a failed file upload (due to unsupported mime types, size limits, or network drops) threw an unhandled exception that bypassed `onCreated()` / `setSubmitted(true)`. This left modals open with false error messages while the primary task/contact-request entry had already been saved to PostgreSQL, driving users to repeatedly click submit and generate duplicate entries in DB.
- **Double-submit Protection**:
  - Added `if (loading) return;` guard in `useContactForm.ts` to prevent concurrent API requests during double-click submit.

---

## 2. Security & Role Model Extensions
- **Expanded `/v1/tasks/request` Role Access**:
  - Updated `@PreAuthorize` in `TaskController.java` from `hasRole('CLIENT')` to `hasAnyRole('CLIENT', 'ADMIN', 'EMPLOYEE', 'ADVISOR')`.
  - Allowed `ADMIN` and `EMPLOYEE` (supervisors) to order services from `ServicesCatalog.tsx` and `HomeServices.tsx` without encountering `403 Forbidden` errors.
- **Target Client Resolution**:
  - Enhanced `TaskService.requestTask` to resolve `targetClientId` from `request.clientId()` when invoked by `ADMIN`, `EMPLOYEE`, or `ADVISOR` roles, setting `createdBy` to the authenticated actor and `client` to the target client.
- **Real Client IP Resolution**:
  - Fixed client IP extraction in `DocumentController.java` to check proxy headers (`X-Forwarded-For`, `CF-Connecting-IP`) before falling back to `getRemoteAddr()`.

---

## 3. Browser Console Warnings & Single Page App (SPA) Routing
- **GitHub Pages SPA 404 Handler**:
  - Added `public/404.html` and SPA route decoder script in `index.html`.
  - Resolved `404 Not Found` errors when directly navigating or refreshing deep SPA routes (e.g. `/JF-1C/client`, `/JF-1C/admin`) on GitHub Pages.
- **Cross-Origin-Opener-Policy (COOP) Popup Header**:
  - Configured `.crossOriginOpenerPolicy(coop -> coop.policy(SAME_ORIGIN_ALLOW_POPUPS))` in `SecurityConfig.java`.
  - Resolved `Cross-Origin-Opener-Policy policy would block the window.postMessage call` browser console warnings during Google OAuth popups.
- **Unauthenticated Background Polling Suppression**:
  - Added `getAccessToken()` guards in `ChatNotificationContext.tsx` and `NotificationContext.tsx`.
  - Eliminated unauthenticated 401 polling calls for `/api/v1/chat/unread` and `/api/v1/notifications`.
- **Single-Redirect Session Guard**:
  - Added `isRedirectingToLogin` flag in `http.ts` to prevent concurrent 401 responses from firing multiple duplicate session expired toast alerts and re-triggering `window.location.href` redirects.

---

## 4. UI/UX Polish & Localization
- **Custom Task Rejection Modal**:
  - Replaced native browser `window.prompt` in `TaskDetailsModal.tsx` with a custom modal with a `textarea` for rejection reasons.
- **Native `alert()` Removal**:
  - Replaced native `alert()` popups across `TaskCard.tsx`, `ClientDocumentsPage.tsx`, and `AdminEmployeesPage.tsx` with localized `toast.error()` notifications.
- **Kanban Drag-and-Drop Rollback**:
  - Implemented snapshot-based rollback in `TaskKanbanBoard.tsx` to instantly restore card positions if backend stage update fails.

---

## 5. Backend Stability & Database Performance
- **NullPointerException Guards**:
  - Added `task.getClient() != null` checks in `TaskService.updateTaskStage` to prevent 500 errors on clientless internal tasks.
- **Database Query Optimization**:
  - Replaced in-memory `findAll()` filtering in `AdminService.java` with database-level `count()` and `countTasksByStatus()` queries.

---

## 6. Verification & Commit History

### Verification Status
- **Backend Tests**: `./gradlew test` passed 100% (BUILD SUCCESSFUL).
- **TypeScript**: `npx tsc --noEmit` passed with 0 errors.
- **Vitest**: `npm test` passed (13/13 tests passed).

### Night Commit Sequence (`origin/main`)
- `3325f02` refactor: fix system audit findings across backend and frontend
- `f5e23a3` fix(frontend): replace native prompts with custom modals, add kanban drag rollback, localize toasts
- `c0940a9` fix(frontend): make file upload non-blocking for task creation modal and service forms
- `c115557` fix(frontend): isolate file uploads in SolutionPicker, HomeServices, ServicesCatalog and add submit guard
- `587d092` fix(backend,frontend): expand task request permissions to admin/employee, fix NPE on clientless task stage update, guard 401 redirect
- `944187a` fix(frontend,backend): add GitHub Pages SPA 404 handler, COOP popup header, and guard unauthenticated polling
