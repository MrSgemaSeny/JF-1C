# Handoff Report: C5 Investigation (Missing @Transactional on Mutation Methods)

## 1. Observation

### 1.1 Affected Files and Methods Observed

1. TaskService.java
   - Path: zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/crm/service/TaskService.java
   - Line 232: @Transactional is present on public TaskDto requestTask(TaskRequestCreateRequest request, User actor).
   - Inspection of all other mutation methods in TaskService.java (createTask, updateTaskDetails, updateTaskStage, rchiveTask, ssignTask, unassignTask, equestReassignment, pproveReassignment, ejectReassignment, atchUpdateTasks, ddComment, deleteTask, 	oggleTaskUserLabel) confirmed that @Transactional is already applied to every public mutation method in TaskService.

2. AdminService.java
   - Path: zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/admin/service/AdminService.java
   - Line 71: @org.springframework.transaction.annotation.Transactional is present on promoteToAdvisor(Long userId).
   - Line 100: demoteToEmployee(Long userId) lacks @Transactional.
     - Calls userRepository.save(user) (UPDATE users), efreshTokenService.revokeAll(user) (DELETE FROM efresh_tokens), and uditService.logAction(...).
   - Line 112: 	oggleUserStatus(Long userId) lacks @Transactional.
     - Calls userRepository.save(user), conditionally efreshTokenService.revokeAll(user), and uditService.logAction(...).
   - Line 129: pproveEmployee(Long id) lacks @Transactional.
     - Calls userRepository.save(user), emailNotificationService.sendAccountApprovedEmail(user), 
otificationService.createNotification(...).
   - Line 150: ejectEmployee(Long id) lacks @Transactional.
     - Calls userRepository.save(user).
   - Line 209: createLearner(RegisterRequest request) lacks @Transactional.
     - Calls userRepository.save(user).

3. AuditService.java
   - Path: zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/audit/service/AuditService.java
   - Lines 35-48:
     @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
     @Transactional(propagation = Propagation.REQUIRES_NEW)
     public void handleAuditEvent(AuditEvent event)
   - Spring Transactional Event Listeners configured with AFTER_COMMIT ignore events published when no transaction is active.

4. Existing Test Files
   - zhan-finance-backend/src/test/java/com/example/zhanfinancebackend/modules/admin/service/AdminServiceTest.java: Only 4 tests (	estApproveEmployee, 	estApproveEmployee_InvalidRole, 	estGetEmployeeWorkloads, 	estRejectEmployee). Missing tests for demoteToEmployee, 	oggleUserStatus, createLearner, promoteToAdvisor, and missing transactional verification.
   - zhan-finance-backend/src/test/java/com/example/zhanfinancebackend/modules/crm/service/TaskServiceIntegrationTests.java: Integration tests present for end-to-end task lifecycle, but lacks direct unit/reflection assertion of @Transactional on equestTask.

---

## 2. Logic Chain

1. **Premise 1**: Spring's @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT) only fires after the successful commit of an active Spring transaction. If an event is published outside a transaction, Spring's default behavior is to discard the event without error (allbackExecution = false).
2. **Observation 1**: AdminService.demoteToEmployee and AdminService.toggleUserStatus call uditService.logAction(...), which publishes an AuditEvent.
3. **Inference 1**: Because demoteToEmployee and 	oggleUserStatus lack @Transactional, the published AuditEvent is silently dropped by the AFTER_COMMIT listener, resulting in lost audit logs.
4. **Premise 2**: Multi-table operations (users + efresh_tokens, users + 
otifications) without @Transactional execute in auto-commit mode per statement.
5. **Observation 2**: demoteToEmployee, 	oggleUserStatus, and pproveEmployee perform multiple database mutations sequentially.
6. **Inference 2**: If an unexpected exception occurs during the secondary operation (e.g. during token revocation or notification creation), the first operation (userRepository.save) cannot be rolled back, leaving the database in an inconsistent state.
7. **Observation 3**: TaskService.requestTask already has @Transactional applied at line 232.
8. **Inference 3**: For TaskService.requestTask, remediation only requires adding/verifying explicit regression tests confirming @Transactional presence and rollback behavior. For AdminService, @Transactional must be added to all 5 missing methods, accompanied by comprehensive regression tests.

---

## 3. Caveats

1. **TaskService.requestTask**: While the audit report listed TaskService.requestTask as missing @Transactional, source code inspection shows it was already annotated with @Transactional in commit 587d092fc1e95203b25949c5f34844203fbb54a8. We must still provide regression tests to prevent accidental removal.
2. **Transaction Propagation**: All 5 methods in AdminService should use standard @Transactional (Propagation.REQUIRED). None of these methods are invoked within conflicting transaction propagation scopes.
3. **Asynchronous Audit Handling**: AuditService.handleAuditEvent uses @Async(auditExecutor) and @Transactional(propagation = Propagation.REQUIRES_NEW). Unit tests on service classes with mocked AuditService test the invocation of uditService.logAction, whereas integration tests verify end-to-end database writes.

