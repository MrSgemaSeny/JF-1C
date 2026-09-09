package com.example.zhanfinancebackend.modules.notifications.listener;

import com.example.zhanfinancebackend.modules.notifications.event.EmailAttachment;
import com.example.zhanfinancebackend.modules.notifications.event.SendHtmlEmailEvent;
import com.example.zhanfinancebackend.modules.notifications.event.SendSimpleEmailEvent;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class EmailEventListener {

    private static final Logger log = LoggerFactory.getLogger(EmailEventListener.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.from-address:no-reply@zhan-finance.com}")
    private String fromAddress;

    public EmailEventListener(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async("mailExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onSendHtmlEmail(SendHtmlEmailEvent event) {
        if (event.to() == null || event.to().isBlank()) return;

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(event.to());
            helper.setSubject(event.subject());
            helper.setText(event.htmlBody(), true);

            if (event.attachments() != null && !event.attachments().isEmpty()) {
                for (EmailAttachment attachment : event.attachments()) {
                    helper.addAttachment(attachment.fileName(), new ByteArrayResource(attachment.data()));
                }
            }

            mailSender.send(message);
            log.info("Email sent successfully to: {}", event.to());
        } catch (MailAuthenticationException e) {
            log.warn("Mocking email to {}. (SMTP authentication failed - skipping real email)", event.to());
        } catch (MessagingException e) {
            log.error("Failed to send email to: {}", event.to(), e);
        } catch (Exception e) {
            log.error("Error sending email to {}: ", event.to(), e);
        }
    }

    @Async("mailExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onSendSimpleEmail(SendSimpleEmailEvent event) {
        if (event.to() == null || event.to().isBlank()) return;

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(event.to());
            message.setSubject(event.subject());
            message.setText(event.text());

            mailSender.send(message);
            log.info("Simple email sent successfully to {}", event.to());
        } catch (Exception e) {
            log.warn("Failed to send simple email to {}. Reason: {}", event.to(), e.getMessage());
        }
    }
}
