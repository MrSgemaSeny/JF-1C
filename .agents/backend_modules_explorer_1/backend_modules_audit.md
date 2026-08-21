# JF-1C (ZhanFinance) — Pre-Release Audit Report: Backend Modules & Data Migrations

**Audit Scope**: R1.4 Data / Migrations & R1.5 Backend Modules (all 14 modules)  
**Date**: 2026-08-21  
**Mode**: READ-ONLY AUDIT (Zero source code modifications applied)

---

## Executive Summary

The pre-release audit of the JF-1C backend codebase evaluated Flyway migration reproducibility, database seeder idempotency, global exception handling, null safety/DTO validation, and transactional boundaries across all 14 application modules (Auth, Admin, CRM, Documents, Billing, LMS/Courses, Chat, Notifications, Audit, Search, Calendar, Landing, Services, Advisor/Analytics).

Key discoveries include:
1. **Critical Migration Blocker**: Migration `V107__Seed_1C_Course_And_Curator.sql` fails on clean databases because it attempts to insert `NULL` into `courses.created_by`, which is defined as `BIGINT NOT NULL`.
2. **Critical Avatar Storage Bug**: `FileDownloadController.downloadAvatar` appends `"avatars/"` to the storage key, causing `DatabaseStorageService` to query `stored_files` with an invalid key and return 404.
3. **Critical Transactional Gap**: `TaskService.requestTask` lacks `@Transactional` and `@CacheEvict`, causing partial writes, stale dashboard caches, and dropped audit logs on client task submissions.
4. **Exception Handling Masking**: `CourseService` and `LessonService` throw `ResponseStatusException`, which `GlobalExceptionHandler` does not handle, returning 500 Internal Server Error instead of 404/403.
5. **Null Pointer Vulnerabilities**: `DashboardService.getAdminDashboard` and `SubscriptionService.hasOverlap` have unhandled null getters that trigger `NullPointerException`.
6. **Role Consistency**: ADVISOR role permissions are out-of-sync between controllers and service layers in CRM, Billing, Document Templates, and Global Search.

---

## Section 1: R1.4 Data / Migrations & Seeders Audit

### 1.1 Flyway Migrations Chain (V1 – V118)

#### Finding 1.1.1 — Clean DB Migration Failure in V107 due to NULL Foreign Key
- **Severity**: `[CRITICAL]`
- **Module**: Data / Migrations (Courses & LMS)
- **Confirmed Root Cause**:
  In `src/main/resources/db/migration/V14__Courses_Schema.sql:7`:
  ```sql
  created_by BIGINT NOT NULL REFERENCES app_users(id)
  ```
  In `src/main/resources/db/migration/V107__Seed_1C_Course_And_Curator.sql:13`:
  ```sql
  INSERT INTO courses (title, description, thumbnail, status, created_by, created_at, updated_at)
  SELECT 
      '1С:Бухгалтерия 8.3 — Полный практический курс', 
      '...', 
      '...', 
      'PUBLISHED', 
      (SELECT id FROM app_users WHERE role = 'ADMIN' ORDER BY id ASC LIMIT 1), 
      CURRENT_TIMESTAMP, 
      CURRENT_TIMESTAMP
  WHERE NOT EXISTS (SELECT 1 FROM courses WHERE title = '1С:Бухгалтерия 8.3 — Полный практический курс');
  ```
  On a clean database, no `ADMIN` user exists in `app_users` at the moment V107 runs. The subquery returns `NULL`. Inserting `NULL` into `courses.created_by` violates the `NOT NULL` constraint and causes Flyway migration failure during fresh deployment.
- **Proposed Fix**: Create a new Flyway migration `V119__Fix_Course_Created_By_Nullability.sql` that alters `courses.created_by` to allow `NULL` (for system/pre-seeded courses) or inserts a fallback system admin record prior to course creation.
- **Affected Files**:
  - `src/main/resources/db/migration/V107__Seed_1C_Course_And_Curator.sql` (immutable)
  - `src/main/resources/db/migration/V119__Fix_Course_Created_By_Nullability.sql` (new)

---