---

## 4. Conclusion & Proposed Implementation

### 4.1 Target Changes in AdminService.java

Add import org.springframework.transaction.annotation.Transactional; and annotate the 5 methods:

`diff
--- a/zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/admin/service/AdminService.java
+++ b/zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/admin/service/AdminService.java
@@ -11,6 +11,7 @@ import com.example.zhanfinancebackend.modules.crm.repository.ClientProfileRepository;
 import com.example.zhanfinancebackend.modules.crm.repository.TaskRepository;
 import org.springframework.stereotype.Service;
+import org.springframework.transaction.annotation.Transactional;
 
 import java.time.ZoneOffset;
 import java.util.List;
@@ -71,7 +72,7 @@ public class AdminService {
-    @org.springframework.transaction.annotation.Transactional
+    @Transactional
     public void promoteToAdvisor(Long userId) {
 
+    @Transactional
     public void demoteToEmployee(Long userId) {
         User user = userRepository.findById(userId)
 
+    @Transactional
     public void toggleUserStatus(Long userId) {
         User user = userRepository.findById(userId)
 
+    @Transactional
     public void approveEmployee(Long id) {
         User user = userRepository.findById(id)
 
+    @Transactional
     public void rejectEmployee(Long id) {
         User user = userRepository.findById(id)
 
+    @Transactional
     public void createLearner(RegisterRequest request) {
`

---

### 4.2 Formulated Regression Test Cases

#### File 1: zhan-finance-backend/src/test/java/com/example/zhanfinancebackend/modules/admin/service/AdminServiceTest.java

Add the following comprehensive test methods to AdminServiceTest:

