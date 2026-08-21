# C5 Investigation Analysis: Missing @Transactional on Multi-Table Mutations

## 1. Executive Summary

This investigation analyzed the transactional boundaries across `TaskService.java` and `AdminService.java` in `zhan-finance-backend`, specifically evaluating the 6 methods identified in finding C5 of the pre-release audit:
1. `TaskService.requestTask`
2. `AdminService.demoteEmployee` (named `demoteToEmployee` in source)
3. `AdminService.toggleUserStatus`
4. `AdminService.approveRegistration` (named `approveEmployee` in source)
5. `AdminService.rejectRegistration` (named `rejectEmployee` in source)
6. `AdminService.createLearner`

### Core Finding
- In `AdminService.java`, class-level `@Transactional` is ABSENT. 5 out of 6 mutation methods (`demoteToEmployee`, `toggleUserStatus`, `approveEmployee`, `rejectEmployee`, `createLearner`) completely lack `@Transactional`. Only `promoteToAdvisor` has `@Transactional`.
- Because `AuditService.java` processes audit events via `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)`, any method publishing audit events outside of an active Spring transaction silently drops audit log entries without throwing an exception.
- In `TaskService.java`, `@Transactional` is ALREADY PRESENT on `requestTask` (line 232), as well as on all other write methods in `TaskService`.

---

## 2. Deep Dive: Audit Logging Mechanism & Transaction Dependence

### File: `src/main/java/com/example/zhanfinancebackend/modules/audit/service/AuditService.java`
Lines 35-48:
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

### Impact of Missing `@Transactional` on Caller
- `AuditService.logAction(...)` calls `ApplicationEventPublisher.publishEvent(new AuditEvent(...))`.
- Spring's `@TransactionalEventListener` with `phase = TransactionPhase.AFTER_COMMIT` only executes if there is an active transaction that successfully commits.
- When a caller method lacks `@Transactional`, Spring detects no transaction synchronization context. By default (`fallbackExecution = false`), Spring simply drops the event.
- Result: Silent data loss in the audit log trail (`audit_logs` table) for `demoteToEmployee` and `toggleUserStatus`.
- Furthermore, without a transaction boundary, individual database mutations (e.g. user update followed by token revocation or notification generation) run in auto-commit mode, preventing rollback if any step fails.

---

## 3. Detailed Method Inspection

### Method 1: `TaskService.requestTask`
- **File**: `src/main/java/com/example/zhanfinancebackend/modules/crm/service/TaskService.java`
- **Lines**: 231-294
- **Method Signature**: `public TaskDto requestTask(TaskRequestCreateRequest request, User actor)`
- **Class-Level Annotations**: `@Service` (line 55). No class-level `@Transactional`.
- **Method-Level Annotations**:
  - `@CacheEvict(value = {"dashboard_admin", "dashboard_employee", "dashboard_client"}, allEntries = true)` (line 231)
  - `@Transactional` (line 232)
- **DB Mutations & Downstream Calls**:
  1. `userRepository.findById(targetClientId)` (read)
  2. `pipelineRepository.findByIsDefaultTrue()` (read)
  3. `stageRepository.findByPipelineIdAndIsDefaultTrue(...)` (read)
  4. `taskRepository.save(task)` (write to `tasks`, cascaded `subtasks`, `task_services`)
  5. `auditService.logAction("CREATE", "Task", savedTask.getId(), ...)` (publishes `AuditEvent`)
  6. `notificationService.notifyAdmins(...)` -> `notificationRepository.save(notification)` (write to `notifications`)
  7. `notificationService.createNotification(employee, ...)` -> `notificationRepository.save(notification)` (write to `notifications`)
  8. `emailNotificationService.sendTaskAssignedEmail(employee, savedTask)`
- **Evaluation**:
  - `@Transactional` is already in place.
  - Multi-table mutations (`tasks`, `notifications`, `audit_logs` via event) participate in transaction management.

---

### Method 2: `AdminService.demoteToEmployee` (audit finding: `demoteEmployee`)
- **File**: `src/main/java/com/example/zhanfinancebackend/modules/admin/service/AdminService.java`
- **Lines**: 100-110
- **Method Signature**: `public void demoteToEmployee(Long userId)`
- **Class-Level Annotations**: `@Service` (line 29). No class-level `@Transactional`.
- **Method-Level Annotations**: NONE.
- **Code**:
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
- **DB Mutations & Downstream Calls**:
  1. `userRepository.save(user)` (updates `users.role` to `EMPLOYEE`)
  2. `refreshTokenService.revokeAll(user)` (deletes from `refresh_tokens`)
  3. `auditService.logAction("DEMOTE_TO_EMPLOYEE", ...)` (publishes `AuditEvent`)
- **Vulnerabilities**:
  - Missing `@Transactional`.
  - Audit event is dropped because no transaction commits.
  - If `refreshTokenService.revokeAll` fails, `userRepository.save(user)` is already committed (inconsistent state).
- **Required Action**: Add `@Transactional` to `demoteToEmployee`.

---

