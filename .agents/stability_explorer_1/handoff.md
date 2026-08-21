# Handoff Report: Stability & Performance Audit (R1.1 & R1.3)

## 1. Observation
1. **LMS Sort Order**:
   - `CourseService.java:117-127`: `createChapter` sets `chapter.setOrderIndex(orderIndex);` without auto-increment when `orderIndex` is 0.
   - `ChapterRepository.java:11`: `findAllByCourseIdOrderByOrderIndexAsc` sorts solely by `orderIndex` with no secondary tiebreaker.
   - `CourseRepository.java:17-21`: `searchPublishedCourses` and `searchCourses` lack `ORDER BY`.
   - `LessonProgressRepository.java:14-15`: `findAllByCourseIdAndUserId` lacks `ORDER BY`.
2. **Avatar Loading Failure**:
   - `UserService.java:166-169`: `String storageKey = storageService.store(file);` saves with UUID primary key. Sets `user.avatarUrl = "/uploads/avatars/" + storageKey`.
   - `FileDownloadController.java:46-49`: `@GetMapping("/uploads/avatars/{storageKey:.+}")` calls `serveResource("avatars/" + storageKey)`.
   - `DatabaseStorageService.java:83, 118`: `storedFileRepository.findById(storageKey)` queries for ID `"avatars/<uuid>"` which does not match `"uuid"`.
   - `LocalStorageService.java:101-111`: Looks in `./uploads/avatars/<uuid>_<filename>` while file was saved in `./uploads/<uuid>_<filename>`.
3. **WebSocket Connection Drop**:
   - `ChatNotificationContext.tsx:36-80`, `ClientChatPage.tsx:95-172`, `ChatDrawer.tsx:63-118`: `client.activate()` called in `useEffect`; unmounting or route switching triggers `client.deactivate()` before WebSocket handshake finishes.
   - `ChatNotificationContext.tsx:66-74`: `handleVisibilityChange` checks `!client.connected` and invokes `client.forceDisconnect()` during in-flight handshakes.
4. **N+1 Queries**:
   - `CourseService.java:41-51, 72-81`: `courses.forEach(this::initializeCourse)` executes 1 query for courses + N queries for chapters + N*M queries for lessons.
   - `AdminCuratorController.java:74-86`: `getCurators` queries `findByCuratorId` inside loop.
   - `DocumentRepository.java:13, 18, 20` and `DocumentService.java:321-340`: `mapToDto` accesses `user`, `uploadedBy`, `task` without fetch joins (3 lazy queries per document).
   - `ChatService.java:98-114`: `getContacts` iterates through contacts calling `countBySenderIdAndReceiverIdAndIsReadFalse` and `findLastMessage` (2N+1 queries).
5. **Unbounded Collection Loads & In-Memory Pagination**:
   - `AuditLogController.java:27`: `auditLogRepository.findAll(...)` with no pagination.
   - `NotificationController.java:28`: `notificationRepository.findByUserIdOrderByCreatedAtDesc(...)` with no pagination.
   - `DocumentController.java:56, 60`: `getUserDocuments` and `getAllVisibleDocuments` with no pagination.
   - `InvoiceController.java:78` and `SubscriptionController.java:31`: `findAll` with no pagination.
   - `ChatService.java:44`: `findChatHistoryFull` with no pagination.
   - `TaskSpecification.java:36`: `root.fetch("services", JoinType.LEFT)` on paginated queries causes Hibernate in-memory pagination (`HHH000104`).
6. **Caffeine Cache & Eviction**:
   - `CacheConfig.java:14-30`: `maximumSize` and `expireAfterWrite` configured on all caches (custom and fallback 300 items / 60s).
   - `PipelineController.java:45-85`: `createStage`, `updateStage`, `deleteStage` lack `@CacheEvict`.
   - `AdminService.java:72-140`: Staff approval, role changes, and unassignments lack `@CacheEvict`.

## 2. Logic Chain
1. **Avatar 404 Chain**: `UserService.uploadAvatar` -> saves file as `uuid` -> sets `avatarUrl = "/uploads/avatars/uuid"` -> frontend calls `GET /api/uploads/avatars/uuid` -> `FileDownloadController.downloadAvatar` appends `"avatars/"` -> `DatabaseStorageService` calls `findById("avatars/uuid")` -> lookup fails (DB key is `uuid`) -> throws `ResourceNotFoundException` (404).
2. **WebSocket Handshake Abort Chain**: Multiple components create separate STOMP clients -> `activate()` is called -> React route changes or tab visibility switches -> `deactivate()` or `forceDisconnect()` is called before HTTP 101 upgrade finishes -> browser fires `WebSocket is closed before the connection is established`.
3. **LMS Sort Order Chain**: Admin creates chapters without `orderIndex` -> backend defaults to 0 -> DB stores multiple chapters with `orderIndex=0` -> `ChapterRepository` sorts `ORDER BY orderIndex ASC` with no secondary sort -> PostgreSQL returns rows in physical table scan order -> UI displays erratic chapter ordering.
4. **Memory / N+1 Chain**: List endpoints (`getAllCourses`, `getCurators`, `getContacts`, `getAllVisibleDocuments`, `getAllAuditLogs`) load full tables and execute subqueries inside loops or in-memory pagination -> on a 512MB RAM VM, simultaneous requests risk heap exhaustion.

## 3. Caveats
- Production data volume is currently small, so N+1 queries and unbounded collections have not yet caused OOM in dev/staging, but represent critical vulnerabilities under production load.
- WebSocket session tracking on the broker side is managed by Spring's built-in `SimpleBrokerMessageHandler` and relies on heartbeat timeouts.

## 4. Conclusion
- All root causes for R1.1 known issues and R1.3 stability/memory concerns are confirmed with exact file paths and line numbers.
- Proposed remediations are fully documented in `stability_audit.md`.
- No source code changes were applied during Phase 1.

## 5. Verification Method
- Static verification completed by line-by-line inspection of backend Spring services, repositories, Criteria specifications, configuration beans, and frontend React STOMP hooks.
- Verification in Phase 2: Run `./gradlew test` for backend regression tests and `npm run test` for frontend test suite.
