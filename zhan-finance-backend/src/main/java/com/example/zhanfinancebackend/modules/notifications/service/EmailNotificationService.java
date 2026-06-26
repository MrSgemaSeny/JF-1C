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

    @Value("${app.mail.from-address:no-reply@zhan-finance.com}")
    private String fromAddress;

    @Value("${app.frontend.url:http://localhost:5173/JF-1C}")
    private String frontendUrl;

    public EmailNotificationService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

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
            log.warn("Failed to send email to {}. Reason: {}", to, e.getMessage());
        }
    }

    @Async
    public void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            jakarta.mail.internet.MimeMessage message = mailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true); // true indicates HTML content
            
            mailSender.send(message);
            log.info("Sent email to: {}", to);
        } catch (jakarta.mail.MessagingException e) {
            log.error("Failed to send email to: {}", to, e);
        } catch (Exception e) {
            log.error("Error sending email: ", e);
        }
    }

    public void sendTaskAssignedEmail(com.example.zhanfinancebackend.modules.auth.entity.User assignee, com.example.zhanfinancebackend.modules.crm.entity.Task task) {
        if (assignee.getEmail() == null || assignee.getEmail().isBlank()) return;

        String subject = "Вам назначена новая задача: " + task.getTitle();
        String deadlineStr = task.getDueDate() != null ? task.getDueDate().format(java.time.format.DateTimeFormatter.ofPattern("dd.MM.yyyy")) : "Не указан";
        
        String html = String.format(
            "<h2>Новая задача</h2>" +
            "<p>Здравствуйте, <b>%s</b>!</p>" +
            "<p>Вам была назначена новая задача: <b>%s</b></p>" +
            "<p><b>Клиент:</b> %s</p>" +
            "<p><b>Дедлайн:</b> %s</p>" +
            "<p><b>Описание:</b><br/>%s</p>" +
            "<br/><a href=\"%s\" style=\"padding: 10px 20px; background-color: #047857; color: white; text-decoration: none; border-radius: 5px;\">Открыть систему</a>",
            assignee.getFullName(),
            task.getTitle(),
            task.getClient().getFullName(),
            deadlineStr,
            task.getDescription() != null ? task.getDescription() : "",
            frontendUrl
        );

        sendHtmlEmail(assignee.getEmail(), subject, html);
    }

    public void sendTaskDeadlineAlertEmail(com.example.zhanfinancebackend.modules.auth.entity.User user, com.example.zhanfinancebackend.modules.crm.entity.Task task) {
        if (user.getEmail() == null || user.getEmail().isBlank()) return;

        String subject = "🚨 Приближается дедлайн по задаче: " + task.getTitle();
        String deadlineStr = task.getDueDate() != null ? task.getDueDate().format(java.time.format.DateTimeFormatter.ofPattern("dd.MM.yyyy")) : "Не указан";
        
        String html = String.format(
            "<h2>Горит Дедлайн!</h2>" +
            "<p>Здравствуйте, <b>%s</b>!</p>" +
            "<p>Напоминаем, что срок выполнения задачи <b>%s</b> от клиента <b>%s</b> скоро истекает.</p>" +
            "<p><b>Дедлайн:</b> <span style=\"color: red; font-weight: bold;\">%s</span></p>" +
            "<br/><a href=\"%s\" style=\"padding: 10px 20px; background-color: #047857; color: white; text-decoration: none; border-radius: 5px;\">Посмотреть задачу</a>",
            user.getFullName(),
            task.getTitle(),
            task.getClient().getFullName(),
            deadlineStr,
            frontendUrl
        );

        sendHtmlEmail(user.getEmail(), subject, html);
    }
}
