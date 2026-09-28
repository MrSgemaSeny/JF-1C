package com.example.zhanfinancebackend.modules.billing.service;

import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.billing.entity.PaymentReceipt;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
public class PaymentReceiptAccessService {

    public boolean canRead(User actor, PaymentReceipt receipt) {
        if (actor == null || receipt == null) {
            return false;
        }
        if (actor.getRole() == Role.ADMIN) {
            return true;
        }
        if (actor.getRole() == Role.CLIENT) {
            return sameUser(actor, receipt.getClient());
        }
        return false;
    }

    public void assertCanRead(User actor, PaymentReceipt receipt) {
        if (!canRead(actor, receipt)) {
            throw new AccessDeniedException("Access to payment receipt denied");
        }
    }

    public boolean canReview(User actor) {
        return actor != null && actor.getRole() == Role.ADMIN;
    }

    public void assertCanReview(User actor) {
        if (!canReview(actor)) {
            throw new AccessDeniedException("Reviewing payment receipts is restricted to administrators");
        }
    }

    public boolean canSubmit(User actor) {
        return actor != null && (actor.getRole() == Role.CLIENT || actor.getRole() == Role.ADMIN);
    }

    public void assertCanSubmit(User actor) {
        if (!canSubmit(actor)) {
            throw new AccessDeniedException("Submitting payment receipts is restricted to clients");
        }
    }

    private boolean sameUser(User left, User right) {
        return left != null && right != null && left.getId() != null && left.getId().equals(right.getId());
    }
}
