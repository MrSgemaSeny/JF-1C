package com.example.zhanfinancebackend.modules.audit.service;

import com.example.zhanfinancebackend.modules.audit.entity.AuditLog;
import com.example.zhanfinancebackend.modules.audit.event.AuditEvent;
import com.example.zhanfinancebackend.modules.audit.repository.AuditLogRepository;
import com.example.zhanfinancebackend.modules.auth.security.UserPrincipal;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final ApplicationEventPublisher eventPublisher;

    public AuditService(AuditLogRepository auditLogRepository, ApplicationEventPublisher eventPublisher) {
        this.auditLogRepository = auditLogRepository;
        this.eventPublisher = eventPublisher;
    }

    public void logAction(String action, String entityName, Long entityId, String details) {
        logAction(action, entityName, entityId, getCurrentUserId(), details);
    }

    public void logAction(String action, String entityName, Long entityId, Long userId, String details) {
        eventPublisher.publishEvent(new AuditEvent(this, action, entityName, entityId, userId, details));
    }

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

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            return principal.getId();
        }
        return null; // For system actions or anonymous
    }
}
