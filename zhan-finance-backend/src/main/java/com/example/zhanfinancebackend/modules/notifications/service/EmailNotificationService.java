package com.example.zhanfinancebackend.modules.notifications.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailNotificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailNotificationService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.from-address}")
    private String fromAddress;

    public EmailNotificationService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Fire-and-forget asynchronous email sender.
     * Guaranteed not to block or crash the main request thread if SMTP is down or missing credentials.
     */
    @Async
    public void sendEmailAsync(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);

            mailSender.send(message);
            log.info("Email sent successfully to {}", to);
        } catch (Exception e) {
            // Graceful degradation: log the error but don't bubble it up.
            // This prevents a faulty SMTP config from blocking document uploads or task updates.
            log.warn("Failed to send email to {}. Reason: {}", to, e.getMessage());
        }
    }
}
