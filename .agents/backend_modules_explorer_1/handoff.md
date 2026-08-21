# Handoff Report — Backend Modules & Data Migrations Audit (Phase 1)

**Agent**: backend_modules_explorer_1  
**Handoff Type**: Hard (Task Complete)  
**Date**: 2026-08-21  

---

## 1. Observation

Direct code observations from the codebase:

1. **Flyway Migration V107 (`src/main/resources/db/migration/V107__Seed_1C_Course_And_Curator.sql:13`)**:
   `SELECT (SELECT id FROM app_users WHERE role = 'ADMIN' ORDER BY id ASC LIMIT 1)` is inserted into `courses.created_by`. `V14__Courses_Schema.sql:7` defines `created_by BIGINT NOT NULL REFERENCES app_users(id)`. On a clean database with no pre-existing admin user, this returns NULL and throws `ERROR: null value in column "created_by" violates not-null constraint`.

2. **Avatar Loading Failure (`src/main/java/com/example/zhanfinancebackend/modules/documents/controller/FileDownloadController.java:48`)**:
   `downloadAvatar` calls `serveResource("avatars/" + storageKey)`. In `DatabaseStorageService.java:118`, `storedFileRepository.findById(storageKey)` queries for `"avatars/" + storageKey`, whereas `UserService.uploadAvatar` (`UserService.java:166`) stored the file under raw `UUID` key (e.g. `c032616f-0dd0...`). This causes 404 `ResourceNotFoundException`.

3. **Task Request Transaction & Cache (`src/main/java/com/example/zhanfinancebackend/modules/crm/service/TaskService.java:233`)**:
   `requestTask` performs multiple entity writes (Task, Subtasks, Services association, Notifications, Audit logging) but lacks `@Transactional` and `@CacheEvict(value = {"dashboard_admin", "dashboard_employee", "dashboard_client"}, allEntries = true)`.

4. **Admin Mutations Missing Transactional (`src/main/java/com/example/zhanfinancebackend/modules/admin/service/AdminService.java:100, 112, 129, 150, 209`)**:
   `demoteToEmployee`, `toggleUserStatus`, `approveEmployee`, `rejectEmployee`, `createLearner` mutate database state and publish audit events without `@Transactional`. In `AuditService.java:36`, `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)` drops events when published outside an active transaction.

5. **Unhandled LMS Exceptions (`src/main/java/com/example/zhanfinancebackend/modules/courses/service/CourseService.java:56, 66` & `LessonService.java:37, 45, 66`)**:
   LMS services throw `org.springframework.web.server.ResponseStatusException`. `GlobalExceptionHandler.java:34-151` does not intercept `ResponseStatusException`, falling into `@ExceptionHandler(Exception.class)` which returns HTTP 500 instead of HTTP 404/403.

6. **Dashboard & Subscription Null Safety (`src/main/java/com/example/zhanfinancebackend/modules/crm/service/DashboardService.java:74` & `SubscriptionService.java:95`)**:
   - `DashboardService.java:74`: `m -> m.get("reason").toString()` throws NPE when `reason` is null.
   - `SubscriptionService.java:95`: `!startsAt.isAfter(sub.getEndsAt()) && !endsAt.isBefore(sub.getStartsAt())` throws NPE when `endsAt` or `sub.getEndsAt()` is null for ongoing open-ended subscriptions.

---

## 2. Logic Chain

1. **Clean Database Integrity**: Flyway runs migrations sequentially from V1 to V118 on empty schema. Because V107 depends on `app_users` containing an ADMIN row, running migrations on a clean environment fails before application startup completes.
2. **Avatar Loading Defect**: In DB storage mode (`app.storage.type=db`), `stored_files.id` is the raw UUID returned by `storageService.store()`. Prepending `"avatars/"` in the download controller causes a key mismatch in `storedFileRepository.findById()`, resulting in avatar images failing to load on the frontend.
3. **Transactional Safety**: Without `@Transactional` on `TaskService.requestTask` and `AdminService` methods, network or subordinate component failures leave partial database state. Furthermore, Spring's `@TransactionalEventListener` silently ignores events published outside a transaction, resulting in lost audit logs.
4. **Error Masking**: Because `GlobalExceptionHandler` only defines handlers for a subset of exceptions, common runtime exceptions (`ResponseStatusException`, `IllegalArgumentException`, `MethodArgumentTypeMismatchException`, `DataIntegrityViolationException`) fall through to the fallback 500 error handler, providing generic internal server error JSON to the client.

---

## 3. Caveats

- Migration files V1 to V118 are immutable per project rules; fixes for schema bugs (V107, V35) must be implemented via new migration scripts (e.g. V119+).
- In existing deployed environments on Fly.io, `spring.flyway.baseline-version=110` bypassed earlier migration execution against an already-seeded database, which hid the V107 clean-database failure during previous deploys.
- No source code modifications were made during this audit phase.

---

## 4. Conclusion

15 total findings were identified across the 14 backend modules and migration scripts:
- 4 `[CRITICAL]` findings (V107 clean DB failure, avatar resolution bug, `requestTask` missing `@Transactional` & `@CacheEvict`, `AdminService` missing `@Transactional`).
- 10 `[WARNING]` findings (unhandled exceptions in `GlobalExceptionHandler`, NPEs in `DashboardService` and `SubscriptionService`, redundant `DatabaseMigrationRunner`, `OfficialDocumentTemplateSeeder` replacement risk, missing `@Valid` on controller endpoints, N+1 query patterns, ADVISOR role authorization mismatches, legacy V35 foreign key type mismatch, audit event drops).
- 1 `[INFO]` finding (`ContactRequestService.downloadFile` missing read-only transactional annotation).

All findings are documented with exact file paths, line numbers, confirmed root causes, and proposed remediation steps in `backend_modules_audit.md`.

---

## 5. Verification Method

1. **Flyway Migration Inspection**:
   - Inspect `src/main/resources/db/migration/V107__Seed_1C_Course_And_Curator.sql:13` and `V14__Courses_Schema.sql:7`.
2. **Avatar Path Verification**:
   - Inspect `src/main/java/com/example/zhanfinancebackend/modules/documents/controller/FileDownloadController.java:48` and `src/main/java/com/example/zhanfinancebackend/modules/documents/service/DatabaseStorageService.java:118`.
3. **Transaction Boundary Verification**:
   - Inspect `src/main/java/com/example/zhanfinancebackend/modules/crm/service/TaskService.java:233` and `src/main/java/com/example/zhanfinancebackend/modules/admin/service/AdminService.java:100, 112, 129, 150, 209`.
4. **Exception Handling Verification**:
   - Inspect `src/main/java/com/example/zhanfinancebackend/modules/courses/service/CourseService.java:56` and `src/main/java/com/example/zhanfinancebackend/common/exception/GlobalExceptionHandler.java:34-151`.
5. **Null Safety Verification**:
   - Inspect `src/main/java/com/example/zhanfinancebackend/modules/crm/service/DashboardService.java:74` and `src/main/java/com/example/zhanfinancebackend/modules/billing/service/SubscriptionService.java:95`.