### Method 3: `AdminService.toggleUserStatus`
- **File**: `src/main/java/com/example/zhanfinancebackend/modules/admin/service/AdminService.java`
- **Lines**: 112-121
- **Method Signature**: `public void toggleUserStatus(Long userId)`
- **Class-Level Annotations**: `@Service` (line 29). No class-level `@Transactional`.
- **Method-Level Annotations**: NONE.
- **Code**:
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
- **DB Mutations & Downstream Calls**:
  1. `userRepository.save(user)` (updates `users.enabled`)
  2. `refreshTokenService.revokeAll(user)` (deletes from `refresh_tokens` when user is disabled)
  3. `auditService.logAction("TOGGLE_USER_STATUS", ...)` (publishes `AuditEvent`)
- **Vulnerabilities**:
  - Missing `@Transactional`.
  - Audit event is silently lost.
  - Non-atomic user disable and session revocation.
- **Required Action**: Add `@Transactional` to `toggleUserStatus`.

---

### Method 4: `AdminService.approveEmployee` (audit finding: `approveRegistration`)
- **File**: `src/main/java/com/example/zhanfinancebackend/modules/admin/service/AdminService.java`
- **Lines**: 129-148
- **Method Signature**: `public void approveEmployee(Long id)`
- **Class-Level Annotations**: `@Service` (line 29). No class-level `@Transactional`.
- **Method-Level Annotations**: NONE.
- **Code**:
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
- **DB Mutations & Downstream Calls**:
  1. `userRepository.save(user)` (updates `users.enabled = true`, `users.registration_status = APPROVED`)
  2. `emailNotificationService.sendAccountApprovedEmail(user)` (email dispatch)
  3. `notificationService.createNotification(user, ...)` -> `notificationRepository.save(notification)` (writes to `notifications`)
- **Vulnerabilities**:
  - Missing `@Transactional`.
  - If notification persistence fails, user status change is not rolled back.
- **Required Action**: Add `@Transactional` to `approveEmployee`.

---

### Method 5: `AdminService.rejectEmployee` (audit finding: `rejectRegistration`)
- **File**: `src/main/java/com/example/zhanfinancebackend/modules/admin/service/AdminService.java`
- **Lines**: 150-162
- **Method Signature**: `public void rejectEmployee(Long id)`
- **Class-Level Annotations**: `@Service` (line 29). No class-level `@Transactional`.
- **Method-Level Annotations**: NONE.
- **Code**:
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
- **DB Mutations & Downstream Calls**:
  1. `userRepository.save(user)` (updates `users.enabled = false`, `users.registration_status = REJECTED`)
- **Vulnerabilities**:
  - Missing `@Transactional`.
- **Required Action**: Add `@Transactional` to `rejectEmployee`.

---

### Method 6: `AdminService.createLearner`
- **File**: `src/main/java/com/example/zhanfinancebackend/modules/admin/service/AdminService.java`
- **Lines**: 209-222
- **Method Signature**: `public void createLearner(RegisterRequest request)`
- **Class-Level Annotations**: `@Service` (line 29). No class-level `@Transactional`.
- **Method-Level Annotations**: NONE.
- **Code**:
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
- **DB Mutations & Downstream Calls**:
  1. `userRepository.existsByEmailIgnoreCase(request.email())` (read)
  2. `userRepository.save(user)` (inserts new row in `users`)
- **Vulnerabilities**:
  - Missing `@Transactional`.
- **Required Action**: Add `@Transactional` to `createLearner`.

---

## 4. Comprehensive Method & Class Annotation Summary

| Class | Method | Class Annotation | Current Method Annotation | Missing Annotation? | Multi-Table / Event Mutation Details |
|---|---|---|---|---|---|
| `TaskService` | `requestTask` | `@Service` | `@CacheEvict(...)`, `@Transactional` | No (already present) | `tasks`, `subtasks`, `task_services`, `notifications`, `audit_logs` (via `AuditEvent`) |
| `AdminService` | `demoteToEmployee` | `@Service` | (none) | YES (`@Transactional`) | `users`, `refresh_tokens`, `audit_logs` (via `AuditEvent`) |
| `AdminService` | `toggleUserStatus` | `@Service` | (none) | YES (`@Transactional`) | `users`, `refresh_tokens`, `audit_logs` (via `AuditEvent`) |
| `AdminService` | `approveEmployee` | `@Service` | (none) | YES (`@Transactional`) | `users`, `notifications`, email notification |
| `AdminService` | `rejectEmployee` | `@Service` | (none) | YES (`@Transactional`) | `users` |
| `AdminService` | `createLearner` | `@Service` | (none) | YES (`@Transactional`) | `users` |
| `AdminService` | `promoteToAdvisor` | `@Service` | `@Transactional` | No | `users`, `tasks`, `refresh_tokens`, `audit_logs` |

---

## 5. Architectural Recommendation for Implementation

When Phase 2 remediation implements C5:
1. In `AdminService.java`:
   - Import `org.springframework.transaction.annotation.Transactional`.
   - Add `@Transactional` to `demoteToEmployee`, `toggleUserStatus`, `approveEmployee`, `rejectEmployee`, and `createLearner`.
   - (Or annotate class with `@Transactional(readOnly = true)` and write methods with `@Transactional`).
2. In `TaskService.java`:
   - Confirm `@Transactional` on `requestTask` remains intact.
3. Regression Test:
   - Add tests verifying that `@Transactional` is active on these methods and that audit events are triggered / rolled back appropriately on failure.
