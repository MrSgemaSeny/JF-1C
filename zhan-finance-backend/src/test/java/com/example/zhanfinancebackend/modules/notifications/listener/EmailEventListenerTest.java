package com.example.zhanfinancebackend.modules.notifications.listener;

import com.example.zhanfinancebackend.modules.notifications.event.EmailAttachment;
import com.example.zhanfinancebackend.modules.notifications.event.SendHtmlEmailEvent;
import com.example.zhanfinancebackend.modules.notifications.event.SendSimpleEmailEvent;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailEventListenerTest {

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private EmailEventListener emailEventListener;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailEventListener, "fromAddress", "noreply@zhanfinance.com");
    }

    @Test
    void onSendHtmlEmail_sendsMimeMessageSuccessfully() {
        MimeMessage mimeMessage = new MimeMessage((Session) null);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        SendHtmlEmailEvent event = new SendHtmlEmailEvent(
                "test@example.com",
                "Subject Test",
                "<h1>Hello</h1>"
        );

        emailEventListener.onSendHtmlEmail(event);

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void onSendHtmlEmail_withAttachments_sendsMimeMessage() {
        MimeMessage mimeMessage = new MimeMessage((Session) null);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        List<EmailAttachment> attachments = List.of(
                new EmailAttachment("report.pdf", "sample data".getBytes())
        );
        SendHtmlEmailEvent event = new SendHtmlEmailEvent(
                "test@example.com",
                "Subject with attachment",
                "<p>Attached</p>",
                attachments
        );

        emailEventListener.onSendHtmlEmail(event);

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void onSendHtmlEmail_emptyRecipient_skipsSending() {
        SendHtmlEmailEvent event = new SendHtmlEmailEvent(
                "",
                "Subject Test",
                "<h1>Hello</h1>"
        );

        emailEventListener.onSendHtmlEmail(event);

        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    void onSendSimpleEmail_sendsSimpleMailMessage() {
        SendSimpleEmailEvent event = new SendSimpleEmailEvent(
                "test@example.com",
                "Subject Simple",
                "Simple text"
        );

        emailEventListener.onSendSimpleEmail(event);

        verify(mailSender).send(any(SimpleMailMessage.class));
    }

    @Test
    void onSendSimpleEmail_emptyRecipient_skipsSending() {
        SendSimpleEmailEvent event = new SendSimpleEmailEvent(
                "",
                "Subject Simple",
                "Simple text"
        );

        emailEventListener.onSendSimpleEmail(event);

        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }
}
