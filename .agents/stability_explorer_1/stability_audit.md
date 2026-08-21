# Pre-Release Audit Report: Stability & Performance (R1.1 & R1.3)
**Target Project**: JF-1C (ZhanFinance)  
**Audit Phase**: Phase 1 (Read-Only Analysis)  
**Working Environment**: Fly.io (512MB RAM VM) + PostgreSQL + React 19 Frontend  

---

## Executive Summary
This audit investigates known operational bugs (R1.1) and system stability / memory constraints (R1.3) under the 512MB RAM ceiling of the Fly.io deployment environment. All root causes have been verified directly in the codebase with exact file paths and line numbers. Zero code modifications have been made during this audit phase.

---

## Section 1: R1.1 Known Issues

### Finding 1.1: LMS Course Curriculum & Progress Sort Order Inconsistencies
- **Severity**: `[WARNING]`
- **Module**: LMS (Courses)
- **Confirmed Root Cause**:
  1. **Non-Deterministic Chapter Ordering on Default Order Index**: In `CourseService.java` (lines 117-127, `createChapter`), when chapters are created, `orderIndex` is set directly from the controller request without auto-incrementing. In `AdminCourseController.java` (line 108), `@RequestParam(value = "orderIndex", defaultValue = "0")` defaults to `0`. Consequently, all chapters created without explicit manual ordering receive `orderIndex = 0`. In `ChapterRepository.java` (line 11, `findAllByCourseIdOrderByOrderIndexAsc`), the query specifies only `OrderByOrderIndexAsc` with no secondary tiebreaker (`id ASC` or `createdAt ASC`). This causes non-deterministic ordering of chapters when `orderIndex` values collide.
  2. **Unordered Course & Lesson Search Queries**: In `CourseRepository.java` (lines 17-21, `searchPublishedCourses` and `searchCourses`) and `LessonRepository.java` (lines 9-10, `searchLessons`), JPQL queries contain no `ORDER BY` clauses, returning arbitrary database result ordering.
  3. **Unordered User Lesson Progress History**: In `LessonProgressRepository.java` (lines 14-15, `findAllByCourseIdAndUserId`), the JPQL query lacks an `ORDER BY` clause. In `LessonProgressService.java` (lines 127-135), this method is queried to evaluate daily drip rules and lesson sequencing.
