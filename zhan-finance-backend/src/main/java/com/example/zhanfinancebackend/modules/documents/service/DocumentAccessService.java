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
        if (actor.getRole() == Role.ADMIN) {
            return true;
        }
        if (actor.getRole() == Role.CLIENT) {
            return sameUser(actor, document.getUser());
        }
        return actor.getRole() == Role.EMPLOYEE && assignedToEmployee(actor, document.getUser());
    }

    public boolean canWrite(User actor, Document document) {
        return actor.getRole() == Role.ADMIN
                || (actor.getRole() == Role.EMPLOYEE && assignedToEmployee(actor, document.getUser()))
                || (actor.getRole() == Role.CLIENT && sameUser(actor, document.getUser()));
    }

    public void assertCanRead(User actor, Document document) {
        if (!canRead(actor, document)) {
            throw new ApiException(ErrorCode.FORBIDDEN, "Document access denied");
        }
    }

    public void assertCanWrite(User actor, Document document) {
        if (!canWrite(actor, document)) {
            throw new ApiException(ErrorCode.FORBIDDEN, "Document mutation denied");
        }
    }

    public boolean canCreateFor(User actor, User targetUser) {
        return actor.getRole() == Role.ADMIN
                || (actor.getRole() == Role.CLIENT && sameUser(actor, targetUser))
                || (actor.getRole() == Role.EMPLOYEE && assignedToEmployee(actor, targetUser));
    }

    public void assertCanCreateFor(User actor, User targetUser) {
        if (!canCreateFor(actor, targetUser)) {
            throw new ApiException(ErrorCode.FORBIDDEN, "Document creation denied for this user");
        }
    }

    private boolean sameUser(User left, User right) {
        return left.getId() != null && left.getId().equals(right.getId());
    }

    private boolean assignedToEmployee(User employee, User client) {
        return client.getAssignedEmployee() != null && sameUser(employee, client.getAssignedEmployee());
    }
}
