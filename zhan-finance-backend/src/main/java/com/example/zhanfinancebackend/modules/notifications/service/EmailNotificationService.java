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
        } catch (org.springframework.mail.MailAuthenticationException e) {
            log.warn("Mocking email to {}. (SMTP authentication failed - skipping real email)", to);
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
    public void sendTaskStatusUpdatedEmail(com.example.zhanfinancebackend.modules.auth.entity.User user, com.example.zhanfinancebackend.modules.crm.entity.Task task, String oldStatus, String newStatus, String lostReason) {
        if (user.getEmail() == null || user.getEmail().isBlank()) return;

        String subject = "Обновлен статус задачи: " + task.getTitle();
        
        String lostReasonHtml = (lostReason != null && !lostReason.isBlank()) 
            ? "<p><b>Причина:</b> " + lostReason + "</p>"
            : "";

        String html = String.format(
            "<h2>Статус задачи изменен</h2>" +
            "<p>Здравствуйте, <b>%s</b>!</p>" +
            "<p>Статус задачи <b>%s</b> был изменен с <b>%s</b> на <b>%s</b>.</p>" +
            "%s" +
            "<br/><a href=\"%s\" style=\"padding: 10px 20px; background-color: #047857; color: white; text-decoration: none; border-radius: 5px;\">Посмотреть задачу</a>",
            user.getFullName(),
            task.getTitle(),
            oldStatus,
            newStatus,
            lostReasonHtml,
            frontendUrl
        );

        sendHtmlEmail(user.getEmail(), subject, html);
    }

    @Async
    public void sendTaskCompletedEmailWithDocuments(com.example.zhanfinancebackend.modules.auth.entity.User user, com.example.zhanfinancebackend.modules.crm.entity.Task task, java.util.List<com.example.zhanfinancebackend.modules.documents.entity.Document> documents, com.example.zhanfinancebackend.modules.documents.service.StorageService storageService) {
        if (user.getEmail() == null || user.getEmail().isBlank()) return;

        String subject = "✅ Ваша задача успешно завершена: " + task.getTitle();
        
        String html = String.format(
            "<h2>Задача завершена!</h2>" +
            "<p>Здравствуйте, <b>%s</b>!</p>" +
            "<p>С радостью сообщаем, что задача <b>%s</b> была успешно завершена.</p>" +
            "<p>Во вложении к этому письму вы найдете все необходимые документы, подготовленные в рамках этой задачи.</p>" +
            "<br/><a href=\"%s\" style=\"padding: 10px 20px; background-color: #047857; color: white; text-decoration: none; border-radius: 5px;\">Перейти в личный кабинет</a>",
            user.getFullName(),
            task.getTitle(),
            frontendUrl
        );

        try {
            jakarta.mail.internet.MimeMessage message = mailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromAddress);
            helper.setTo(user.getEmail());
            helper.setSubject(subject);
            helper.setText(html, true);
            
            if (documents != null && !documents.isEmpty() && storageService != null) {
                for (com.example.zhanfinancebackend.modules.documents.entity.Document doc : documents) {
                    try {
                        if (doc.getStorageKey() == null || doc.getStorageKey().isBlank()) {
                            log.warn("Document {} has no storageKey, skipping attachment", doc.getId());
                            continue;
                        }
                        byte[] fileData = storageService.loadAsBytes(doc.getStorageKey());
                        helper.addAttachment(doc.getFileName(), new org.springframework.core.io.ByteArrayResource(fileData));
                    } catch (Exception e) {
                        log.warn("Failed to attach document {} to email: {}", doc.getFileName(), e.getMessage());
                    }
                }
            }
            
            mailSender.send(message);
            log.info("Sent completed task email with documents to: {}", user.getEmail());
        } catch (org.springframework.mail.MailAuthenticationException e) {
            log.warn("Mocking email to {}. (SMTP authentication failed - skipping real email)", user.getEmail());
        } catch (jakarta.mail.MessagingException e) {
            log.error("Failed to send email to: {}", user.getEmail(), e);
        } catch (Exception e) {
            log.error("Error sending email: ", e);
        }
    }

    public void sendWelcomeEmail(com.example.zhanfinancebackend.modules.auth.entity.User user) {
        String subject = "Добро пожаловать в Zhan Finance";
        String html = """
                <div style="font-family:sans-serif">
                  <h2>Добро пожаловать, %s!</h2>
                  <p>Вы успешно зарегистрировались в системе Zhan Finance через Google-аккаунт.</p>
                  <p>Вы можете войти в личный кабинет и начать работу прямо сейчас.</p>
                </div>
                """.formatted(user.getFullName());

        sendHtmlEmail(user.getEmail(), subject, html);
    }

    public void sendAccountApprovedEmail(com.example.zhanfinancebackend.modules.auth.entity.User user) {
        String subject = "Аккаунт подтвержден";
        String html = """
                <div style="font-family:sans-serif">
                  <h2>Здравствуйте, %s!</h2>
                  <p>Ваш аккаунт сотрудника был успешно подтвержден администратором.</p>
                  <p>Теперь вы можете войти в систему и начать работу.</p>
                  <br/>
                  <p><a href="%s" style="padding:10px 20px; background-color:#1a73e8; color:white; text-decoration:none; border-radius:5px;">Войти в систему</a></p>
                </div>
                """.formatted(user.getFullName(), frontendUrl + "/login");

        sendHtmlEmail(user.getEmail(), subject, html);
    }

    public void sendTaskEditedByClientEmail(com.example.zhanfinancebackend.modules.auth.entity.User user, com.example.zhanfinancebackend.modules.crm.entity.Task task, com.example.zhanfinancebackend.modules.auth.entity.User client) {
        if (user.getEmail() == null || user.getEmail().isBlank()) return;

        String subject = "Клиент отредактировал задачу: " + task.getTitle();
        String html = String.format(
            "<h2>Обновление задачи</h2>" +
            "<p>Здравствуйте, <b>%s</b>!</p>" +
            "<p>Клиент <b>%s</b> внес изменения в задачу <b>%s</b>.</p>" +
            "<br/><a href=\"%s\" style=\"padding: 10px 20px; background-color: #047857; color: white; text-decoration: none; border-radius: 5px;\">Посмотреть задачу</a>",
            user.getFullName(),
            client.getFullName(),
            task.getTitle(),
            frontendUrl
        );

        sendHtmlEmail(user.getEmail(), subject, html);
    }

    public void sendTaskDeletedByClientEmail(com.example.zhanfinancebackend.modules.auth.entity.User user, String taskTitle, com.example.zhanfinancebackend.modules.auth.entity.User client) {
        if (user.getEmail() == null || user.getEmail().isBlank()) return;

        String subject = "Клиент удалил задачу: " + taskTitle;
        String html = String.format(
            "<h2>Удаление задачи</h2>" +
            "<p>Здравствуйте, <b>%s</b>!</p>" +
            "<p>Клиент <b>%s</b> удалил свою задачу <b>%s</b>.</p>",
            user.getFullName(),
            client.getFullName(),
            taskTitle
        );

        sendHtmlEmail(user.getEmail(), subject, html);
    }
}