#### Finding 1.1.2 — Foreign Key Type Incompatibility in Legacy V35
- **Severity**: `[WARNING]`
- **Module**: Data / Migrations (Documents)
- **Confirmed Root Cause**:
  In `src/main/resources/db/migration/V35__Create_Document_Templates.sql:6`:
  ```sql
  created_by UUID REFERENCES users(id)
  ```
  In `src/main/resources/db/migration/V1__Init_Schema.sql:2`:
  ```sql
  id BIGSERIAL PRIMARY KEY
  ```
  In PostgreSQL, a `UUID` foreign key cannot reference a `BIGINT` primary key. In the Java entity `DocumentTemplate.java:28`, `createdBy` is mapped as `User` with `Long` ID. Currently in production, `spring.flyway.baseline-version=110` bypasses V35 on existing environments, but this prevents schema rebuilds from scratch without baseline.
- **Proposed Fix**: Add a migration ensuring column `document_templates.created_by` is `BIGINT` referencing `app_users(id)` and remove `UUID` reference.
- **Affected Files**:
  - `src/main/resources/db/migration/V35__Create_Document_Templates.sql` (immutable)
  - `src/main/java/com/example/zhanfinancebackend/modules/documents/entity/DocumentTemplate.java`

---

### 1.2 Seeders & Migration Runners Idempotency

#### Finding 1.2.1 — Redundant and Vulnerable DDL/DML in `DatabaseMigrationRunner`
- **Severity**: `[WARNING]`
- **Module**: Courses / LMS Seeder
- **Confirmed Root Cause**:
  `src/main/java/com/example/zhanfinancebackend/modules/courses/config/DatabaseMigrationRunner.java:22-60`:
  ```java
  @EventListener(ApplicationReadyEvent.class)
  public void runMigration() {
      jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS course_curators (...)");
      jdbcTemplate.execute("INSERT INTO app_users (...)");
      jdbcTemplate.execute("INSERT INTO courses (...) SELECT ... (SELECT id FROM app_users WHERE role = 'ADMIN' ...)");
      jdbcTemplate.execute("UPDATE stages SET is_pre_final = true WHERE name IN ('На проверке', 'Review', 'Согласование')");
  }
  ```
  1. Executes raw SQL DDL and DML on every startup, duplicating Flyway migrations V106, V107, and V38/V39.
  2. If no `ADMIN` user exists, the course insert fails with SQL error logged at `ERROR` level on every boot.
  3. Bypasses Flyway schema version tracking.
- **Proposed Fix**: Remove or disable `DatabaseMigrationRunner.java`. Schema and data migrations belong exclusively in Flyway scripts.
- **Affected Files**:
  - `src/main/java/com/example/zhanfinancebackend/modules/courses/config/DatabaseMigrationRunner.java`

---

#### Finding 1.2.2 — Template Deletion and Count Threshold in `OfficialDocumentTemplateSeeder`
- **Severity**: `[WARNING]`
- **Module**: Documents Seeder
- **Confirmed Root Cause**:
  `src/main/java/com/example/zhanfinancebackend/modules/documents/config/OfficialDocumentTemplateSeeder.java:42, 76-82`:
  ```java
  if (templateRepository.count() >= 3) {
      log.info("Official document templates already exist, skipping DOCX generation.");
      return;
  }
  ```
  1. Checking `count() >= 3` fails if custom templates exist, preventing official templates from being seeded.
  2. In `createTemplateIfAbsent` (lines 76-82), if a template with the same name exists, it deletes it and nullifies document references (`documentRepository.nullifyTemplateReference(t.getId())`), losing template links for previously generated documents.
  3. Uses `implements ApplicationRunner` rather than `@EventListener(ApplicationReadyEvent.class)`.
- **Proposed Fix**: Check template existence by name (`findByNameIgnoreCase`), update template file path in place without deleting/nullifying references, and switch from `ApplicationRunner` to `@EventListener(ApplicationReadyEvent.class)`.
- **Affected Files**:
  - `src/main/java/com/example/zhanfinancebackend/modules/documents/config/OfficialDocumentTemplateSeeder.java`

---