- **Affected Files**:
  - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/courses/service/CourseService.java` (lines 117-127)
  - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/courses/repository/ChapterRepository.java` (line 11)
  - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/courses/repository/CourseRepository.java` (lines 17-21)
  - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/courses/repository/LessonRepository.java` (lines 9-10)
  - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/courses/repository/LessonProgressRepository.java` (lines 14-15)
- **Proposed Fix**:
  - In `CourseService.java` (`createChapter`), auto-calculate `orderIndex` as `course.getChapters().size() + 1` if `orderIndex <= 0`.
  - In `ChapterRepository.java`, update repository method to `List<Chapter> findAllByCourseIdOrderByOrderIndexAscIdAsc(Long courseId);`.
  - In `CourseRepository.java`, append `ORDER BY c.id DESC` to search queries.
  - In `LessonRepository.java`, append `ORDER BY l.chapter.orderIndex ASC, l.orderIndex ASC, l.id ASC` to `searchLessons`.
  - In `LessonProgressRepository.java`, append `ORDER BY lp.id ASC` or `ORDER BY lp.createdAt ASC` to `findAllByCourseIdAndUserId`.

---

### Finding 1.2: Avatar Resolution 404 Failure in Database & Local Storage Services
- **Severity**: `[CRITICAL]`
- **Module**: Auth / Documents (File Storage & Download Pipeline)
- **Confirmed Root Cause**:
  1. **Storage Key Prefix Mismatch in Database Lookup**: In `UserService.java` (lines 166-169), `storageService.store(file)` stores the avatar in `StoredFile` table using a raw UUID key (e.g. `d71c4c1a-8e2b-4e89-9a07-8e6d1e4e25a1`). `UserService` sets `user.avatarUrl = "/uploads/avatars/" + storageKey`.
  2. In `FileDownloadController.java` (lines 46-49), `@GetMapping("/uploads/avatars/{storageKey:.+}")` extracts `storageKey` (`d71c4c1a-...`) and invokes `serveResource("avatars/" + storageKey)`, passing `"avatars/d71c4c1a-..."` as the storage key argument to `StorageService.loadAsResource()`.
  3. In `DatabaseStorageService.java` (lines 83, 118), `storedFileRepository.findById(storageKey)` queries for ID `"avatars/d71c4c1a-..."`. Because the record was saved with ID `"d71c4c1a-..."`, the query returns `Optional.empty()`.
  4. In `DatabaseStorageService.java` (lines 92-99, 133-141), the alternate key prefix-stripping fallback was placed exclusively inside the `localStorageService` catch-block and never applied to the primary `storedFileRepository.findById` lookup.
  5. In `LocalStorageService.java` (lines 58-69, 101-111), files are written directly into `./uploads/<uuid>_<filename>` during `store()`, but `loadAsResource("avatars/" + storageKey)` attempts to resolve `./uploads/avatars/<uuid>_<filename>`, failing disk verification and throwing `ResourceNotFoundException`.
  6. Result: Every avatar download request returns HTTP 404 Not Found.
- **Affected Files**:
  - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/controller/FileDownloadController.java` (lines 46-49)
  - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/service/DatabaseStorageService.java` (lines 83, 118)
  - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/service/LocalStorageService.java` (lines 101-111)
  - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/auth/service/UserService.java` (lines 160-170)
- **Proposed Fix**:
  - In `FileDownloadController.java` (`downloadAvatar`), change `return serveResource("avatars/" + storageKey);` to `return serveResource(storageKey);` OR normalize `storageKey` inside `DatabaseStorageService.java` and `LocalStorageService.java` by stripping `"avatars/"` prefix before querying `storedFileRepository.findById(cleanKey)` and filesystem paths.

---

### Finding 1.3: WebSocket Handshake Abort Race Condition ("closed before connection is established")
- **Severity**: `[WARNING]`
- **Module**: Chat (WebSocket / STOMP Client Lifecycle)
- **Confirmed Root Cause**:
  1. **Component Lifecycle Teardown During In-Flight Handshake**: In `ChatNotificationContext.tsx` (lines 36-80), `ClientChatPage.tsx` (lines 95-172), `EmployeeChatPage.tsx` (lines 95-172), and `ChatDrawer.tsx` (lines 63-118), independent STOMP `Client` instances are created with `new Client(...)` and immediately activated via `client.activate()` inside React `useEffect` hooks. On fast navigation, React component unmounting, or modal drawer open/close toggles, the cleanup function invokes `client.deactivate()` before SockJS / WebSocket HTTP 101 handshake completes. `@stomp/stompjs` + `sockjs-client` aborts the connecting socket, triggering the browser error: `WebSocket connection to '...' failed: WebSocket is closed before the connection is established.`
  2. **Page Visibility State Race**: In `ChatNotificationContext.tsx` (lines 66-74), `ClientChatPage.tsx` (lines 158-166), and `ChatDrawer.tsx` (lines 104-112), `handleVisibilityChange` inspects `if (!client.connected)` and immediately executes `client.forceDisconnect()`. When a user returns to the tab while a connection handshake is actively in progress, `connected` is `false`, and `forceDisconnect()` forcefully severs the in-flight handshake.
  3. **Unauthenticated Connection Attempt on Initial Load**: In `ChatNotificationContext.tsx` (line 38), if `getAccessToken()` is initially null prior to async token restoration, `connectHeaders` is `{}`. In `WebSocketConfig.java` (lines 58-77), the server interceptor detects a missing Bearer token and throws `IllegalArgumentException("Unauthorized...")`, terminating the connection immediately from the server.
- **Affected Files**:
  - `zhan-finance-frontend/src/features/chat/ChatNotificationContext.tsx` (lines 36-80)
  - `zhan-finance-frontend/src/pages/dashboard/client/ClientChatPage.tsx` (lines 95-172)
  - `zhan-finance-frontend/src/pages/dashboard/employee/EmployeeChatPage.tsx` (lines 95-172)
  - `zhan-finance-frontend/src/widgets/chat/ChatDrawer.tsx` (lines 63-118)
  - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/chat/config/WebSocketConfig.java` (lines 55-78)
- **Proposed Fix**:
  - Centralize WebSocket connection: Use the singleton STOMP client in `ChatNotificationContext` across the application instead of spinning up new STOMP clients in each chat page and drawer.
  - Guard client activation: Ensure `client.activate()` is only invoked when `getAccessToken()` is present and valid.
  - Safe visibility reconnection: Update `handleVisibilityChange` to check client active state before forcing disconnect (avoid disconnecting during `ActivationState.ACTIVATING`).

---

## Section 2: R1.3 Stability / Memory (512MB RAM Constraints)

