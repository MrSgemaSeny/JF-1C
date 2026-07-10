package com.example.zhanfinancebackend.modules.audit.listener;

import com.example.zhanfinancebackend.modules.audit.service.AuditService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.hibernate.event.spi.PostDeleteEvent;
import org.hibernate.event.spi.PostDeleteEventListener;
import org.hibernate.event.spi.PostInsertEvent;
import org.hibernate.event.spi.PostInsertEventListener;
import org.hibernate.event.spi.PostUpdateEvent;
import org.hibernate.event.spi.PostUpdateEventListener;
import org.hibernate.persister.entity.EntityPersister;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Component
public class HibernateAuditListener implements PostInsertEventListener, PostUpdateEventListener, PostDeleteEventListener {

    private static final Logger log = LoggerFactory.getLogger(HibernateAuditListener.class);
    private static final Set<String> AUDITED_ENTITIES = Set.of("User", "Invoice", "Task", "Subscription");

    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    // Use Lazy to prevent circular dependencies during SessionFactory creation
    public HibernateAuditListener(@Lazy AuditService auditService, ObjectMapper objectMapper) {
        this.auditService = auditService;
        this.objectMapper = objectMapper;
    }

    @Override
    public void onPostInsert(PostInsertEvent event) {
        try {
            String details = serializeNewState(event.getState(), event.getPersister().getPropertyNames());
            logAction("CREATE", event.getEntity(), details);
        } catch (Exception e) {
            log.error("Failed to log CREATE audit", e);
        }
    }

    @Override
    public void onPostUpdate(PostUpdateEvent event) {
        try {
            String diff = generateDiff(event.getOldState(), event.getState(), event.getPersister().getPropertyNames());
            if (diff != null && !diff.equals("{}")) {
                logAction("UPDATE", event.getEntity(), diff);
            }
        } catch (Exception e) {
            log.error("Failed to log UPDATE audit", e);
        }
    }

    @Override
    public void onPostDelete(PostDeleteEvent event) {
        try {
            logAction("DELETE", event.getEntity(), "{}");
        } catch (Exception e) {
            log.error("Failed to log DELETE audit", e);
        }
    }

    @Override
    public boolean requiresPostCommitHandling(EntityPersister persister) {
        return false;
    }

    private void logAction(String action, Object entity, String details) {
        String entityName = entity.getClass().getSimpleName();
        if (!AUDITED_ENTITIES.contains(entityName)) {
            return;
        }

        Long userId = getCurrentUserId();
        Long entityId = extractId(entity);

        auditService.logAction(action, entityName, entityId, userId, details);
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.example.zhanfinancebackend.modules.auth.security.UserPrincipal) {
            return ((com.example.zhanfinancebackend.modules.auth.security.UserPrincipal) auth.getPrincipal()).getId();
        }
        return null;
    }

    private String generateDiff(Object[] oldState, Object[] newState, String[] propertyNames) throws Exception {
        if (newState == null || propertyNames == null) return "{}";
        Map<String, Object> diff = new HashMap<>();
        
        for (int i = 0; i < propertyNames.length; i++) {
            Object oldVal = oldState != null ? oldState[i] : null;
            Object newVal = newState[i];

            if (!java.util.Objects.equals(oldVal, newVal)) {
                Map<String, Object> changes = new HashMap<>();
                changes.put("old", sanitize(oldVal));
                changes.put("new", sanitize(newVal));
                diff.put(propertyNames[i], changes);
            }
        }
        try {
            return objectMapper.writeValueAsString(diff);
        } catch (Exception e) {
            log.warn("Failed to serialize diff: {}", e.getMessage());
            return "{\"error\":\"serialization_failed\"}";
        }
    }

    private String serializeNewState(Object[] state, String[] propertyNames) throws Exception {
        if (state == null || propertyNames == null) return "{}";
        Map<String, Object> map = new HashMap<>();
        for (int i = 0; i < propertyNames.length; i++) {
            map.put(propertyNames[i], sanitize(state[i]));
        }
        try {
            return objectMapper.writeValueAsString(map);
        } catch (Exception e) {
            log.warn("Failed to serialize new state: {}", e.getMessage());
            return "{\"error\":\"serialization_failed\"}";
        }
    }

    private Object sanitize(Object value) {
        if (value == null) return null;
        if (value instanceof String || value instanceof Number || value instanceof Boolean || 
            value instanceof java.time.temporal.Temporal || value instanceof java.util.Date) {
            return value;
        }
        if (value.getClass().isEnum()) {
            return value.toString();
        }
        Long id = extractId(value);
        if (id != null && id > 0) {
            return id;
        }
        return "Object(" + value.getClass().getSimpleName() + ")";
    }

    private Long extractId(Object entity) {
        try {
            java.lang.reflect.Method method = entity.getClass().getMethod("getId");
            Object id = method.invoke(entity);
            if (id instanceof Long) return (Long) id;
            if (id instanceof Integer) return ((Integer) id).longValue();
        } catch (Exception ignored) {
        }
        return 0L;
    }
}
