# C5 Technical Analysis: Missing @Transactional on Mutation Methods

## Executive Summary
Audit finding C5 identified multi-table mutations lacking @Transactional in TaskService and AdminService.
Our in-depth investigation of TaskService.java, AdminService.java, AuditService.java, and existing test suites reveals:
1. TaskService.requestTask ALREADY HAS @Transactional (line 232 in TaskService.java), having been annotated in earlier commits.
2. AdminService has 5 critical mutation methods MISSING @Transactional:
   - demoteToEmployee(Long userId)
   - 	oggleUserStatus(Long userId)
   - pproveEmployee(Long id)
   - ejectEmployee(Long id)
   - createLearner(RegisterRequest request)
   (Note: promoteToAdvisor(Long userId) already has @Transactional at line 71).
3. The root failure mode with missing @Transactional is twofold:
   - **Audit Trail Loss**: AuditService.handleAuditEvent uses @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT). When no Spring transaction is active, Spring skips the listener by default (allbackExecution = false), silently dropping the audit event without any error.
   - **Atomicity Violation**: Methods write to multiple tables (users, efresh_tokens, 
otifications). A failure during later stages leaves partial updates committed to the database.

---

## 1. Codebase Investigation Details

### 1.1 AuditService Interaction Mechanism
- File: src/main/java/com/example/zhanfinancebackend/modules/audit/service/AuditService.java
- Lines 35-48:
`java
@org.springframework.scheduling.annotation.Async(auditExecutor)
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
`
**Mechanism:** AuditService.logAction() publishes an AuditEvent through Spring's ApplicationEventPublisher. Because handleAuditEvent is annotated with @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT), Spring will ONLY execute this listener if the event was published inside an active transaction that successfully commits.
**Impact of Missing @Transactional:** When demoteToEmployee or 	oggleUserStatus is called without @Transactional, no transaction is active. Spring's event listener silently ignores the AuditEvent. As a result, critical administrative actions are never written to udit_logs.

---

### 1.2 Status of Target Methods

#### 1. TaskService.requestTask(TaskRequestCreateRequest request, User actor)
- File: src/main/java/com/example/zhanfinancebackend/modules/crm/service/TaskService.java
- Lines 231-233:
`java
@CacheEvict(value = {dashboard_admin, dashboard_employee, dashboard_client}, allEntries = true)
@Transactional
public TaskDto requestTask(TaskRequestCreateRequest request, User actor) {
`
- Status: @Transactional is present.
- Operations: Saves Task entity + Subtasks, sends notifications via 
otificationService and emailNotificationService, logs audit via uditService.logAction.

#### 2. AdminService.demoteToEmployee(Long userId)
- File: src/main/java/com/example/zhanfinancebackend/modules/admin/service/AdminService.java
- Lines 100-110:
`java
public void demoteToEmployee(Long userId) {
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, User not found));
    if (user.getRole() != Role.ADVISOR) {
        throw new ApiException(ErrorCode.BAD_REQUEST, Only ADVISORs can be demoted to EMPLOYEE);
    }
    user.setRole(Role.EMPLOYEE);
    userRepository.save(user);
    refreshTokenService.revokeAll(user);
    auditService.logAction(DEMOTE_TO_EMPLOYEE, User, user.getId(), User  + user.getEmail() +  demoted to EMPLOYEE);
}
`
- Status: MISSING @Transactional.
- Operations: Updates users table, deletes records from efresh_tokens table, publishes AuditEvent.

#### 3. AdminService.toggleUserStatus(Long userId)
- File: src/main/java/com/example/zhanfinancebackend/modules/admin/service/AdminService.java
- Lines 112-121:
`java
public void toggleUserStatus(Long userId) {
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, User not found));
    user.setEnabled(!user.isEnabled());
    userRepository.save(user);
    if (!user.isEnabled()) {
        refreshTokenService.revokeAll(user);
    }
    auditService.logAction(TOGGLE_USER_STATUS, User, user.getId(), User  + user.getEmail() +  status toggled to  + user.isEnabled());
}
`
- Status: MISSING @Transactional.
- Operations: Updates users table, conditionally deletes records from efresh_tokens table, publishes AuditEvent.

