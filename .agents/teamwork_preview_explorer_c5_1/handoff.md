# Handoff Report: C5 Investigation (Missing @Transactional on Multi-Table Mutations)

## 1. Observation

### Source Code Files Examined
1. `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/crm/service/TaskService.java`
2. `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/admin/service/AdminService.java`
3. `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/audit/service/AuditService.java`
4. `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/auth/service/RefreshTokenService.java`
5. `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/notifications/service/NotificationService.java`

### Direct Observations & Code Quotes

#### 1. AuditService Event Listener Mechanism
In `AuditService.java:35-48`:
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
Observation: `AuditService` listens for events with `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)`. By Spring default, if the publishing method is not in an active transaction, the event is silently ignored (`fallbackExecution = false`).

#### 2. `TaskService.java`
- Class annotation (line 55): `@Service`. No class-level `@Transactional`.
- Method `requestTask` (lines 231-233):
```java
@CacheEvict(value = {"dashboard_admin", "dashboard_employee", "dashboard_client"}, allEntries = true)
@Transactional
public TaskDto requestTask(TaskRequestCreateRequest request, User actor) {
```
Observation: `@Transactional` is ALREADY PRESENT on `TaskService.requestTask` at line 232. All other mutating methods in `TaskService.java` (`createTask`, `updateTaskDetails`, `updateTaskStage`, `archiveTask`, `assignTask`, `unassignTask`, `requestReassignment`, `approveReassignment`, `rejectReassignment`, `batchUpdateTasks`, `addComment`, `deleteTask`, `toggleTaskUserLabel`) also possess `@Transactional`.

#### 3. `AdminService.java`
- Class annotation (line 29): `@Service`. No class-level `@Transactional`.
- Method `promoteToAdvisor` (lines 71-72):
```java
@org.springframework.transaction.annotation.Transactional
public void promoteToAdvisor(Long userId) {
```
Observation: `promoteToAdvisor` has `@Transactional`.

- Method `demoteToEmployee` (lines 100-110):
```java
public void demoteToEmployee(Long userId) {
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "User not found"));
    if (user.getRole() != Role.ADVISOR) {
        throw new ApiException(ErrorCode.BAD_REQUEST, "Only ADVISORs can be demoted to EMPLOYEE");
    }
    user.setRole(Role.EMPLOYEE);
    userRepository.save(user);
    refreshTokenService.revokeAll(user);
    auditService.logAction("DEMOTE_TO_EMPLOYEE", "User", user.getId(), "User " + user.getEmail() + " demoted to EMPLOYEE");
}
```
Observation: No `@Transactional` annotation. Calls `userRepository.save`, `refreshTokenService.revokeAll`, and `auditService.logAction`.

- Method `toggleUserStatus` (lines 112-121):
```java
public void toggleUserStatus(Long userId) {
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "User not found"));
    user.setEnabled(!user.isEnabled());
    userRepository.save(user);
    if (!user.isEnabled()) {
        refreshTokenService.revokeAll(user);
    }
    auditService.logAction("TOGGLE_USER_STATUS", "User", user.getId(), "User " + user.getEmail() + " status toggled to " + user.isEnabled());
}
```
Observation: No `@Transactional` annotation. Calls `userRepository.save`, `refreshTokenService.revokeAll`, and `auditService.logAction`.

- Method `approveEmployee` (lines 129-148):
```java
public void approveEmployee(Long id) {
    User user = userRepository.findById(id)
            .orElseThrow(() -> new ApiException(
                    ErrorCode.NOT_FOUND, "User not found"));
    if (user.getRole() != Role.EMPLOYEE && user.getRole() != Role.ADMIN && user.getRole() != Role.CURATOR && user.getRole() != Role.ADVISOR) {
        throw new ApiException(
                ErrorCode.BAD_REQUEST,
                "Only staff accounts can be approved");
    }
    user.setEnabled(true);
    user.setRegistrationStatus(RegistrationStatus.APPROVED);
    userRepository.save(user);
    emailNotificationService.sendAccountApprovedEmail(user);
    notificationService.createNotification(
            user,
            "Аккаунт подтвержден",
            "Ваш аккаунт был успешно подтвержден администратором.",
            "/login"
    );
}
```
Observation: No `@Transactional` annotation. Performs user update and persists notification via `notificationService.createNotification`.

- Method `rejectEmployee` (lines 150-162):
```java
public void rejectEmployee(Long id) {
    User user = userRepository.findById(id)
            .orElseThrow(() -> new ApiException(
                    ErrorCode.NOT_FOUND, "User not found"));
    if (user.getRole() != Role.EMPLOYEE && user.getRole() != Role.ADMIN && user.getRole() != Role.CURATOR && user.getRole() != Role.ADVISOR) {
        throw new ApiException(
                ErrorCode.BAD_REQUEST,
                "Only staff accounts can be rejected");
    }
    user.setEnabled(false);
    user.setRegistrationStatus(RegistrationStatus.REJECTED);
    userRepository.save(user);
}
```
Observation: No `@Transactional` annotation.

