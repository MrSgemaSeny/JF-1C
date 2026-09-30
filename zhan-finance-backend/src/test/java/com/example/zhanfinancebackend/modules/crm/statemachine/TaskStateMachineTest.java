package com.example.zhanfinancebackend.modules.crm.statemachine;

import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.crm.entity.Pipeline;
import com.example.zhanfinancebackend.modules.crm.entity.Stage;
import com.example.zhanfinancebackend.modules.crm.entity.StageType;
import com.example.zhanfinancebackend.modules.crm.entity.Task;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class TaskStateMachineTest {

    private TaskStateMachine stateMachine;

    private Pipeline pipeline1;
    private Pipeline pipeline2;

    private Stage openStage;
    private Stage inProgressStage;
    private Stage preFinalStage;
    private Stage wonStage;
    private Stage lostStage;
    private Stage foreignPipelineStage;

    private User admin;
    private User advisor;
    private User employee1;
    private User employee2;
    private User client1;
    private User client2;
    private User learner;

    private Task task;

    @BeforeEach
    void setUp() {
        stateMachine = new TaskStateMachine();

        pipeline1 = new Pipeline();
        pipeline1.setId(1L);
        pipeline1.setName("Main Pipeline");

        pipeline2 = new Pipeline();
        pipeline2.setId(2L);
        pipeline2.setName("Other Pipeline");

        openStage = createStage(10L, pipeline1, "Новый", StageType.OPEN, false, true);
        inProgressStage = createStage(11L, pipeline1, "В работе", StageType.OPEN, false, false);
        preFinalStage = createStage(12L, pipeline1, "На проверке", StageType.OPEN, true, false);
        wonStage = createStage(13L, pipeline1, "Успешно завершено", StageType.WON, false, false);
        lostStage = createStage(14L, pipeline1, "Отменен", StageType.LOST, false, false);

        foreignPipelineStage = createStage(20L, pipeline2, "Другой этап", StageType.OPEN, false, false);

        admin = createUser(1L, Role.ADMIN);
        advisor = createUser(2L, Role.ADVISOR);
        employee1 = createUser(3L, Role.EMPLOYEE);
        employee2 = createUser(4L, Role.EMPLOYEE);

        client1 = createUser(5L, Role.CLIENT);
        client1.setAssignedEmployee(employee1);

        client2 = createUser(6L, Role.CLIENT);
        client2.setAssignedEmployee(employee2);

        learner = createUser(7L, Role.LEARNER);

        task = new Task();
        task.setId(100L);
        task.setStage(openStage);
        task.setClient(client1);
        task.setAssignedTo(employee1);
    }

    private Stage createStage(Long id, Pipeline pipeline, String name, StageType type, boolean isPreFinal, boolean isDefault) {
        Stage s = new Stage();
        s.setId(id);
        s.setPipeline(pipeline);
        s.setName(name);
        s.setType(type);
        s.setPreFinal(isPreFinal);
        s.setDefault(isDefault);
        return s;
    }

    private User createUser(Long id, Role role) {
        User u = new User();
        u.setId(id);
        u.setRole(role);
        return u;
    }

    @Test
    @DisplayName("Null inputs are safely rejected")
    void testNullInputs() {
        assertFalse(stateMachine.canTransition(null, task, inProgressStage));
        assertFalse(stateMachine.canTransition(admin, null, inProgressStage));
        assertFalse(stateMachine.canTransition(admin, task, null));

        assertThrows(AccessDeniedException.class, () -> stateMachine.assertCanTransition(null, task, inProgressStage));
        assertThrows(AccessDeniedException.class, () -> stateMachine.assertCanTransition(admin, null, inProgressStage));
        assertThrows(AccessDeniedException.class, () -> stateMachine.assertCanTransition(admin, task, null));
    }

    @Test
    @DisplayName("Same stage transition is idempotent and allowed")
    void testSameStageIdempotent() {
        assertTrue(stateMachine.canTransition(employee1, task, openStage));
        assertTrue(stateMachine.canTransition(client1, task, openStage));
    }

    @Test
    @DisplayName("Cross-pipeline transition is rejected")
    void testCrossPipelineRejected() {
        TaskTransitionResult result = stateMachine.evaluateTransition(admin, task, foreignPipelineStage);
        assertFalse(result.allowed());
        assertTrue(result.message().contains("Cannot move task across different pipelines"));
        assertThrows(AccessDeniedException.class, () -> stateMachine.assertCanTransition(admin, task, foreignPipelineStage));
    }

    @Test
    @DisplayName("Non-admins cannot move task out of final stages (WON or LOST)")
    void testFinalStagesImmutabilityForNonAdmins() {
        task.setStage(wonStage);

        assertTrue(stateMachine.canTransition(admin, task, openStage));
        assertTrue(stateMachine.canTransition(advisor, task, openStage));
        assertFalse(stateMachine.canTransition(employee1, task, openStage));
        assertFalse(stateMachine.canTransition(client1, task, openStage));

        task.setStage(lostStage);
        assertTrue(stateMachine.canTransition(admin, task, inProgressStage));
        assertTrue(stateMachine.canTransition(advisor, task, inProgressStage));
        assertFalse(stateMachine.canTransition(employee1, task, inProgressStage));
        assertFalse(stateMachine.canTransition(client1, task, inProgressStage));
    }

    @Test
    @DisplayName("ADMIN has full transition permissions within pipeline")
    void testAdminFullPermissions() {
        assertTrue(stateMachine.canTransition(admin, task, inProgressStage));
        assertTrue(stateMachine.canTransition(admin, task, preFinalStage));
        assertTrue(stateMachine.canTransition(admin, task, wonStage));
        assertTrue(stateMachine.canTransition(admin, task, lostStage));
    }

    @Test
    @DisplayName("ADVISOR has supervisor transition permissions within pipeline")
    void testAdvisorPermissions() {
        assertTrue(stateMachine.canTransition(advisor, task, inProgressStage));
        assertTrue(stateMachine.canTransition(advisor, task, preFinalStage));
        assertTrue(stateMachine.canTransition(advisor, task, wonStage));
        assertTrue(stateMachine.canTransition(advisor, task, lostStage));
    }

    @Test
    @DisplayName("EMPLOYEE can transition between OPEN stages including pre-final")
    void testEmployeeTransitionsBetweenOpenStages() {
        // OPEN -> IN_PROGRESS
        assertTrue(stateMachine.canTransition(employee1, task, inProgressStage));

        // IN_PROGRESS -> PRE_FINAL
        task.setStage(inProgressStage);
        assertTrue(stateMachine.canTransition(employee1, task, preFinalStage));

        // PRE_FINAL -> IN_PROGRESS (rework)
        task.setStage(preFinalStage);
        assertTrue(stateMachine.canTransition(employee1, task, inProgressStage));
    }

    @Test
    @DisplayName("EMPLOYEE cannot directly transition to WON or LOST")
    void testEmployeeCannotDirectlyCloseWonOrLost() {
        assertFalse(stateMachine.canTransition(employee1, task, wonStage));
        assertFalse(stateMachine.canTransition(employee1, task, lostStage));

        task.setStage(preFinalStage);
        assertFalse(stateMachine.canTransition(employee1, task, wonStage));
        assertFalse(stateMachine.canTransition(employee1, task, lostStage));
    }

    @Test
    @DisplayName("EMPLOYEE not assigned to task or client cannot transition")
    void testUnassignedEmployeeRejected() {
        assertFalse(stateMachine.canTransition(employee2, task, inProgressStage));
    }

    @Test
    @DisplayName("EMPLOYEE assigned via client can transition even if task.assignedTo is null")
    void testEmployeeAssignedViaClient() {
        task.setAssignedTo(null);
        assertTrue(stateMachine.canTransition(employee1, task, inProgressStage));
        assertFalse(stateMachine.canTransition(employee2, task, inProgressStage));
    }

    @Test
    @DisplayName("CLIENT cannot modify another client's task")
    void testForeignClientRejected() {
        assertFalse(stateMachine.canTransition(client2, task, inProgressStage));
        assertFalse(stateMachine.canTransition(client2, task, lostStage));
    }

    @Test
    @DisplayName("CLIENT can cancel task to LOST from any open stage")
    void testClientCanCancelToLost() {
        assertTrue(stateMachine.canTransition(client1, task, lostStage));

        task.setStage(inProgressStage);
        assertTrue(stateMachine.canTransition(client1, task, lostStage));

        task.setStage(preFinalStage);
        assertTrue(stateMachine.canTransition(client1, task, lostStage));
    }

    @Test
    @DisplayName("CLIENT cannot move task between intermediate stages when not in pre-final")
    void testClientCannotMoveBetweenIntermediateStages() {
        assertFalse(stateMachine.canTransition(client1, task, inProgressStage));
        assertFalse(stateMachine.canTransition(client1, task, wonStage));
    }

    @Test
    @DisplayName("CLIENT can approve (WON) or request rework (OPEN) when in pre-final stage")
    void testClientPreFinalActions() {
        task.setStage(preFinalStage);

        // Approve
        assertTrue(stateMachine.canTransition(client1, task, wonStage));

        // Request rework / send back to open
        assertTrue(stateMachine.canTransition(client1, task, openStage));
        assertTrue(stateMachine.canTransition(client1, task, inProgressStage));
    }

    @Test
    @DisplayName("Non-CRM roles like LEARNER are rejected")
    void testUnauthorizedRoles() {
        assertFalse(stateMachine.canTransition(learner, task, inProgressStage));
    }

    @Test
    @DisplayName("getAllowedNextStages filters properly for EMPLOYEE and CLIENT")
    void testGetAllowedNextStages() {
        List<Stage> allStages = List.of(openStage, inProgressStage, preFinalStage, wonStage, lostStage);

        // Employee on OPEN task: can move to other OPEN stages, but not WON/LOST
        List<Stage> employeeAllowed = stateMachine.getAllowedNextStages(employee1, task, allStages);
        assertTrue(employeeAllowed.contains(inProgressStage));
        assertTrue(employeeAllowed.contains(preFinalStage));
        assertFalse(employeeAllowed.contains(wonStage));
        assertFalse(employeeAllowed.contains(lostStage));

        // Client on preFinal stage: can move to WON, LOST, or OPEN stages
        task.setStage(preFinalStage);
        List<Stage> clientAllowed = stateMachine.getAllowedNextStages(client1, task, allStages);
        assertTrue(clientAllowed.contains(wonStage));
        assertTrue(clientAllowed.contains(lostStage));
        assertTrue(clientAllowed.contains(openStage));
        assertTrue(clientAllowed.contains(inProgressStage));
    }
}
