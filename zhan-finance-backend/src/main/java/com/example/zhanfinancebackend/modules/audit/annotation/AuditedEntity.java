package com.example.zhanfinancebackend.modules.audit.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to mark JPA entities that should be audited.
 * Any entity with this annotation will have its inserts, updates, and deletes logged in the audit_logs table.
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface AuditedEntity {
}