#### Finding 1.2.3 — Seeder Verification for `PipelineSeederService` and `ServiceDatabaseSeeder`
- **Severity**: `[INFO]`
- **Module**: CRM & Services Seeders
- **Status**: No breaking issue found. Idempotency verified.
- **Verification Details**:
  - `PipelineSeederService.java:31-78`: Verifies `pipelineRepository.count() == 0` before inserting pipeline, and checks individual stage names (`hasReviewStage`, `hasReworkStage`) before appending missing stages. Annotated with `@EventListener(ApplicationReadyEvent.class)` and `@Transactional`. Note: Duplicate `orderIndex = 5` is assigned to both "На проверке" and "Доработка" during incremental checks (lines 69 & 75).
  - `ServiceDatabaseSeeder.java:30-51`: Verifies `serviceRepository.count() > 0` before seeding. Fully idempotent upon restart.

---

## Section 2: R1.5 Backend Modules Audit (All 14 Modules)

### Module 1: Auth & User Security (`modules/auth`, `modules/admin`)
- **Status**: Clean / Verified
- **Observations**:
  - `AuthService.java`: `register`, `refresh`, `logout` properly annotated with `@Transactional`. Password hashing via BCrypt. 2FA pre-auth token rate-limited to 5 attempts with auto-invalidation (`TwoFactorService.java:137-148`).
  - `RefreshTokenService.java:82-89`: Scheduled purge for expired refresh tokens (`purgeExpiredTokens`) runs daily at 2:00 AM with `@Transactional`.
  - `TwoFactorService.java:160-164`: Scheduled purge for 2FA pre-auth tokens runs every 5 minutes with `@Transactional`.
- **Finding 2.1.1 (`[CRITICAL]`)**: Missing `@Transactional` on `AdminService` mutation methods (`demoteToEmployee`, `toggleUserStatus`, `approveEmployee`, `rejectEmployee`, `createLearner`).
  - **Exact Location**: `src/main/java/com/example/zhanfinancebackend/modules/admin/service/AdminService.java:100, 112, 129, 150, 209`
  - **Root Cause**: These methods modify users, revoke refresh tokens, and publish audit log events without `@Transactional`. Because `AuditService.handleAuditEvent` uses `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)`, audit events published outside a transaction are dropped and never persisted.
  - **Proposed Fix**: Add `@Transactional` to all mutating methods in `AdminService.java`.
  - **Affected Files**: `src/main/java/com/example/zhanfinancebackend/modules/admin/service/AdminService.java`

---

### Module 2: CRM & Task Management (`modules/crm`)
- **Finding 2.2.1 (`[CRITICAL]`)**: Missing `@Transactional` and `@CacheEvict` on `TaskService.requestTask`
  - **Exact Location**: `src/main/java/com/example/zhanfinancebackend/modules/crm/service/TaskService.java:233-294`
  - **Root Cause**: When a client requests a task via `requestTask`, it saves the task, subtasks, service relations, sends notifications, and triggers audit logging. Unlike `createTask` (line 151), `requestTask` is missing `@Transactional` and `@CacheEvict(value = {"dashboard_admin", "dashboard_employee", "dashboard_client"}, allEntries = true)`. This causes partial writes if notifications fail, leaves dashboard stats stale, and drops audit logs.
  - **Proposed Fix**: Add `@Transactional` and `@CacheEvict(value = {"dashboard_admin", "dashboard_employee", "dashboard_client"}, allEntries = true)` to `TaskService.requestTask`.
  - **Affected Files**: `src/main/java/com/example/zhanfinancebackend/modules/crm/service/TaskService.java`

- **Finding 2.2.2 (`[WARNING]`)**: N+1 Query in `ClientService.getAllClients`
  - **Exact Location**: `src/main/java/com/example/zhanfinancebackend/modules/crm/service/ClientService.java:45-51`
  - **Root Cause**: `getAllClients` fetches all `CLIENT` users and executes `clientProfileRepository.findByUser(user)` in a loop for each client on every request.
  - **Proposed Fix**: Use `clientProfileRepository.findAllWithUser()` directly or batch fetch profiles with `IN (:users)`.
  - **Affected Files**: `src/main/java/com/example/zhanfinancebackend/modules/crm/service/ClientService.java`

