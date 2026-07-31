package com.example.zhanfinancebackend.modules.documents.service;

import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.common.exception.ErrorCode;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.documents.entity.Document;
import org.springframework.stereotype.Service;

@Service
public class DocumentAccessService {

    public boolean canRead(User actor, Document document) {
        if (actor == null || document == null) return false;
        if (actor.getRole() == Role.ADMIN || actor.getRole() == Role.ADVISOR || actor.getRole() == Role.EMPLOYEE) {
            return true;
        }
        if (actor.getRole() == Role.CLIENT) {
            return sameUser(actor, document.getUser());
        }
        return false;
    }

    public boolean canWrite(User actor, Document document) {
        if (actor == null || document == null) return false;
        return actor.getRole() == Role.ADMIN
                || actor.getRole() == Role.ADVISOR
                || actor.getRole() == Role.EMPLOYEE
                || (actor.getRole() == Role.CLIENT && sameUser(actor, document.getUser()));
    }

    public void assertCanRead(User actor, Document document) {
        if (!canRead(actor, document)) {
            throw new org.springframework.security.access.AccessDeniedException("Document access denied");
        }
    }

    public void assertCanWrite(User actor, Document document) {
        if (!canWrite(actor, document)) {
            throw new org.springframework.security.access.AccessDeniedException("Document mutation denied");
        }
    }

    public boolean canCreateFor(User actor, User targetUser) {
        if (actor == null) return false;
        return actor.getRole() == Role.ADMIN
                || actor.getRole() == Role.ADVISOR
                || actor.getRole() == Role.EMPLOYEE
                || (actor.getRole() == Role.CLIENT && sameUser(actor, targetUser));
    }

    public void assertCanCreateFor(User actor, User targetUser) {
        if (!canCreateFor(actor, targetUser)) {
            throw new org.springframework.security.access.AccessDeniedException("Document creation denied for this user");
        }
    }

    private boolean sameUser(User left, User right) {
        return left.getId() != null && left.getId().equals(right.getId());
    }

    private boolean assignedToEmployee(User employee, User client) {
        return client.getAssignedEmployee() != null && sameUser(employee, client.getAssignedEmployee());
    }
}

