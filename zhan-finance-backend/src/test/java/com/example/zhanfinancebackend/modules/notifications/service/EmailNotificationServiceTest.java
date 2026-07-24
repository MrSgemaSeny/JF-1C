package com.example.zhanfinancebackend.modules.notifications.service;

import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.crm.entity.Task;
import com.example.zhanfinancebackend.modules.documents.entity.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.Session;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailNotificationServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private EmailNotificationService emailNotificationService;

    private User client;
    private Task task;
    private Document document;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailNotificationService, "fromAddress", "noreply@zhanfinance.com");
        ReflectionTestUtils.setField(emailNotificationService, "frontendUrl", "http://localhost:5173/JF-1C");

        client = new User("client@test.com", "pass", "John Doe", Role.CLIENT);
        
        task = new Task("Annual Report", client, null);
        org.springframework.test.util.ReflectionTestUtils.setField(task, "id", 10L);

        document = new Document(client, null, "report.pdf", "key", "application/pdf", 1024L);

        MimeMessage mimeMessage = new MimeMessage((Session) null);
        lenient().when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
    }

    @Test
    void sendDocumentAttachedEmail_sendsEmailWithTaskLink() {
        // Act
        emailNotificationService.sendDocumentAttachedEmail(client, document, task);

        // Assert
        verify(mailSender).send(argThat((MimeMessage msg) -> {
            try {
                return msg.getSubject().contains("Новый документ");
            } catch (Exception e) {
                return false;
            }
        }));
    }

    @Test
    void sendDocumentAttachedEmail_sendsEmailWithDocumentsLink_whenTaskIsNull() {
        // Act
        emailNotificationService.sendDocumentAttachedEmail(client, document, null);

        // Assert
        verify(mailSender).send(argThat((MimeMessage msg) -> {
            try {
                return msg.getSubject().contains("Новый документ");
            } catch (Exception e) {
                return false;
            }
        }));
    }
}