- **Finding 2.2.3 (`[WARNING]`)**: Unvalidated Request Bodies and Raw Maps in `TaskController`
  - **Exact Location**:
    - `TaskController.java:193` (`addComment` uses raw `Map<String, String> body`)
    - `TaskController.java:229` (`generateDocument` uses raw `Map<String, String> body`, `UUID.fromString` throws unhandled `IllegalArgumentException` on invalid string)
    - `TaskController.java:283` (`batchUpdateTasks` missing `@Valid` on `TaskBatchOperationRequest`)
    - `PipelineController.java:62` (`updateStage` missing `@Valid` on `StageUpdateRequest`)
  - **Root Cause**: Endpoints accept unvalidated request structures, allowing malformed payload execution that throws unmapped runtime exceptions.
  - **Proposed Fix**: Introduce dedicated record DTOs with Jakarta validation annotations (`@NotBlank`, `@NotNull`) and add `@Valid`.
  - **Affected Files**: `src/main/java/com/example/zhanfinancebackend/modules/crm/controller/TaskController.java`, `PipelineController.java`

- **Finding 2.2.4 (`[WARNING]`)**: Foreign Key Constraint Violation on `PipelineController.deleteStage`
  - **Exact Location**: `src/main/java/com/example/zhanfinancebackend/modules/crm/controller/PipelineController.java:80-85`
  - **Root Cause**: Directly invokes `stageRepository.delete(stage)` without checking whether tasks are assigned to the stage. Database foreign key `fk_tasks_stage` (RESTRICT) causes `DataIntegrityViolationException` which produces 500 error instead of 409/400.
  - **Proposed Fix**: Verify `taskRepository.countByStageId(stageId) == 0` before deletion, or reassign tasks, throwing a structured `ConflictException` if tasks exist.
  - **Affected Files**: `src/main/java/com/example/zhanfinancebackend/modules/crm/controller/PipelineController.java`

---

### Module 3: Documents (`modules/documents`)
- **Finding 2.3.1 (`[CRITICAL]`)**: Avatar Retrieval Failure in `FileDownloadController` / `DatabaseStorageService`
  - **Exact Location**:
    - `src/main/java/com/example/zhanfinancebackend/modules/documents/controller/FileDownloadController.java:48`
    - `src/main/java/com/example/zhanfinancebackend/modules/documents/service/DatabaseStorageService.java:118`
    - `src/main/java/com/example/zhanfinancebackend/modules/auth/service/UserService.java:166-169`
  - **Root Cause**: `UserService.uploadAvatar` saves the avatar into DB storage with key `UUID` (e.g. `c032616f-0dd0...`) and assigns URL `/uploads/avatars/c032616f-0dd0...`. When the browser makes `GET /api/uploads/avatars/{storageKey}`, `FileDownloadController.downloadAvatar` calls `serveResource("avatars/" + storageKey)`. `DatabaseStorageService.loadAsResource("avatars/" + storageKey)` queries `storedFileRepository.findById("avatars/c032616f-0dd0...")`, which fails because the primary key in `stored_files` is `c032616f-0dd0...`, throwing 404 `ResourceNotFoundException`.
  - **Proposed Fix**: In `FileDownloadController.downloadAvatar`, pass `storageKey` directly without prefixing `"avatars/"`, or strip `"avatars/"` prefix in `DatabaseStorageService.loadAsResource`.
  - **Affected Files**:
    - `src/main/java/com/example/zhanfinancebackend/modules/documents/controller/FileDownloadController.java`
    - `src/main/java/com/example/zhanfinancebackend/modules/documents/service/DatabaseStorageService.java`

---

### Module 4: Billing (`modules/billing`)
- **Finding 2.4.1 (`[WARNING]`)**: Null Pointer Exception in `SubscriptionService.hasOverlap`
  - **Exact Location**: `src/main/java/com/example/zhanfinancebackend/modules/billing/service/SubscriptionService.java:95`
  - **Root Cause**: `!startsAt.isAfter(sub.getEndsAt()) && !endsAt.isBefore(sub.getStartsAt())`. `SubscriptionDto.endsAt` is optional (nullable) and ongoing subscriptions in DB can have `endsAt = null`. Calling `.isAfter(null)` or `.isBefore(null)` throws `NullPointerException` during subscription creation or update.
  - **Proposed Fix**: Null-safe comparison treating null `endsAt` as unbounded future date (`LocalDate.MAX`).
  - **Affected Files**: `src/main/java/com/example/zhanfinancebackend/modules/billing/service/SubscriptionService.java`