`java
    @Test
    @org.junit.jupiter.api.DisplayName(All mutation methods in AdminService must have @Transactional annotation)
    void testMutationMethodsHaveTransactionalAnnotation() throws Exception {
        java.lang.reflect.Method promote = AdminService.class.getMethod(promoteToAdvisor, Long.class);
        java.lang.reflect.Method demote = AdminService.class.getMethod(demoteToEmployee, Long.class);
        java.lang.reflect.Method toggle = AdminService.class.getMethod(toggleUserStatus, Long.class);
        java.lang.reflect.Method approve = AdminService.class.getMethod(approveEmployee, Long.class);
        java.lang.reflect.Method reject = AdminService.class.getMethod(rejectEmployee, Long.class);
        java.lang.reflect.Method createLearner = AdminService.class.getMethod(createLearner, RegisterRequest.class);

        assertTrue(promote.isAnnotationPresent(org.springframework.transaction.annotation.Transactional.class),
                promoteToAdvisor must be annotated with @Transactional);
        assertTrue(demote.isAnnotationPresent(org.springframework.transaction.annotation.Transactional.class),
                demoteToEmployee must be annotated with @Transactional);
        assertTrue(toggle.isAnnotationPresent(org.springframework.transaction.annotation.Transactional.class),
                toggleUserStatus must be annotated with @Transactional);
        assertTrue(approve.isAnnotationPresent(org.springframework.transaction.annotation.Transactional.class),
                approveEmployee must be annotated with @Transactional);
        assertTrue(reject.isAnnotationPresent(org.springframework.transaction.annotation.Transactional.class),
                rejectEmployee must be annotated with @Transactional);
        assertTrue(createLearner.isAnnotationPresent(org.springframework.transaction.annotation.Transactional.class),
                createLearner must be annotated with @Transactional);
    }

    @Test
    @org.junit.jupiter.api.DisplayName(demoteToEmployee() updates role to EMPLOYEE, revokes tokens, and logs audit action)
    void testDemoteToEmployee_Success() {
        User advisor = new User();
        advisor.setId(2L);
        advisor.setEmail(advisor@example.com);
        advisor.setRole(Role.ADVISOR);

        when(userRepository.findById(2L)).thenReturn(Optional.of(advisor));

        adminService.demoteToEmployee(2L);

        assertEquals(Role.EMPLOYEE, advisor.getRole());
        verify(userRepository).save(advisor);
        verify(refreshTokenService).revokeAll(advisor);
        verify(auditService).logAction(eq(DEMOTE_TO_EMPLOYEE), eq(User), eq(2L), contains(demoted to EMPLOYEE));
    }

    @Test
    @org.junit.jupiter.api.DisplayName(demoteToEmployee() throws exception when user is not an ADVISOR)
    void testDemoteToEmployee_InvalidRole() {
        User employee = new User();
        employee.setId(2L);
        employee.setRole(Role.EMPLOYEE);

        when(userRepository.findById(2L)).thenReturn(Optional.of(employee));

        ApiException ex = assertThrows(ApiException.class, () -> adminService.demoteToEmployee(2L));
        assertEquals(Only ADVISORs can be demoted to EMPLOYEE, ex.getMessage());
        verify(userRepository, never()).save(any());
        verify(refreshTokenService, never()).revokeAll(any());
    }

    @Test
    @org.junit.jupiter.api.DisplayName(toggleUserStatus() disables enabled user, revokes tokens, and logs audit action)
    void testToggleUserStatus_DisableUser() {
        User activeUser = new User();
        activeUser.setId(3L);
        activeUser.setEmail(active@example.com);
        activeUser.setEnabled(true);

        when(userRepository.findById(3L)).thenReturn(Optional.of(activeUser));

        adminService.toggleUserStatus(3L);

        assertFalse(activeUser.isEnabled());
        verify(userRepository).save(activeUser);
        verify(refreshTokenService).revokeAll(activeUser);
        verify(auditService).logAction(eq(TOGGLE_USER_STATUS), eq(User), eq(3L), contains(status toggled to false));
    }

    @Test
    @org.junit.jupiter.api.DisplayName(toggleUserStatus() enables disabled user without revoking tokens)
    void testToggleUserStatus_EnableUser() {
        User disabledUser = new User();
        disabledUser.setId(4L);
        disabledUser.setEmail(disabled@example.com);
        disabledUser.setEnabled(false);

        when(userRepository.findById(4L)).thenReturn(Optional.of(disabledUser));

        adminService.toggleUserStatus(4L);

        assertTrue(disabledUser.isEnabled());
        verify(userRepository).save(disabledUser);
        verify(refreshTokenService, never()).revokeAll(any());
        verify(auditService).logAction(eq(TOGGLE_USER_STATUS), eq(User), eq(4L), contains(status toggled to true));
    }

    @Test
    @org.junit.jupiter.api.DisplayName(createLearner() creates and saves new LEARNER user)
    void testCreateLearner_Success() {
        RegisterRequest request = new RegisterRequest(Learner Name, learner@example.com, secret123);
        when(userRepository.existsByEmailIgnoreCase(learner@example.com)).thenReturn(false);
        when(passwordEncoder.encode(secret123)).thenReturn(encodedSecret);

        adminService.createLearner(request);

        org.mockito.ArgumentCaptor<User> captor = org.mockito.ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertEquals(Learner Name, saved.getFullName());
        assertEquals(learner@example.com, saved.getEmail());
        assertEquals(encodedSecret, saved.getPassword());
        assertEquals(Role.LEARNER, saved.getRole());
        assertTrue(saved.isEnabled());
    }

    @Test
    @org.junit.jupiter.api.DisplayName(createLearner() throws exception on duplicate email)
    void testCreateLearner_DuplicateEmail() {
        RegisterRequest request = new RegisterRequest(Learner Name, existing@example.com, secret123);
        when(userRepository.existsByEmailIgnoreCase(existing@example.com)).thenReturn(true);

        ApiException ex = assertThrows(ApiException.class, () -> adminService.createLearner(request));
        assertEquals(Email уже используется, ex.getMessage());
        verify(userRepository, never()).save(any());
    }
`

#### File 2: zhan-finance-backend/src/test/java/com/example/zhanfinancebackend/modules/crm/service/TaskServiceTransactionalTest.java (or in TaskServiceIntegrationTests.java)

`java
package com.example.zhanfinancebackend.modules.crm.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertTrue;

class TaskServiceTransactionalTest {

    @Test
    @DisplayName(TaskService.requestTask must have @Transactional annotation)
    void testRequestTaskHasTransactionalAnnotation() throws Exception {
        Method method = TaskService.class.getMethod(requestTask,
                com.example.zhanfinancebackend.modules.crm.dto.TaskRequestCreateRequest.class,
                com.example.zhanfinancebackend.modules.auth.entity.User.class);

        assertTrue(method.isAnnotationPresent(Transactional.class),
                TaskService.requestTask must be annotated with @Transactional);
    }
}
`

---

## 5. Verification Method

To independently verify the investigation and test design:
1. **Source Inspection**:
   - AdminService.java: lines 71, 100, 112, 129, 150, 209
   - TaskService.java: line 232
   - AuditService.java: lines 35-48
2. **Execute Test Runner**:
   `ash
   cd zhan-finance-backend
   ./gradlew test --tests com.example.zhanfinancebackend.modules.admin.service.AdminServiceTest --no-daemon
   `
3. **Invalidation Conditions**:
   - If any mutation method in AdminService is modified without @Transactional.
   - If AuditService event listener configuration changes its transaction phase or fallback execution behavior.
