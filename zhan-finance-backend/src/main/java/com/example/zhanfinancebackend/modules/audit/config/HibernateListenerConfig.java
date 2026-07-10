package com.example.zhanfinancebackend.modules.audit.config;

import com.example.zhanfinancebackend.modules.audit.listener.HibernateAuditListener;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.hibernate.event.service.spi.EventListenerRegistry;
import org.hibernate.event.spi.EventType;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.stereotype.Component;

@Component
public class HibernateListenerConfig implements ApplicationListener<ContextRefreshedEvent> {

    private final EntityManagerFactory entityManagerFactory;
    private final HibernateAuditListener hibernateAuditListener;

    public HibernateListenerConfig(EntityManagerFactory entityManagerFactory, HibernateAuditListener hibernateAuditListener) {
        this.entityManagerFactory = entityManagerFactory;
        this.hibernateAuditListener = hibernateAuditListener;
    }

    @Override
    public void onApplicationEvent(ContextRefreshedEvent event) {
        SessionFactoryImplementor sessionFactory = entityManagerFactory.unwrap(SessionFactoryImplementor.class);
        EventListenerRegistry registry = sessionFactory.getServiceRegistry().getService(EventListenerRegistry.class);
        
        if (registry != null) {
            registry.getEventListenerGroup(EventType.POST_UPDATE).appendListener(hibernateAuditListener);
            registry.getEventListenerGroup(EventType.POST_INSERT).appendListener(hibernateAuditListener);
            registry.getEventListenerGroup(EventType.POST_DELETE).appendListener(hibernateAuditListener);
        }
    }
}