### Finding 2.1: N+1 Query Cascades Across CRM, LMS, Documents, and Chat
- **Severity**: `[CRITICAL]`
- **Module**: Core CRM / LMS / Documents / Chat Modules
- **Confirmed Root Cause**:
  1. **LMS Course Hierarchy Traversal**: In `CourseService.java` (lines 41-51, 72-81 `initializeCourse`), `getAllCourses()` and `getPublishedCourses()` perform `findAllByOrderByIdDesc()` (1 query), then iterate through each course to trigger `course.getChapters().size()` (N queries), and iterate through each chapter to trigger `chapter.getLessons().size()` (N * M queries). This causes a 1 + N + (N * M) query cascade on every course catalog request.
  2. **LMS Curator Course Mapping**: In `AdminCuratorController.java` (lines 74-86, `getCurators`), `userRepository.findAllByRole(Role.CURATOR)` is called, followed by iterating over each curator to execute `courseCuratorRepository.findByCuratorId(c.getId())` (1 + N queries).
  3. **Document List Association Loading**: In `DocumentRepository.java` (lines 13, 18, 20) and `DocumentService.java` (lines 321-340, `mapToDto`), document list queries do not fetch-join `user`, `uploadedBy`, or `task`. During `mapToDto`, calling `document.getUser().getFullName()`, `document.getUploadedBy().getFullName()`, and `document.getTask().getId()` triggers up to 3 individual lazy-loading queries per document.
  4. **Chat Contacts Unread & Last Message Loop**: In `ChatService.java` (lines 98-114, `getContacts`), unique users are fetched, followed by iterating over each contact to execute `chatMessageRepository.countBySenderIdAndReceiverIdAndIsReadFalse(...)` and `chatMessageRepository.findLastMessage(...)`, creating a 2N + 1 query storm.
  5. **Billing Invoices Client Associations**: In `InvoiceRepository.java` (lines 13, 17, `findAllByUser`, `findAllByUserAssignedEmployee`), queries lack fetch joins on `client` and `client.assignedEmployee`, triggering lazy queries during DTO transformation.
- **Affected Files**:
  - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/courses/service/CourseService.java` (lines 41-51, 72-81)
  - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/courses/controller/AdminCuratorController.java` (lines 74-86)
  - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/service/DocumentService.java` (lines 321-340)
  - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/repository/DocumentRepository.java` (lines 13, 18, 20)
  - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/chat/service/ChatService.java` (lines 98-114)
  - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/billing/repository/InvoiceRepository.java` (lines 13, 17)
- **Proposed Fix**:
  - In `CourseRepository.java`, add `@EntityGraph(attributePaths = {"chapters", "chapters.lessons"})` on course catalog queries.
  - In `CourseCuratorRepository.java`, add a batch query `findAllByCuratorIdIn(List<Long> curatorIds)` and group by curator in `AdminCuratorController`.
  - In `DocumentRepository.java`, add `LEFT JOIN FETCH d.user LEFT JOIN FETCH d.uploadedBy LEFT JOIN FETCH d.task` to all document listing queries.
  - In `ChatMessageRepository.java`, create aggregation queries for unread counts and latest messages by sender/receiver groups.
  - In `InvoiceRepository.java`, add `LEFT JOIN FETCH invoice.user client LEFT JOIN FETCH client.assignedEmployee` to `findAllByUser` and `findAllByUserAssignedEmployee`.

---

### Finding 2.2: Unbounded Collection Loads & In-Memory Pagination Memory Risk
- **Severity**: `[CRITICAL]`
- **Module**: Audit / Notifications / Documents / Billing / Chat / CRM
- **Confirmed Root Cause**:
  1. **Unbounded Audit Log Retrieval**: In `AuditLogController.java` (lines 26-28, `getAllAuditLogs`), the endpoint executes `auditLogRepository.findAll(Sort.by(...))` with no pagination or limits. In production, as audit records grow into tens of thousands with JSON payload diffs, this endpoint will load the entire table into JVM memory, triggering OutOfMemoryError on the 512MB Fly.io VM.
  2. **Unbounded Notifications**: In `NotificationController.java` (lines 27-29) and `NotificationService.java` (line 69), `getUserNotifications` queries all notifications without pagination (`findByUserIdOrderByCreatedAtDesc`).
  3. **Unbounded Document Catalog**: In `DocumentController.java` (lines 50-65) and `DocumentService.java` (lines 181-193, `getAllVisibleDocuments`), all visible documents are loaded into a `List<DocumentDto>` without page limits.
  4. **Unbounded Billing & Subscription Records**: In `InvoiceController.java` (line 78) and `SubscriptionController.java` (line 31), `findAll` returns full entity tables without pagination.
  5. **Unbounded Chat History Retrieval**: In `ChatService.java` (line 44), `findChatHistoryFull` fetches all messages ever sent between two users with no upper limit or slicing.
  6. **Hibernate In-Memory Pagination on Tasks**: In `TaskSpecification.java` (line 36), `root.fetch("services", JoinType.LEFT)` fetch-joins a `@ManyToMany` collection in paginated queries (`getAllTasksPaged`). Hibernate cannot apply SQL `LIMIT`/`OFFSET` on collection fetch joins, emitting warning `HHH000104: firstResult/maxResults specified with collection fetch; applying in memory!` and loading all rows into RAM before applying page slicing in Java.
