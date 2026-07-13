package com.example.zhanfinancebackend.modules.crm.service;

import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.common.exception.ErrorCode;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.crm.entity.Task;
import org.springframework.stereotype.Service;

@Service
public class CrmAccessService {

    public boolean canReadClient(User actor, User client) {
        if (actor.getRole() == Role.ADMIN) {
            return true;
        }
        if (actor.getRole() == Role.EMPLOYEE) {
            return assignedToEmployee(actor, client);
        }
        if (actor.getRole() == Role.CLIENT) {
            return sameUser(actor, client);
        }
        return false;
    }

    public void assertCanReadClient(User actor, User client) {
        if (!canReadClient(actor, client)) {
            throw new org.springframework.security.access.AccessDeniedException("Client profile access denied");
        }
    }

    public boolean canReadTask(User actor, Task task) {
        if (actor.getRole() == Role.ADMIN) {
            return true;
        }
        if (actor.getRole() == Role.EMPLOYEE) {
            return task.getAssignedTo() == null || assignedToEmployee(actor, task.getClient()) || sameUser(actor, task.getAssignedTo());
        }
        if (actor.getRole() == Role.CLIENT) {
            return sameUser(actor, task.getClient());
        }
        return false;
    }

    public void assertCanReadTask(User actor, Task task) {
        if (!canReadTask(actor, task)) {
            throw new org.springframework.security.access.AccessDeniedException("Task access denied");
        }
    }

    public boolean canCreateTaskFor(User actor, User client) {
        if (actor.getRole() == Role.ADMIN) {
            return true;
        }
        if (actor.getRole() == Role.EMPLOYEE) {
            return assignedToEmployee(actor, client);
        }
        return false;
    }

    public void assertCanCreateTaskFor(User actor, User client) {
        if (!canCreateTaskFor(actor, client)) {
            throw new org.springframework.security.access.AccessDeniedException("Task creation denied for this client");
        }
    }

    public boolean canUpdateTaskStage(User actor, Task task, com.example.zhanfinancebackend.modules.crm.entity.Stage newStage) {
        if (actor.getRole() == Role.ADMIN) {
            return true;
        }
        if (actor.getRole() == Role.EMPLOYEE) {
            return assignedToEmployee(actor, task.getClient()) || sameUser(actor, task.getAssignedTo());
        }
        if (actor.getRole() == Role.CLIENT) {
            return sameUser(actor, task.getClient()) && newStage != null && newStage.getType() == com.example.zhanfinancebackend.modules.crm.entity.StageType.WON;
        }
        return false;
    }

    public void assertCanUpdateTaskStage(User actor, Task task, com.example.zhanfinancebackend.modules.crm.entity.Stage newStage) {
        if (!canUpdateTaskStage(actor, task, newStage)) {
            throw new org.springframework.security.access.AccessDeniedException("Task stage update denied");
        }
    }

    public boolean canUpdateTaskDetails(User actor, Task task) {
        if (actor.getRole() == Role.ADMIN) {
            return true;
        }
        if (actor.getRole() == Role.EMPLOYEE) {
            return assignedToEmployee(actor, task.getClient()) || sameUser(actor, task.getAssignedTo());
        }
        if (actor.getRole() == Role.CLIENT) {
            return sameUser(actor, task.getClient());
        }
        return false;
    }

    public void assertCanUpdateTaskDetails(User actor, Task task) {
        if (!canUpdateTaskDetails(actor, task)) {
            throw new org.springframework.security.access.AccessDeniedException("Task details update denied");
        }
    }

    public boolean canAssignClient(User actor) {
        return actor.getRole() == Role.ADMIN;
    }

    public void assertCanAssignClient(User actor) {
        if (!canAssignClient(actor)) {
            throw new org.springframework.security.access.AccessDeniedException("Assigning client denied");
        }
    }

    public boolean canAssignTask(User actor) {
        return actor.getRole() == Role.ADMIN || actor.getRole() == Role.EMPLOYEE;
    }

    public void assertCanAssignTask(User actor) {
        if (!canAssignTask(actor)) {
            throw new org.springframework.security.access.AccessDeniedException("Assigning task denied");
        }
    }

    private boolean sameUser(User left, User right) {
        if (left == null || right == null) return false;
        return left.getId() != null && left.getId().equals(right.getId());
    }

    private boolean assignedToEmployee(User employee, User client) {
        if (employee == null || client == null) return false;
        return client.getAssignedEmployee() != null && sameUser(employee, client.getAssignedEmployee());
    }
}

