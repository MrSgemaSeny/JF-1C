# JF-1C Pre-Release Audit Report
_Date: 2026-08-21_
_Branch: audit/pre-release_
_Status: Phase 1 COMPLETE — Phase 2 PENDING_
_Independent Reviewer Verdict: APPROVED_

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 6 |
| WARNING | 12 |
| INFO | 10 |
| **Total** | **28** |

---

## CRITICAL Findings

### C1 — Avatar 404 [CRITICAL] — Documents/Storage
**Module:** FileDownloadController, DatabaseStorageService
**Root cause:** `FileDownloadController.java:48` constructs storage key as `"avatars/" + storageKey`,
but `DatabaseStorageService.java:118` stores the key in `stored_files` WITHOUT the `avatars/` prefix.
The lookup fails because the key doesn't match what was stored.
**Proposed fix:** Normalize storage key at write time (strip prefix before saving) OR at read time
(strip prefix before lookup). Pick one side and be consistent. Do NOT do both.
**Affected files:**
- `src/main/java/.../documents/controller/FileDownloadController.java:48`
- `src/main/java/.../documents/service/DatabaseStorageService.java:118`

---

### C2 — N+1 Queries [CRITICAL] — LMS, Documents, Chat
**Module:** CourseService, DocumentService, ChatService
**Root cause:** Hibernate lazy loading triggered inside loops:
- Course catalog: `1 + N courses + N*M lessons` queries
- Curators: `1 + N` queries
- Documents: `1 + 3N` queries
- Chat contacts: `1 + 2N` queries
**Proposed fix:** Add `JOIN FETCH` or `@EntityGraph` to the affected repository queries.
Each collection that is always needed in the listing should be fetched eagerly in one query.
**Affected files:**
- `src/main/java/.../courses/service/CourseService.java`
- `src/main/java/.../documents/service/DocumentService.java`
- `src/main/java/.../chat/service/ChatService.java`
- Corresponding repository interfaces

---

### C3 — Unbounded Queries / Missing Pagination [CRITICAL] — Audit, Notifications, Billing
**Module:** AuditLogController, NotificationService, DocumentService, InvoiceService, SubscriptionService
**Root cause:**
- `AuditLogController.java:26` — returns full audit log with no page size limit
- Notifications, Documents, Invoices, Subscriptions — list endpoints have no pagination
- `TaskSpecification.java:36` — fetch join on a collection causes Hibernate in-memory pagination
  (HHH90003004 warning) which loads ALL rows into RAM, then slices in Java
**Proposed fix:**
- Add `Pageable` parameter to all list endpoints returning potentially unbounded data
- For TaskSpecification: split the fetch join into a two-query approach (ids first, then fetch)
**Affected files:**
- `src/main/java/.../audit/controller/AuditLogController.java:26`
- `src/main/java/.../notifications/service/NotificationService.java`
- `src/main/java/.../crm/specification/TaskSpecification.java:36`
- `src/main/java/.../billing/service/InvoiceService.java`
- `src/main/java/.../billing/service/SubscriptionService.java`

---

### C4 — V107 Migration NULL Violation [CRITICAL] — Migrations
**Module:** Flyway migration V107
**Root cause:** V107 inserts a row into `courses` with `created_by = NULL` but the column has a
`NOT NULL` constraint. On an existing prod DB this passes because Flyway skips already-applied
migrations. On a clean DB from scratch, V107 fails → entire migration chain halts → app cannot start.
**Proposed fix:** Create new migration V111 that either:
  (a) backfills `created_by` with the first ADMIN user id where NULL, OR
  (b) if the bad insert is the only source of NULLs, fix is just documentation — the prod row
  already exists. Add a comment in V111 explaining the known debt.
Do NOT edit V107.
**Affected files:**
- `src/main/resources/db/migration/V107__*.sql` (read-only — do not edit)
- New file: `src/main/resources/db/migration/V111__fix_courses_created_by_null.sql`

---

### C5 — Missing @Transactional on Multi-Table Mutations [CRITICAL] — CRM, Admin
**Module:** TaskService, AdminService
**Root cause:** The following mutations write to multiple tables (entity + audit_log) without
`@Transactional`. If the audit log write fails, the entity write is NOT rolled back — data
becomes inconsistent and audit trail has gaps.
- `TaskService.requestTask()`
- `AdminService.demoteEmployee()`
- `AdminService.toggleUserStatus()`
- `AdminService.approveRegistration()`
- `AdminService.rejectRegistration()`
- `AdminService.createLearner()`
**Proposed fix:** Add `@Transactional` to each of the 6 methods.
**Affected files:**
- `src/main/java/.../crm/service/TaskService.java`
- `src/main/java/.../admin/service/AdminService.java`