- **Affected Files**:
  - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/audit/controller/AuditLogController.java` (lines 26-28)
  - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/notifications/controller/NotificationController.java` (lines 27-29)
  - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/controller/DocumentController.java` (lines 50-65)
  - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/billing/controller/InvoiceController.java` (lines 76-80)
  - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/billing/controller/SubscriptionController.java` (lines 30-33)
  - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/chat/service/ChatService.java` (lines 37-48)
  - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/crm/repository/TaskSpecification.java` (line 36)
- **Proposed Fix**:
  - Add `Pageable` (`page`, `size`) parameters and return `Page<T>` for `AuditLogController`, `NotificationController`, `DocumentController`, `InvoiceController`, `SubscriptionController`, and `ChatController`.
  - In `TaskSpecification.java`, remove `root.fetch("services", JoinType.LEFT)` from the specification, and rely on `@Fetch(FetchMode.SUBSELECT)` or `@BatchSize` on `Task.services` to avoid in-memory pagination.

---

### Finding 2.3: WebSocket Session Leaks and Connection Lifecycle Verification
- **Status**: `No issue found (Backend Session Lifecycle Verified Clean)`
- **Module**: Chat / WebSocket Broker
- **Verified Code Location**:
  - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/chat/config/WebSocketConfig.java` (lines 22-110)
- **Observations & Assessment**:
  - The backend does not maintain custom static maps or uncleaned session tracking registries.
  - Spring's built-in `SimpleBrokerMessageHandler` manages WebSocket STOMP subscription registries.
  - Heartbeat intervals are configured (4000ms incoming, 4000ms outgoing on client; default broker heartbeats on server), ensuring that dropped connections without TCP FIN are evicted when heartbeats expire.
  - Memory leak risk on backend connection drop is mitigated by Spring's connection cleanup.

---

### Finding 2.4: Caffeine Cache Configuration & Memory Boundaries
- **Severity**: `[INFO]`
- **Module**: Cache Configuration
- **Confirmed Root Cause**:
  1. **Cache Boundaries Configured**: In `CacheConfig.java` (lines 14-30), explicit size limits and time-to-live policies are configured:
     - `dashboard`: `maximumSize(100)`, `expireAfterWrite(60s)`
     - `tasks`: `maximumSize(500)`, `expireAfterWrite(30s)`
     - `users`: `maximumSize(200)`, `expireAfterWrite(300s)`
     - `courses`: `maximumSize(100)`, `expireAfterWrite(120s)`
     - `pipelines`: `maximumSize(50)`, `expireAfterWrite(600s)`
     - Default fallback: `maximumSize(300)`, `expireAfterWrite(60s)`
  2. **Cache Name Mismatch on Dashboard Regions**: In `DashboardService.java` (lines 45, 216) and `TaskService.java` (lines 149, 231, etc.), the cache annotations use names `"dashboard_admin"`, `"dashboard_employee"`, `"dashboard_client"`. These region names were not explicitly registered in `manager.registerCustomCache(...)` and therefore use the default fallback cache configuration (`maximumSize(300)`, `expireAfterWrite(60s)`).
  3. Memory safety: Because the default fallback cache config enforces `maximumSize(300)` and `expireAfterWrite(60s)`, unbounded memory growth does NOT occur. However, explicit cache registration provides clearer operational control.
- **Affected Files**:
  - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/config/CacheConfig.java` (lines 14-30)
  - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/crm/service/DashboardService.java` (lines 45, 216)
- **Proposed Fix**:
  - Register `"dashboard_admin"`, `"dashboard_employee"`, and `"dashboard_client"` explicitly in `CacheConfig.java` with tailored maximum sizes and TTLs. Enable `.recordStats()` if Prometheus cache metrics are desired.

---