- Method `createLearner` (lines 209-222):
```java
public void createLearner(RegisterRequest request) {
    if (userRepository.existsByEmailIgnoreCase(request.email())) {
        throw new ApiException(
                ErrorCode.BAD_REQUEST, "Email уже используется");
    }
    User user = new User(
            request.fullName(),
            request.email().toLowerCase(),
            passwordEncoder.encode(request.password()),
            Role.LEARNER
    );
    user.setEnabled(true);
    userRepository.save(user);
}
```
Observation: No `@Transactional` annotation.

---

## 2. Logic Chain

1. **Premise 1**: Spring's `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)` requires an active transaction context when the event is published via `ApplicationEventPublisher.publishEvent()`. If no transaction is active, the event is dropped.
2. **Premise 2**: In `AdminService.demoteToEmployee` and `AdminService.toggleUserStatus`, `auditService.logAction` is called without `@Transactional`. As a result of Premise 1, audit log records for demoting advisors and toggling user status are silently dropped.
3. **Premise 3**: In `AdminService.demoteToEmployee`, `AdminService.toggleUserStatus`, and `AdminService.approveEmployee`, multiple database write operations occur (e.g. updating `User`, revoking `RefreshToken` rows, writing `Notification` records). Without `@Transactional`, each operation executes in auto-commit mode. If a subsequent step throws an exception, preceding database mutations are committed and not rolled back.
4. **Premise 4**: In `AdminService.rejectEmployee` and `AdminService.createLearner`, write operations on `users` execute outside transaction boundaries, risking inconsistencies in concurrent access or future chained mutations.
5. **Premise 5**: In `TaskService.java`, line 232 already contains `@Transactional` on `requestTask`. All multi-table mutations within `requestTask` (`tasks`, `notifications`, `audit_logs` event) already run inside an active transaction.
6. **Conclusion**: The remediation for C5 requires adding `@Transactional` to the 5 non-annotated mutation methods in `AdminService.java` (`demoteToEmployee`, `toggleUserStatus`, `approveEmployee`, `rejectEmployee`, `createLearner`), and confirming `TaskService.requestTask` retains its existing `@Transactional` annotation.

---

## 3. Caveats

1. **Method Naming Discrepancies in Plan/Report**:
   - Audit report lists `demoteEmployee` -> Actual method in `AdminService.java:100` is `demoteToEmployee(Long userId)`.
   - Audit report lists `approveRegistration` / `rejectRegistration` -> Actual methods in `AdminService.java:129, 150` are `approveEmployee(Long id)` and `rejectEmployee(Long id)`.
2. **Email and External Services inside Transaction**:
   - `approveEmployee` calls `emailNotificationService.sendAccountApprovedEmail(user)` and `notificationService.createNotification(...)`. If email sending is synchronous and fails, the transaction will roll back. EmailNotificationService should remain resilient.
3. **Async / Event Listener Propagation**:
   - `AuditService.handleAuditEvent` uses `@Transactional(propagation = Propagation.REQUIRES_NEW)`. When caller methods in `AdminService` are annotated with `@Transactional`, audit events will successfully commit in an isolated transaction upon outer transaction commit.

---

## 4. Conclusion

- **Finding C5 Scope**:
  - `TaskService.requestTask`: Already has `@Transactional` (line 232). Verified compliant.
  - `AdminService.demoteToEmployee`: Needs `@Transactional` (currently missing).
  - `AdminService.toggleUserStatus`: Needs `@Transactional` (currently missing).
  - `AdminService.approveEmployee`: Needs `@Transactional` (currently missing).
  - `AdminService.rejectEmployee`: Needs `@Transactional` (currently missing).
  - `AdminService.createLearner`: Needs `@Transactional` (currently missing).
- **Required Code Fix for Phase 2**:
  - Add `import org.springframework.transaction.annotation.Transactional;` to `AdminService.java`.
  - Add `@Transactional` to `demoteToEmployee`, `toggleUserStatus`, `approveEmployee`, `rejectEmployee`, and `createLearner`.

---

## 5. Verification Method

To independently verify after implementation:
1. **Source Inspection**:
   - Inspect `AdminService.java` lines around `demoteToEmployee`, `toggleUserStatus`, `approveEmployee`, `rejectEmployee`, and `createLearner` to verify `@Transactional` presence.
2. **Automated Test Execution**:
   - Run backend unit and integration tests:
     ```powershell
     cd C:\Users\murat\IdeaProjects\JF-1C\zhan-finance-backend
     .\gradlew test --tests "com.example.zhanfinancebackend.modules.admin.service.AdminServiceTest"
     .\gradlew test --tests "com.example.zhanfinancebackend.modules.crm.service.TaskServiceIntegrationTests"
     ```
3. **Regression Tests**:
   - Verify that calling `demoteToEmployee` and `toggleUserStatus` in an integration test triggers `AuditService.handleAuditEvent` and writes a row to `audit_logs`.
   - Verify that simulated downstream exception in `approveEmployee` or `demoteToEmployee` triggers full rollback of `User` changes in DB.