#### 4. AdminService.approveEmployee(Long id)
- File: src/main/java/com/example/zhanfinancebackend/modules/admin/service/AdminService.java
- Lines 129-148:
`java
public void approveEmployee(Long id) {
    User user = userRepository.findById(id)
            .orElseThrow(() -> new ApiException(
                    ErrorCode.NOT_FOUND, User not found));
    if (user.getRole() != Role.EMPLOYEE && user.getRole() != Role.ADMIN && user.getRole() != Role.CURATOR && user.getRole() != Role.ADVISOR) {
        throw new ApiException(
                ErrorCode.BAD_REQUEST,
                Only staff accounts can be approved);
    }
    user.setEnabled(true);
    user.setRegistrationStatus(RegistrationStatus.APPROVED);
    userRepository.save(user);
    emailNotificationService.sendAccountApprovedEmail(user);
    notificationService.createNotification(
            user,
            Аккаунт подтвержден,
            Ваш аккаунт был успешно подтвержден администратором.,
            /login
    );
}
`
- Status: MISSING @Transactional.
- Operations: Updates users table, creates record in 
otifications table, sends email notification.

#### 5. AdminService.rejectEmployee(Long id)
- File: src/main/java/com/example/zhanfinancebackend/modules/admin/service/AdminService.java
- Lines 150-162:
`java
public void rejectEmployee(Long id) {
    User user = userRepository.findById(id)
            .orElseThrow(() -> new ApiException(
                    ErrorCode.NOT_FOUND, User not found));
    if (user.getRole() != Role.EMPLOYEE && user.getRole() != Role.ADMIN && user.getRole() != Role.CURATOR && user.getRole() != Role.ADVISOR) {
        throw new ApiException(
                ErrorCode.BAD_REQUEST,
                Only staff accounts can be rejected);
    }
    user.setEnabled(false);
    user.setRegistrationStatus(RegistrationStatus.REJECTED);
    userRepository.save(user);
}
`
- Status: MISSING @Transactional.
- Operations: Updates users table (enabled = false, status = REJECTED).

#### 6. AdminService.createLearner(RegisterRequest request)
- File: src/main/java/com/example/zhanfinancebackend/modules/admin/service/AdminService.java
- Lines 209-222:
`java
public void createLearner(RegisterRequest request) {
    if (userRepository.existsByEmailIgnoreCase(request.email())) {
        throw new ApiException(
                ErrorCode.BAD_REQUEST, Email уже используется);
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
`
- Status: MISSING @Transactional.
- Operations: Validates email, creates and persists User entity in users table.

---

## 2. Existing Test Coverage Analysis

1. AdminServiceTest.java:
   - Contains 4 tests: 	estApproveEmployee, 	estApproveEmployee_InvalidRole, 	estGetEmployeeWorkloads, 	estRejectEmployee.
   - Completely lacks tests for promoteToAdvisor, demoteToEmployee, 	oggleUserStatus, createLearner.
   - Lacks verification that @Transactional is present on mutation methods.

2. TaskServiceIntegrationTests.java:
   - Contains end-to-end integration tests using MockMvc and Spring context.
   - Tests task workflows (	askWorkflow_ClientToCompletion, 	askWorkflow_ClientRejectFlow, 	askWorkflow_ReassignFlow).
   - Lacks dedicated test asserting @Transactional on equestTask.

---

## 3. Regression Test Strategy

We recommend a two-tiered test strategy:

### Tier 1: Unit Test Reflection & Mock Verification (AdminServiceTest & TaskServiceTest)
1. **Reflection Verification**:
   Inspect AdminService and TaskService methods to assert that org.springframework.transaction.annotation.Transactional is declared on all mutation methods.
2. **Behavioral Unit Tests**:
   - demoteToEmployee: tests role change, save, token revocation, and audit logging.
   - demoteToEmployee_InvalidRole: tests validation exception.
   - 	oggleUserStatus: tests enable/disable toggle, token revocation when disabled, and audit logging.
   - createLearner: tests learner creation and duplicate email rejection.

### Tier 2: Spring Context Integration Tests
1. **Rollback on Exception Verification**:
   - When an exception occurs during post-save processing (e.g. efreshTokenService.revokeAll or 
otificationService.createNotification), the Spring transaction rolls back userRepository.save changes.
2. **Audit Event Dispatch Verification**:
   - Verifies that AFTER_COMMIT listener receives the AuditEvent and creates an AuditLog row upon transaction commit.
