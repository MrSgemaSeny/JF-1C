package com.example.zhanfinancebackend.modules.audit.event;

import org.springframework.context.ApplicationEvent;

public class AuditEvent extends ApplicationEvent {
    private final String action;
    private final String entityName;
    private final Long entityId;
    private final Long userId;
    private final String details;

    public AuditEvent(Object source, String action, String entityName, Long entityId, Long userId, String details) {
        super(source);
        this.action = action;
        this.entityName = entityName;
        this.entityId = entityId;
        this.userId = userId;
        this.details = details;
    }

    public String getAction() { return action; }
    public String getEntityName() { return entityName; }
    public Long getEntityId() { return entityId; }
    public Long getUserId() { return userId; }
    public String getDetails() { return details; }
}
