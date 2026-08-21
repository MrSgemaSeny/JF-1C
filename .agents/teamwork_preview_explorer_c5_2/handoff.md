# Handoff Report: C5 Investigation (@Transactional & Audit Lifecycle)

## 1. Observation

### 1.1 AuditService & Event Publishing Mechanics
- Exact path: `src/main/java/com/example/zhanfinancebackend/modules/audit/service/AuditService.java`
- Lines 31-33:
  ```java
  public void logAction(String action, String entityName, Long entityId, Long userId, String details) {
      eventPublisher.publishEvent(new AuditEvent(this, action, entityName, entityId, userId, details));
  }
  ```
- Lines 35-48:
  ```java
  @org.springframework.scheduling.annotation.Async("auditExecutor")
  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void handleAuditEvent(AuditEvent event) {
      AuditLog log = AuditLog.builder()
              .action(event.getAction())
              .entityName(event.getEntityName())
              .entityId(event.getEntityId())
              .userId(event.getUserId())
              .details(event.getDetails())
              .build();
      
      auditLogRepository.save(log);
  }
  ```
- Exact path: `src/main/java/com/example/zhanfinancebackend/modules/audit/listener/HibernateAuditListener.java`
- Lines 46-74: Intercepts Hibernate `PostInsertEvent`, `PostUpdateEvent`, `PostDeleteEvent` for `@AuditedEntity` classes (`User`, `Task`, `Invoice`, `Subscription`, `Course`, `Lesson`, `Certificate`, `Pipeline`, `Stage`, `Document`) and forwards via `auditService.logAction(...)`.

### 1.2 AdminService Transaction Status
- Exact path: `src/main/java/com/example/zhanfinancebackend/modules/admin/service/AdminService.java`
- Line 71: `promoteToAdvisor(Long userId)` has `@org.springframework.transaction.annotation.Transactional`.
- Line 100: `demoteToEmployee(Long userId)` has NO transaction annotation (calls `userRepository.save(user)`, `refreshTokenService.revokeAll(user)`, and `auditService.logAction(...)`).
- Line 112: `toggleUserStatus(Long userId)` has NO transaction annotation (calls `userRepository.save(user)`, `refreshTokenService.revokeAll(user)`, and `auditService.logAction(...)`).
- Line 129: `approveEmployee(Long id)` has NO transaction annotation (calls `userRepository.save(user)`, `emailNotificationService.sendAccountApprovedEmail(user)`, `notificationService.createNotification(...)`).
- Line 150: `rejectEmployee(Long id)` has NO transaction annotation (calls `userRepository.save(user)`).
- Line 209: `createLearner(RegisterRequest request)` has NO transaction annotation (calls `userRepository.save(user)`).
- Lines 64, 123, 164, 170, 176, 180, 199, 203: Read-only query methods have NO `@Transactional(readOnly = true)`.

### 1.3 TaskService Transaction Status
- Exact path: `src/main/java/com/example/zhanfinancebackend/modules/crm/service/TaskService.java`
- Lines 150, 232, 297, 389, 492, 512, 568, 587, 606, 630, 652, 731, 785, 827, 850: All 15 mutating methods are annotated with `@Transactional`.
- Line 232 specifically:
  ```java
  @CacheEvict(value = {"dashboard_admin", "dashboard_employee", "dashboard_client"}, allEntries = true)
  @Transactional
  public TaskDto requestTask(TaskRequestCreateRequest request, User actor) {
  ```
  `TaskService.requestTask` is ALREADY annotated with `@Transactional`.
- Lines 105, 110, 116, 123, 128, 133, 138, 144, 767, 774: All query methods have `@Transactional(readOnly = true)`.

### 1.4 Callers and Controllers
- Exact path: `src/main/java/com/example/zhanfinancebackend/modules/admin/controller/AdminController.java`
- Lines 23-25: `@RestController`, `@RequestMapping("/v1/admin")`, `@PreAuthorize("hasRole('ADMIN')")`. No class-level or method-level `@Transactional`. Calls `AdminService` methods directly.
- Exact path: `src/main/java/com/example/zhanfinancebackend/modules/crm/controller/TaskController.java`
- Calls `TaskService` methods directly.

