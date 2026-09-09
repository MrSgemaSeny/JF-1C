package com.example.zhanfinancebackend.modules.notifications.service;

import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.crm.entity.Task;
import com.example.zhanfinancebackend.modules.documents.entity.Document;
import com.example.zhanfinancebackend.modules.notifications.event.SendHtmlEmailEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class EmailNotificationServiceTest {

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private EmailNotificationService emailNotificationService;

    private User client;
    private Task task;
    private Document document;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailNotificationService, "fromAddress", "noreply@zhanfinance.com");
        ReflectionTestUtils.setField(emailNotificationService, "frontendUrl", "http://localhost:5173/JF-1C");

        client = new User("John Doe", "client@test.com", "pass", Role.CLIENT);
        
        task = new Task("Annual Report", client, null);
        ReflectionTestUtils.setField(task, "id", 10L);

        document = new Document(client, null, "report.pdf", "key", "application/pdf", 1024L);
    }

    @Test
    void sendDocumentAttachedEmail_publishesEventWithTaskLink() {
        // Act
        emailNotificationService.sendDocumentAttachedEmail(client, document, task);

        // Assert
        ArgumentCaptor<SendHtmlEmailEvent> captor = ArgumentCaptor.forClass(SendHtmlEmailEvent.class);
        verify(eventPublisher).publishEvent(captor.capture());
        SendHtmlEmailEvent event = captor.getValue();

        assertEquals("client@test.com", event.to());
        assertTrue(event.subject().contains("Новый документ"));
        assertTrue(event.htmlBody().contains("Annual Report"));
    }

    @Test
    void sendDocumentAttachedEmail_publishesEventWithDocumentsLink_whenTaskIsNull() {
        // Act
        emailNotificationService.sendDocumentAttachedEmail(client, document, null);

        // Assert
        ArgumentCaptor<SendHtmlEmailEvent> captor = ArgumentCaptor.forClass(SendHtmlEmailEvent.class);
        verify(eventPublisher).publishEvent(captor.capture());
        SendHtmlEmailEvent event = captor.getValue();

        assertEquals("client@test.com", event.to());
        assertTrue(event.subject().contains("Новый документ"));
        assertTrue(event.htmlBody().contains("report.pdf"));
    }
}