---

### C6 — Seeder Deletes Templates on Every Start [CRITICAL] — Documents
**Module:** OfficialDocumentTemplateSeeder
**Root cause:** `OfficialDocumentTemplateSeeder` deletes existing document templates before
re-inserting them on every application start. If an admin has customized templates in prod,
they are wiped on every deploy.
**Proposed fix:** Add existence check before delete — only seed if table is empty, or use
upsert semantics. Remove the delete-then-insert pattern entirely.
**Affected files:**
- `src/main/java/.../documents/config/OfficialDocumentTemplateSeeder.java`

---

## WARNING Findings

### W1 — LMS Sort Order Collision [WARNING] — LMS
**Module:** CourseService, ChapterRepository
**Root cause:** `CourseService.java:117` uses `orderIndex` for sorting but default value is 0
for all new items → collision. `ChapterRepository.java:11` has no tiebreaker in ORDER BY.
**Proposed fix:** Add `created_at ASC` as secondary sort key in ChapterRepository and
LessonRepository queries.
**Affected files:**
- `src/main/java/.../courses/service/CourseService.java:117`
- `src/main/java/.../courses/repository/ChapterRepository.java:11`

---

### W2 — WebSocket Teardown Race Condition [WARNING] — Chat
**Module:** ChatNotificationContext
**Root cause:** Component unmount / visibility change fires `deactivate()` during an in-flight
SockJS handshake. STOMP receives a disconnect before connection completes → "closed before
connection is established" error.
**Proposed fix:** Check `client.connected` before calling `deactivate()`. Add a guard flag
`isConnecting` that blocks deactivate until handshake resolves.
**Affected files:**
- `src/shared/context/ChatNotificationContext.tsx:36`

---

### W3 — Missing @CacheEvict on Stage and Employee Mutations [WARNING] — CRM, Admin
**Module:** PipelineController, AdminService
**Root cause:**
- `PipelineController.java:45-85` — stage CRUD does not evict `pipelines` cache
- `AdminService.java:72-140` — employee mutations do not evict `users` cache
Dashboard and pipeline lists can show stale data until cache TTL expires.
**Proposed fix:** Add `@CacheEvict(value = "pipelines", allEntries = true)` to stage mutation
methods, and `@CacheEvict(value = "users", allEntries = true)` to employee mutation methods.
**Affected files:**
- `src/main/java/.../crm/controller/PipelineController.java:45-85`
- `src/main/java/.../admin/service/AdminService.java:72-140`

---

### W4 — React Query Invalidation Bypassed [WARNING] — Frontend/CRM
**Module:** TaskPoolPage, TaskDetailsModal
**Root cause:**
- `TaskPoolPage.tsx:90` — makes direct API calls, bypasses React Query cache → stale list after mutation
- `TaskDetailsModal.tsx:155-348` — calls `window.location.reload()` instead of `queryClient.invalidateQueries()`
**Proposed fix:** Replace direct fetch calls with `useMutation` + `onSuccess: () => queryClient.invalidateQueries(...)`.
Remove `window.location.reload()`.
**Affected files:**
- `src/pages/dashboard/employee/TaskPoolPage.tsx:90`
- `src/widgets/task-board/TaskDetailsModal.tsx:155-348`

---

### W5 — dnd-kit Double Submit Race [WARNING] — Frontend/CRM
**Module:** TaskGridBoard / Kanban
**Root cause:** `onDragOver` mutates `item.stageId` in-place before the API call completes.
Rapid drag of the same card triggers multiple simultaneous mutations → race condition,
inconsistent final state.
**Proposed fix:** Add an optimistic update flag (`isDragging` lock) that blocks additional
mutations on the same item until the in-flight request settles.
**Affected files:**
- `src/widgets/task-board/TaskGridBoard.tsx`

---