### Finding 2.5: Missing Dashboard Cache Eviction on Stage and Staff Mutation Paths
- **Severity**: `[WARNING]`
- **Module**: CRM / Pipelines & Admin Staff Management
- **Confirmed Root Cause**:
  1. **Pipeline Stage Mutations Bypass Cache Eviction**: In `PipelineController.java` (`createStage` lines 45-58, `updateStage` lines 62-76, `deleteStage` lines 80-85), stages are created, updated (including stage type transitions from `OPEN` to `WON`/`LOST`), and deleted without calling `@CacheEvict(value = {"dashboard_admin", "dashboard_employee", "dashboard_client"}, allEntries = true)`. Since `DashboardService.java` (lines 52-53, 64-69) aggregates `wonTasks`, `lostTasks`, and `tasksByStatus` from stage types and names, stage mutations cause stale metrics to be displayed on dashboards for up to 60 seconds.
  2. **Admin Staff State Mutations Bypass Cache Eviction**: In `AdminService.java` (`promoteToAdvisor` lines 72-98, `demoteToEmployee` lines 100-110, `toggleUserStatus` lines 112-121, `approveEmployee` lines 129-140), employees/advisors are promoted, approved, or deactivated, and tasks/clients are unassigned (e.g. lines 81-94) without calling `@CacheEvict`. This leaves `employeesCount`, `clientsCount`, and employee workload dashboards stale until TTL expiry.
  3. **Task User Label Toggle Mutation**: In `TaskService.java` (`toggleTaskUserLabel` lines 828-847), task user labels are added/removed without `@CacheEvict(value = {"dashboard_admin", "dashboard_employee", "dashboard_client"}, allEntries = true)`.
- **Affected Files**:
  - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/crm/controller/PipelineController.java` (lines 45-85)
  - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/admin/service/AdminService.java` (lines 72-140)
  - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/crm/service/TaskService.java` (lines 828-847)
- **Proposed Fix**:
  - Annotate mutating methods in `PipelineController.java` (`createStage`, `updateStage`, `deleteStage`) and `AdminService.java` (`promoteToAdvisor`, `demoteToEmployee`, `toggleUserStatus`, `approveEmployee`) with `@CacheEvict(value = {"dashboard_admin", "dashboard_employee", "dashboard_client"}, allEntries = true)`.
  - Add `@CacheEvict` to `TaskService.toggleTaskUserLabel`.

---

## Section 3: Summary of Findings Table

| ID | Module | Severity | Area | Root Cause Confirmed |
|---|---|---|---|---|
| **1.1** | LMS | `[WARNING]` | Known Issues | Non-deterministic chapter sort order (`orderIndex=0` collisions) and missing `ORDER BY` in search/progress queries. |
| **1.2** | Auth / Docs | `[CRITICAL]` | Known Issues | Storage key prefix `"avatars/"` lookup mismatch in `DatabaseStorageService` / `LocalStorageService` causing 404 on all avatars. |
| **1.3** | Chat / WS | `[WARNING]` | Known Issues | STOMP client teardown during in-flight SockJS handshake on component unmount and visibility state check. |
| **2.1** | Core / LMS / CRM | `[CRITICAL]` | Stability / Memory | N+1 queries in LMS course initialization (1+N+NM), curator mapping (1+N), document mapping (1+3N), and chat contacts (1+2N). |
| **2.2** | Audit / Billing / CRM | `[CRITICAL]` | Stability / Memory | Unbounded list queries in Audit Logs, Notifications, Documents, Billing, Chat; in-memory pagination hazard on Task services fetch join. |
| **2.3** | WebSocket Broker | `[INFO]` | Stability / Memory | No backend session leaks found. Spring SimpleBroker cleans sessions on heartbeat timeout. |
| **2.4** | Cache Config | `[INFO]` | Stability / Memory | Caffeine caches bounded with maximumSize/TTL. Region names `dashboard_admin/client` use default fallback config. |
| **2.5** | CRM / Admin | `[WARNING]` | Stability / Memory | Missing `@CacheEvict` on `PipelineController` stage CRUD, `AdminService` employee approval/promotion, and `TaskService` label toggles. |

---

## Section 4: Verification and Next Steps
- Verification Method:
  - All findings have been verified by inspecting Spring controllers, services, repositories, Criteria specifications, Caffeine configurations, and React STOMP hooks.
  - Phase 1 read-only constraint has been strictly maintained.
  - In Phase 2 remediation, each finding will be resolved with a dedicated commit and verified by unit/integration tests (`./gradlew test` and Vitest).