- **Finding 2.4.2 (`[INFO]`)**: ADVISOR Role Omitted in `InvoiceController`
  - **Exact Location**: `src/main/java/com/example/zhanfinancebackend/modules/billing/controller/InvoiceController.java:41, 59, 77, 83, 91`
  - **Root Cause**: Endpoints are annotated with `@PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE', 'CLIENT')")`, preventing users with `ADVISOR` role from viewing invoices, contrary to Epic-19 requirements.
  - **Proposed Fix**: Update `@PreAuthorize` to include `'ADVISOR'` on read endpoints.
  - **Affected Files**: `src/main/java/com/example/zhanfinancebackend/modules/billing/controller/InvoiceController.java`

---

### Module 5: LMS / Courses (`modules/courses`)
- **Finding 2.5.1 (`[WARNING]`)**: Unhandled `ResponseStatusException` Masked as 500 Error
  - **Exact Location**:
    - `src/main/java/com/example/zhanfinancebackend/modules/courses/service/CourseService.java:56, 66`
    - `src/main/java/com/example/zhanfinancebackend/modules/courses/service/LessonService.java:37, 45, 66`
  - **Root Cause**: Methods throw `org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found")` and `ResponseStatusException(HttpStatus.FORBIDDEN, ...)`. `GlobalExceptionHandler` has no handler for `ResponseStatusException`, causing it to be intercepted by `@ExceptionHandler(Exception.class)`, which logs an error and returns HTTP 500 Internal Server Error with a tracking ID instead of HTTP 404/403.
  - **Proposed Fix**: Replace `ResponseStatusException` with standard project exceptions (`ResourceNotFoundException`, `AccessDeniedException`), and add an explicit `@ExceptionHandler(ResponseStatusException.class)` in `GlobalExceptionHandler.java`.
  - **Affected Files**:
    - `src/main/java/com/example/zhanfinancebackend/modules/courses/service/CourseService.java`
    - `src/main/java/com/example/zhanfinancebackend/modules/courses/service/LessonService.java`
    - `src/main/java/com/example/zhanfinancebackend/common/exception/GlobalExceptionHandler.java`

- **Finding 2.5.2 (`[INFO]`)**: Sort Order in LMS Modules / Lessons
  - **Exact Location**: `src/main/java/com/example/zhanfinancebackend/modules/courses/entity/Course.java:46`, `Chapter.java:30`
  - **Root Cause**: `@OrderBy("orderIndex ASC, id ASC")` sorts by `id` rather than `createdAt ASC` when `orderIndex` is equal.
  - **Proposed Fix**: Keep `@OrderBy("orderIndex ASC, createdAt ASC, id ASC")` for deterministic ordering.
  - **Affected Files**: `Course.java`, `Chapter.java`.

---

### Module 6: Chat (`modules/chat`)
- **Finding 2.6.1 (`[WARNING]`)**: N+1 Query in `ChatService.getContacts`
  - **Exact Location**: `src/main/java/com/example/zhanfinancebackend/modules/chat/service/ChatService.java:101-102`
  - **Root Cause**: For every contact returned, `getContacts` executes two separate SQL queries: `chatMessageRepository.countBySenderIdAndReceiverIdAndIsReadFalse` and `chatMessageRepository.findLastMessage`. For 50 contacts, this issues 100 queries sequentially.
  - **Proposed Fix**: Use a single native SQL or JPQL query with `GROUP BY sender_id` and window function for unread counts and last messages.
  - **Affected Files**: `src/main/java/com/example/zhanfinancebackend/modules/chat/service/ChatService.java`

---

### Module 7: Notifications (`modules/notifications`)
- **Status**: Clean / Verified
- **Observations**:
  - `NotificationService.java`: `createNotification`, `notifyAdmins`, `markAsRead`, `markAllAsRead` are properly annotated with `@Transactional`.
  - `TelegramNotifierService.java`: Async execution wrapped in try-catch to prevent failure propagation to business workflows.

