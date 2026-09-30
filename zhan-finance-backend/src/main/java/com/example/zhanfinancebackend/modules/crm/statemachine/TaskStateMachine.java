package com.example.zhanfinancebackend.modules.crm.statemachine;

import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.crm.entity.Pipeline;
import com.example.zhanfinancebackend.modules.crm.entity.Stage;
import com.example.zhanfinancebackend.modules.crm.entity.StageType;
import com.example.zhanfinancebackend.modules.crm.entity.Task;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

/**
 * Formal state machine governing Task stage transitions.
 * Enforces stage transition invariants and role-based permissions:
 * - ADMIN: full override within pipeline + reopen from final stages.
 * - ADVISOR: supervisor transitions within pipeline + reopen from final stages.
 * - EMPLOYEE: transitions between OPEN stages (including to pre-final review); cannot self-approve to WON or mark LOST.
 * - CLIENT: can cancel (LOST) at any time; can approve (WON) or return to rework (OPEN) when task is in pre-final stage.
 * - Non-admins cannot move tasks out of final stages (WON or LOST).
 * - Cross-pipeline transitions are rejected.
 */
@Component
public class TaskStateMachine {

    public TaskTransitionResult evaluateTransition(User actor, Task task, Stage targetStage) {
        if (actor == null) {
            return TaskTransitionResult.reject("Actor cannot be null");
        }
        if (task == null) {
            return TaskTransitionResult.reject("Task cannot be null");
        }
        if (targetStage == null) {
            return TaskTransitionResult.reject("Target stage cannot be null");
        }

        // Idempotent no-op transition to the exact same stage
        if (task.getStage() != null && task.getStage().getId() != null
                && task.getStage().getId().equals(targetStage.getId())) {
            return TaskTransitionResult.allow();
        }

        // Pipeline boundary validation
        Pipeline currentPipeline = task.getStage() != null ? task.getStage().getPipeline() : null;

        if (currentPipeline != null && targetStage.getPipeline() != null
                && currentPipeline.getId() != null && targetStage.getPipeline().getId() != null
                && !currentPipeline.getId().equals(targetStage.getPipeline().getId())) {
            return TaskTransitionResult.reject("Cannot move task across different pipelines (task pipeline "
                    + currentPipeline.getId() + " vs target pipeline " + targetStage.getPipeline().getId() + ")");
        }

        // Final stages (WON / LOST) immutability check
        if (task.getStage() != null && isFinalStage(task.getStage())) {
            if (actor.getRole() != Role.ADMIN && actor.getRole() != Role.ADVISOR) {
                return TaskTransitionResult.reject("Task is in final stage '" + task.getStage().getName()
                        + "' and cannot be transitioned by non-admin");
            }
        }

        // Role-based transition rules
        Role role = actor.getRole();
        if (role == Role.ADMIN || role == Role.ADVISOR) {
            return TaskTransitionResult.allow();
        }

        if (role == Role.EMPLOYEE) {
            boolean isAssigned = sameUser(actor, task.getAssignedTo());
            boolean isClientEmployee = assignedToEmployee(actor, task.getClient());
            if (!isAssigned && !isClientEmployee) {
                return TaskTransitionResult.reject("Employee is not assigned to this task or client");
            }

            if (targetStage.getType() == StageType.WON) {
                return TaskTransitionResult.reject("Employee cannot directly close task to WON; task must be submitted for client review");
            }
            if (targetStage.getType() == StageType.LOST) {
                return TaskTransitionResult.reject("Employee cannot mark task as LOST; only client or admin can cancel the task");
            }
            if (targetStage.getType() == StageType.OPEN) {
                return TaskTransitionResult.allow();
            }

            return TaskTransitionResult.reject("Unsupported stage transition for employee");
        }

        if (role == Role.CLIENT) {
            if (!sameUser(actor, task.getClient())) {
                return TaskTransitionResult.reject("Client cannot modify tasks belonging to other clients");
            }

            // Client can cancel task to LOST at any open stage
            if (targetStage.getType() == StageType.LOST) {
                return TaskTransitionResult.allow();
            }

            // Client can approve (WON) or request rework (OPEN) when in pre-final stage
            if (isPreFinalStage(task.getStage())) {
                if (targetStage.getType() == StageType.WON || targetStage.getType() == StageType.OPEN) {
                    return TaskTransitionResult.allow();
                }
                return TaskTransitionResult.reject("Client can only approve (WON), request rework (OPEN), or cancel (LOST)");
            }

            return TaskTransitionResult.reject("Client can only change stage when task is under review, or cancel task as LOST");
        }

        return TaskTransitionResult.reject("Role " + role + " is not authorized to transition tasks");
    }

    public boolean canTransition(User actor, Task task, Stage targetStage) {
        return evaluateTransition(actor, task, targetStage).allowed();
    }

    public void assertCanTransition(User actor, Task task, Stage targetStage) {
        TaskTransitionResult result = evaluateTransition(actor, task, targetStage);
        if (!result.allowed()) {
            throw new AccessDeniedException(result.message() != null ? result.message() : "Task stage transition denied");
        }
    }

    public boolean isPreFinalStage(Stage stage) {
        if (stage == null) {
            return false;
        }
        return stage.isPreFinal()
                || "На проверке".equalsIgnoreCase(stage.getName())
                || "Review".equalsIgnoreCase(stage.getName())
                || "Согласование".equalsIgnoreCase(stage.getName());
    }

    public boolean isFinalStage(Stage stage) {
        if (stage == null) {
            return false;
        }
        return stage.getType() == StageType.WON || stage.getType() == StageType.LOST;
    }

    public List<Stage> getAllowedNextStages(User actor, Task task, List<Stage> pipelineStages) {
        if (pipelineStages == null || pipelineStages.isEmpty()) {
            return Collections.emptyList();
        }
        return pipelineStages.stream()
                .filter(stage -> canTransition(actor, task, stage))
                .toList();
    }

    private boolean sameUser(User left, User right) {
        if (left == null || right == null) {
            return false;
        }
        return left.getId() != null && left.getId().equals(right.getId());
    }

    private boolean assignedToEmployee(User employee, User client) {
        if (employee == null || client == null) {
            return false;
        }
        return client.getAssignedEmployee() != null && sameUser(employee, client.getAssignedEmployee());
    }
}