### W6 — 407 Hardcoded i18n Strings [WARNING] — Frontend
**Module:** Multiple UI components
**Root cause:** 407 JSX string literals are not in the RU/EN dictionaries. Kazakh (kk) locale
is entirely missing.
**Proposed fix:** Extract all hardcoded strings into i18n dictionary files. Kazakh locale is
a lower priority but should be scaffolded.
**Affected files:** Distributed across UI components (407 occurrences)

---

### W7 — ResponseStatusException Not Handled in GlobalExceptionHandler [WARNING] — Backend
**Module:** GlobalExceptionHandler
**Root cause:** `GlobalExceptionHandler` handles custom exceptions but does NOT have a handler
for Spring's `ResponseStatusException`. These fall through to Spring's default error handler
which returns a different JSON structure (without `requestId`).
**Proposed fix:** Add `@ExceptionHandler(ResponseStatusException.class)` to GlobalExceptionHandler.
**Affected files:**
- `src/main/java/.../common/exception/GlobalExceptionHandler.java`

---

### W8 — NPE Hazards in DashboardService and SubscriptionService [WARNING] — CRM, Billing
**Module:** DashboardService, SubscriptionService
**Root cause:**
- `DashboardService.java:74` — `lostReason` can be null, not null-checked before use
- `SubscriptionService.java:95` — `endsAt` can be null on free-tier subscriptions
**Proposed fix:** Add null checks / Optional wrapping before field access.
**Affected files:**
- `src/main/java/.../crm/service/DashboardService.java:74`
- `src/main/java/.../billing/service/SubscriptionService.java:95`

---

### W9 — DatabaseMigrationRunner Duplicates DDL in Application Code [WARNING] — LMS
**Module:** DatabaseMigrationRunner
**Root cause:** `DatabaseMigrationRunner` executes `CREATE TABLE IF NOT EXISTS course_curators`
via JdbcTemplate at application start. This duplicates schema management outside Flyway,
violates the single-source-of-truth principle for schema, and is hard to audit.
**Proposed fix:** Move the DDL to a proper Flyway migration. Keep only idempotent DML seed
logic in the runner (or move it to a proper seeder with `@EventListener`).
**Affected files:**
- `src/main/java/.../courses/config/DatabaseMigrationRunner.java`

---

## INFO Findings

### I1 — 2FA Recovery Codes Missing [INFO] — Auth
2FA (TOTP) has no recovery codes / lost-device fallback. Not a release blocker but users
who lose their authenticator device will be locked out permanently.

### I2 — Caffeine Cache recordStats() Not Called [INFO] — Caching
5 caches (courses, users, pipelines, dashboard, tasks) are not calling `recordStats()`.
Cache hit/miss metrics are invisible in Grafana.

### I3 — Dead Routes / Unused Imports [INFO] — Frontend
Scattered unused imports across frontend. Minor — no functional impact.

### I4 — No PR Workflow Triggers in CI [INFO] — CI/CD
CI runs on push to main only. No PR-level gate means a bad branch could accumulate
issues before merge. Not a blocker for current single-developer workflow.

### I5 — Kazakh Locale (kk) Missing [INFO] — Frontend/i18n
No kk locale dictionary. Relevant for Kazakhstani market but not blocking.

---

## Release Readiness Checklist

- [ ] No secrets in source files
- [ ] `ddl-auto` is not `create`/`update` in prod profile
- [ ] Logout invalidates refresh token end-to-end
- [ ] All errors return structured JSON with requestId
- [ ] CI blocks deploy on test failure — CONFIRMED
- [ ] `./gradlew build` exits 0
- [ ] `npm run build` exits 0
- [ ] Known bugs (C1 avatars, W1 sort order, W2 WebSocket) closed with regression tests

---

## Phase 2 Remediation Order (pending approval)

1. C4 — V107 NULL migration → new V111
2. C1 — Avatar 404 prefix mismatch
3. C5 — @Transactional on 6 methods
4. C6 — OfficialDocumentTemplateSeeder delete-on-start
5. C2 — N+1 queries (LMS first, then Documents, Chat)
6. C3 — Unbounded queries + TaskSpecification pagination fix
7. W1 — LMS sort order tiebreaker
8. W2 — WebSocket teardown race
9. W3 — @CacheEvict gaps
10. W7 — ResponseStatusException handler
11. W8 — NPE hazards
12. W4 — React Query invalidation
13. W5 — dnd-kit race
14. W9 — DatabaseMigrationRunner DDL cleanup
15. W6 — i18next strings (407 — batched)