---

### Module 8: Audit (`modules/audit`)
- **Finding 2.8.1 (`[WARNING]`)**: Silent Drop of Audit Events on Non-Transactional Methods
  - **Exact Location**: `src/main/java/com/example/zhanfinancebackend/modules/audit/service/AuditService.java:36`
  - **Root Cause**:
    ```java
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleAuditEvent(AuditEvent event)
    ```
    `@TransactionalEventListener` without `fallbackExecution = true` silently drops published events if there is no active Spring transaction at the call site (e.g. non-transactional methods in `AdminService` or login failure logging).
  - **Proposed Fix**: Add `fallbackExecution = true` to `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)`.
  - **Affected Files**: `src/main/java/com/example/zhanfinancebackend/modules/audit/service/AuditService.java`

---

### Module 9: Search (`modules/search`)
- **Finding 2.9.1 (`[WARNING]`)**: ADVISOR Role Excluded from Global Search Results
  - **Exact Location**: `src/main/java/com/example/zhanfinancebackend/modules/search/service/GlobalSearchService.java:71-82, 91-100`
  - **Root Cause**: `canAccessTask` and `canAccessUser` return `false` for `Role.ADVISOR`, preventing advisors from finding tasks and clients in global search.
  - **Proposed Fix**: Add `|| user.getRole() == Role.ADVISOR` to the administrator access branch in `canAccessTask` and `canAccessUser`.
  - **Affected Files**: `src/main/java/com/example/zhanfinancebackend/modules/search/service/GlobalSearchService.java`

---

### Module 10: Landing (`modules/landing`)
- **Finding 2.10.1 (`[INFO]`)**: Missing `@Transactional(readOnly = true)` on `ContactRequestService.downloadFile`
  - **Exact Location**: `src/main/java/com/example/zhanfinancebackend/modules/landing/service/ContactRequestService.java:209`
  - **Root Cause**: `downloadFile` queries `ContactRequest` and `ContactRequestFile` without `@Transactional(readOnly = true)`.
  - **Proposed Fix**: Add `@Transactional(readOnly = true)` to `downloadFile`.
  - **Affected Files**: `src/main/java/com/example/zhanfinancebackend/modules/landing/service/ContactRequestService.java`

---

### Module 11: Services Catalog (`modules/services`)
- **Status**: Clean / Verified
- **Observations**:
  - `ServiceService.java`: `getAllActiveServices`, `getHighlightedServices` properly marked `@Transactional(readOnly = true)`.
  - `ServiceEntity.java`: `@ElementCollection(fetch = FetchType.EAGER)` on `features` ensures safe serialization without `LazyInitializationException`.

---

### Module 12: Calendar (`modules/calendar` / `modules/crm`)
- **Status**: Clean / Verified
- **Observations**:
  - `CalendarService.java`: `getCalendarEvents`, `createEvent`, `updateEvent`, `deleteEvent` properly annotated with `@Transactional`. Ownership check `event.getUser().getId().equals(user.getId())` enforced.
  - `CalendarController.java`: Endpoints secured with `@PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE', 'CLIENT', 'ADVISOR')")`.

---

### Module 13: Analytics & Dashboard (`modules/dashboard`, `modules/analytics`)
- **Finding 2.13.1 (`[WARNING]`)**: Null Pointer Exception in `DashboardService.getAdminDashboard`
  - **Exact Location**: `src/main/java/com/example/zhanfinancebackend/modules/crm/service/DashboardService.java:74`
  - **Root Cause**:
    ```java
    List<Map<String, Object>> reasonList = taskRepository.countTasksByLostReason();
    Map<String, Long> tasksByLostReason = reasonList.stream()
        .collect(Collectors.toMap(
            m -> m.get("reason").toString(),
            m -> ((Number) m.get("count")).longValue()
        ));
    ```
    If any task is marked `LOST` without a reason, `m.get("reason")` is null, causing `NullPointerException`.
  - **Proposed Fix**: Use `m.get("reason") != null ? m.get("reason").toString() : "Не указана"` and handle duplicate keys in `Collectors.toMap`.
  - **Affected Files**: `src/main/java/com/example/zhanfinancebackend/modules/crm/service/DashboardService.java`