---

## 2. Logic Chain

1. From **Observation 1.1**, `AuditService.handleAuditEvent` uses `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)`.
2. In Spring Framework, when an event is published outside of an active transaction synchronization context (`TransactionSynchronizationManager.isActualTransactionActive() == false`), the default `fallbackExecution = false` causes Spring to silently drop the event without invoking the listener.
3. From **Observation 1.4**, `AdminController` endpoints do NOT declare transactions.
4. From **Observation 1.2**, methods `demoteToEmployee`, `toggleUserStatus`, `approveEmployee`, `rejectEmployee`, and `createLearner` in `AdminService` do NOT have `@Transactional`.
5. Therefore, when an admin invokes any of these endpoints:
   a. Spring executes the method without a managed transaction boundary.
   b. Any `AuditEvent` published (by `auditService.logAction` or `HibernateAuditListener`) is silently dropped.
   c. No audit log entry is persisted in the database.
   d. If an exception occurs halfway through (e.g. email sending, notification creation, or token revocation), the database changes from preceding repository calls are NOT rolled back, corrupting system state.
6. From **Observation 1.3**, `TaskService.requestTask` is already annotated with `@Transactional` (line 232), so `TaskService` does not suffer from this issue.

---

## 3. Caveats

- In the original audit report `audit_report.md`, `TaskService.requestTask()` was listed among the 6 missing `@Transactional` methods. Code inspection proves it is already annotated with `@Transactional` at line 232.
- In `AdminService.java`, method names in the codebase are `demoteToEmployee`, `approveEmployee`, and `rejectEmployee`, whereas the remediation plan referred to them as `demoteEmployee`, `approveRegistration`, and `rejectRegistration`. The target methods are confirmed by their signature and behavior.
- `promoteToAdvisor` at line 71 of `AdminService.java` already has `@Transactional`.

---

## 4. Conclusion

1. **Root Cause Confirmed**: When `@Transactional` is missing on mutating methods, Spring's `@TransactionalEventListener(phase = AFTER_COMMIT)` silently drops all audit events because `fallbackExecution` is false and no active transaction synchronization exists. Additionally, exceptions cause un-rolled-back partial mutations.
2. **Actionable Remediation**:
   - In `AdminService.java`, add `@Transactional` (or `@Transactional(readOnly = true)`) to:
     - `demoteToEmployee(Long userId)` -> `@Transactional`
     - `toggleUserStatus(Long userId)` -> `@Transactional`
     - `approveEmployee(Long id)` -> `@Transactional`
     - `rejectEmployee(Long id)` -> `@Transactional`
     - `createLearner(RegisterRequest request)` -> `@Transactional`
     - Read-only query methods (`getAllEmployees`, `getPendingEmployees`, `getAssignedEmployees`, `getUnassignedEmployees`, `getEmployeeWorkloads`, `getAdminDashboard`, `getClientStats`, `getAllLearners`) -> `@Transactional(readOnly = true)`
   - In `TaskService.java`, no changes are required as all methods (including `requestTask`) already have `@Transactional`.

---

## 5. Verification Method

### How to Independently Verify:
1. **Code Inspection**:
   - Open `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/admin/service/AdminService.java` and confirm lines 100, 112, 129, 150, 209 lack `@Transactional`.
   - Open `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/crm/service/TaskService.java` and confirm line 232 already has `@Transactional`.
2. **Automated Testing**:
   - Add integration tests in `AdminServiceTest.java` / `AdminServiceIntegrationTests.java` asserting:
     - Calling `demoteToEmployee`, `toggleUserStatus`, `approveEmployee`, `rejectEmployee`, `createLearner` creates an active transaction.
     - An exception midway triggers a full transaction rollback.
     - Audit logs are successfully persisted on commit.
   - Run: `./gradlew test --tests "com.example.zhanfinancebackend.modules.admin.*"`
