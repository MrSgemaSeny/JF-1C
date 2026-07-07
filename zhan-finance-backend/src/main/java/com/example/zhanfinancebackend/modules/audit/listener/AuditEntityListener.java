package com.example.zhanfinancebackend.modules.audit.listener;

import com.example.zhanfinancebackend.modules.audit.service.AuditService;
import jakarta.persistence.PostPersist;
import jakarta.persistence.PostRemove;
import jakarta.persistence.PostUpdate;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;

@Component
public class AuditEntityListener implements ApplicationContextAware {

    private static ApplicationContext applicationContext;

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) {
        AuditEntityListener.applicationContext = applicationContext;
    }

    @PostPersist
    public void postPersist(Object entity) {
        logAction("CREATE", entity);
    }

    @PostUpdate
    public void postUpdate(Object entity) {
        logAction("UPDATE", entity);
    }

    @PostRemove
    public void postRemove(Object entity) {
        logAction("DELETE", entity);
    }

    private void logAction(String action, Object entity) {
        if (applicationContext == null) return;
        try {
            AuditService auditService = applicationContext.getBean(AuditService.class);
            Long entityId = extractId(entity);
            String entityName = entity.getClass().getSimpleName();
            String details = entity != null ? entity.toString() : null;
            auditService.logAction(action, entityName, entityId, details);
        } catch (Exception e) {
            // Silently ignore audit log failures so business logic continues
            System.err.println("Failed to log audit for entity " + entity.getClass().getSimpleName() + ": " + e.getMessage());
        }
    }

    private Long extractId(Object entity) {
        try {
            Method method = entity.getClass().getMethod("getId");
            Object id = method.invoke(entity);
            if (id instanceof Long) return (Long) id;
            if (id instanceof Integer) return ((Integer) id).longValue();
        } catch (Exception ignored) {
        }
        return 0L;
    }
}