---

### Module 14: Global Exception Handling & Error Response Contract
- **Finding 2.14.1 (`[WARNING]`)**: Unhandled Standard Exceptions in `GlobalExceptionHandler`
  - **Exact Location**: `src/main/java/com/example/zhanfinancebackend/common/exception/GlobalExceptionHandler.java:34-151`
  - **Root Cause**: `GlobalExceptionHandler` lacks dedicated handlers for:
    1. `IllegalArgumentException` / `IllegalStateException` (e.g. thrown in `UserLabelService:34` for max labels limit, currently returns 500)
    2. `MethodArgumentTypeMismatchException` (e.g. invalid Long/UUID in path variable, currently returns 500)
    3. `DataIntegrityViolationException` / `ConstraintViolationException` (e.g. foreign key delete conflict, currently returns 500)
    4. `org.springframework.web.server.ResponseStatusException` (used in LMS, currently returns 500)
  - **Proposed Fix**: Add explicit `@ExceptionHandler` methods mapping these to appropriate 400, 404, or 409 responses with structured JSON.
  - **Affected Files**: `src/main/java/com/example/zhanfinancebackend/common/exception/GlobalExceptionHandler.java`

---

## Section 3: Summary Table of Findings

| ID | Severity | Module | Location | Category | Summary |
|---|---|---|---|---|---|
| F-01 | `[CRITICAL]` | Data / Migrations | `V107__Seed_1C_Course_And_Curator.sql:13` | Migration | Clean DB failure: NULL in `courses.created_by` (NOT NULL constraint) |
| F-02 | `[CRITICAL]` | Documents | `FileDownloadController.java:48` | URL Resolution | Avatar load 404: `"avatars/"` prefix added to DB storage key |
| F-03 | `[CRITICAL]` | CRM / Tasks | `TaskService.java:233` | Transactions & Cache | `requestTask` missing `@Transactional` and `@CacheEvict` |
| F-04 | `[CRITICAL]` | Admin / Auth | `AdminService.java:100,112,129,150,209` | Transactions & Audit | Missing `@Transactional` on mutations; audit events silently dropped |
| F-05 | `[WARNING]` | Error Handling | `GlobalExceptionHandler.java:133` | Exception Handling | Missing handlers for `ResponseStatusException`, `IllegalArgumentException`, `MethodArgumentTypeMismatchException` (masking as 500) |
| F-06 | `[WARNING]` | Dashboard | `DashboardService.java:74` | Null Safety | NPE when `lostReason` is null in `tasksByLostReason` collector |
| F-07 | `[WARNING]` | Billing | `SubscriptionService.java:95` | Null Safety | NPE when `endsAt` is null in `hasOverlap` date comparison |
| F-08 | `[WARNING]` | Data / Migrations | `DatabaseMigrationRunner.java:22-60` | Seeder Architecture | Redundant DDL/DML runner bypassing Flyway |
| F-09 | `[WARNING]` | Documents | `OfficialDocumentTemplateSeeder.java:42,76` | Seeder Idempotency | Deletes template and nullifies doc references on startup if count < 3 |
| F-10 | `[WARNING]` | Audit | `AuditService.java:36` | Event Listener | `@TransactionalEventListener` drops events on non-transactional paths |
| F-11 | `[WARNING]` | CRM / Documents | `TaskController.java:193,229,283` | Validation | Missing `@Valid` and raw `Map<String, String>` request bodies |
| F-12 | `[WARNING]` | CRM / Chat | `ClientService.java:45`, `ChatService.java:101` | Performance | N+1 query loops in client and contact retrieval |
| F-13 | `[WARNING]` | Advisor Role | `TaskService.java:609`, `GlobalSearchService.java:71` | Authorization | Role discrepancies: ADVISOR blocked in task reassign and search |
| F-14 | `[WARNING]` | Data / Migrations | `V35__Create_Document_Templates.sql:6` | Migration | Legacy type mismatch: UUID `created_by` vs BIGINT `users.id` |
| F-15 | `[INFO]` | Landing | `ContactRequestService.java:209` | Consistency | `downloadFile` missing `@Transactional(readOnly = true)` |
