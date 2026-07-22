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

    /**
     * Unified formal corporate HTML template generator for Zhan Finance.
     */
    public String buildFormalEmailHtml(String headerTitle, String recipientName, String contentHtml, String buttonText, String buttonUrl) {
        String buttonHtml = "";
        if (buttonText != null && buttonUrl != null && !buttonText.isBlank() && !buttonUrl.isBlank()) {
            buttonHtml = String.format(
                "<div style=\"margin-top: 24px; margin-bottom: 16px;\">" +
                "  <a href=\"%s\" style=\"display: inline-block; padding: 12px 24px; background-color: #047857; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;\">%s</a>" +
                "</div>",
                buttonUrl, buttonText
            );
        }

        return String.format(
            "<div style=\"font-family: Arial, sans-serif; color: #333333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);\">" +
            "  <div style=\"background-color: #047857; padding: 24px; text-align: left;\">" +
            "    <h1 style=\"color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;\">Zhan Finance</h1>" +
            "  </div>" +
            "  <div style=\"padding: 24px;\">" +
            "    <h2 style=\"color: #111827; font-size: 18px; font-weight: 700; margin-top: 0; margin-bottom: 16px;\">%s</h2>" +
            "    <p style=\"margin-top: 0; margin-bottom: 16px;\">Здравствуйте, <b>%s</b>!</p>" +
            "    %s" +
            "    %s" +
            "    <hr style=\"border: none; border-top: 1px solid #e5e7eb; margin: 24px 0 16px 0;\" />" +
            "    <p style=\"font-size: 13px; color: #6b7280; margin: 0;\">" +
            "      С уважением,<br/>" +
            "      <b style=\"color: #374151;\">Команда Zhan Finance</b>" +
            "    </p>" +
            "  </div>" +
            "</div>",
            headerTitle,
            recipientName,
            contentHtml,
            buttonHtml
        );
    }

    public void sendTaskAssignedEmail(com.example.zhanfinancebackend.modules.auth.entity.User assignee, com.example.zhanfinancebackend.modules.crm.entity.Task task) {
        if (assignee.getEmail() == null || assignee.getEmail().isBlank()) return;

        String subject = "Вам назначена новая задача: " + task.getTitle();
        String deadlineStr = task.getDueDate() != null ? task.getDueDate().format(java.time.format.DateTimeFormatter.ofPattern("dd.MM.yyyy")) : "Не указан";
        
        String contentHtml = String.format(
            "<p>Вам была назначена новая задача в рабочей системе.</p>" +
            "<div style=\"background-color: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #f3f4f6; margin: 16px 0;\">" +
            "  <p style=\"margin-top: 0; margin-bottom: 8px;\"><b>Детали задачи:</b></p>" +
            "  <ul style=\"margin: 0; padding-left: 20px;\">" +
            "    <li><b>Название:</b> %s</li>" +
            "    <li><b>Клиент:</b> %s</li>" +
            "    <li><b>Дедлайн:</b> %s</li>" +
            "    <li><b>Описание:</b> %s</li>" +
            "  </ul>" +
            "</div>",
            task.getTitle(),
            task.getClient() != null ? task.getClient().getFullName() : "Не указан",
            deadlineStr,
            task.getDescription() != null && !task.getDescription().isBlank() ? task.getDescription() : "Отсутствует"
        );

        String html = buildFormalEmailHtml("Новая задача в системе", assignee.getFullName(), contentHtml, "Открыть задачу", frontendUrl);
        sendHtmlEmail(assignee.getEmail(), subject, html);
    }

    public void sendTaskDeadlineAlertEmail(com.example.zhanfinancebackend.modules.auth.entity.User user, com.example.zhanfinancebackend.modules.crm.entity.Task task) {
        if (user.getEmail() == null || user.getEmail().isBlank()) return;

        String subject = "🚨 Приближается дедлайн по задаче: " + task.getTitle();
        String deadlineStr = task.getDueDate() != null ? task.getDueDate().format(java.time.format.DateTimeFormatter.ofPattern("dd.MM.yyyy")) : "Не указан";
        
        String contentHtml = String.format(
            "<p>Напоминаем, что срок выполнения задачи скоро истекает. Пожалуйста, проверьте статус выполнения.</p>" +
            "<div style=\"background-color: #fef2f2; padding: 16px; border-radius: 8px; border: 1px solid #fee2e2; margin: 16px 0;\">" +
            "  <p style=\"margin-top: 0; margin-bottom: 8px; color: #991b1b;\"><b>Параметры дедлайна:</b></p>" +
            "  <ul style=\"margin: 0; padding-left: 20px; color: #7f1d1d;\">" +
            "    <li><b>Задача:</b> %s</li>" +
            "    <li><b>Клиент:</b> %s</li>" +
            "    <li><b>Дедлайн:</b> <span style=\"color: #dc2626; font-weight: bold;\">%s</span></li>" +
            "  </ul>" +
            "</div>",
            task.getTitle(),
            task.getClient() != null ? task.getClient().getFullName() : "Не указан",
            deadlineStr
        );

        String html = buildFormalEmailHtml("Внимание: Горит Дедлайн!", user.getFullName(), contentHtml, "Посмотреть задачу", frontendUrl);
        sendHtmlEmail(user.getEmail(), subject, html);
    }

    public void sendTaskStatusUpdatedEmail(com.example.zhanfinancebackend.modules.auth.entity.User user, com.example.zhanfinancebackend.modules.crm.entity.Task task, String oldStatus, String newStatus, String lostReason) {
        if (user.getEmail() == null || user.getEmail().isBlank()) return;

        String subject = "Обновлен статус задачи: " + task.getTitle();
        
        String lostReasonItem = (lostReason != null && !lostReason.isBlank()) 
            ? "<li><b>Причина отмены:</b> " + lostReason + "</li>"
            : "";

        String contentHtml = String.format(
            "<p>Статус вашей задачи был успешно изменен в системе.</p>" +
            "<div style=\"background-color: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #f3f4f6; margin: 16px 0;\">" +
            "  <p style=\"margin-top: 0; margin-bottom: 8px;\"><b>Информация о статусе:</b></p>" +
            "  <ul style=\"margin: 0; padding-left: 20px;\">" +
            "    <li><b>Задача:</b> %s</li>" +
            "    <li><b>Предыдущий статус:</b> %s</li>" +
            "    <li><b>Новый статус:</b> <span style=\"color: #047857; font-weight: bold;\">%s</span></li>" +
            "    %s" +
            "  </ul>" +
            "</div>",
            task.getTitle(),
            oldStatus,
            newStatus,
            lostReasonItem
        );

        String html = buildFormalEmailHtml("Изменение статуса задачи", user.getFullName(), contentHtml, "Посмотреть задачу", frontendUrl);
        sendHtmlEmail(user.getEmail(), subject, html);
    }

    @Async
    public void sendTaskCompletedEmailWithDocuments(com.example.zhanfinancebackend.modules.auth.entity.User user, com.example.zhanfinancebackend.modules.crm.entity.Task task, java.util.List<com.example.zhanfinancebackend.modules.documents.entity.Document> documents, com.example.zhanfinancebackend.modules.documents.service.StorageService storageService) {
        if (user.getEmail() == null || user.getEmail().isBlank()) return;

        String subject = "✅ Ваша задача успешно завершена: " + task.getTitle();
        
        String contentHtml = String.format(
            "<p>С радостью сообщаем, что работа по вашей задаче полностью завершена.</p>" +
            "<div style=\"background-color: #ecfdf5; padding: 16px; border-radius: 8px; border: 1px solid #d1fae5; margin: 16px 0;\">" +
            "  <p style=\"margin-top: 0; margin-bottom: 8px; color: #065f46;\"><b>Результат выполнения:</b></p>" +
            "  <ul style=\"margin: 0; padding-left: 20px; color: #047857;\">" +
            "    <li><b>Задача:</b> %s</li>" +
            "    <li><b>Документы:</b> Итоговые файлы прикреплены во вложении к данному письму</li>" +
            "  </ul>" +
            "</div>",
            task.getTitle()
        );

        String html = buildFormalEmailHtml("Задача успешно выполнена!", user.getFullName(), contentHtml, "Перейти в личный кабинет", frontendUrl);

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
        if (user.getEmail() == null || user.getEmail().isBlank()) return;

        String subject = "Добро пожаловать в Zhan Finance";
        String contentHtml = 
            "<p>Вы успешно зарегистрировались в системе Zhan Finance.</p>" +
            "<div style=\"background-color: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #f3f4f6; margin: 16px 0;\">" +
            "  <p style=\"margin: 0;\">Вам открыт доступ в личный кабинет для работы с бухгалтерскими и финансовыми услугами.</p>" +
            "</div>";

        String html = buildFormalEmailHtml("Добро пожаловать в Zhan Finance!", user.getFullName(), contentHtml, "Войти в личный кабинет", frontendUrl + "/login");
        sendHtmlEmail(user.getEmail(), subject, html);
    }

    public void sendAccountApprovedEmail(com.example.zhanfinancebackend.modules.auth.entity.User user) {
        if (user.getEmail() == null || user.getEmail().isBlank()) return;

        String subject = "Аккаунт сотрудника подтвержден";
        String contentHtml = 
            "<p>Ваш аккаунт сотрудника был успешно подтвержден администратором.</p>" +
            "<div style=\"background-color: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #f3f4f6; margin: 16px 0;\">" +
            "  <p style=\"margin: 0;\">Теперь вы можете войти в рабочую систему и приступить к выполнению задач.</p>" +
            "</div>";

        String html = buildFormalEmailHtml("Подтверждение аккаунта", user.getFullName(), contentHtml, "Войти в систему", frontendUrl + "/login");
        sendHtmlEmail(user.getEmail(), subject, html);
    }

    public void sendTaskEditedByClientEmail(com.example.zhanfinancebackend.modules.auth.entity.User user, com.example.zhanfinancebackend.modules.crm.entity.Task task, com.example.zhanfinancebackend.modules.auth.entity.User client) {
        if (user.getEmail() == null || user.getEmail().isBlank()) return;

        String subject = "Клиент отредактировал задачу: " + task.getTitle();
        String contentHtml = String.format(
            "<p>Клиент внес изменения в параметры задачи.</p>" +
            "<div style=\"background-color: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #f3f4f6; margin: 16px 0;\">" +
            "  <ul style=\"margin: 0; padding-left: 20px;\">" +
            "    <li><b>Клиент:</b> %s</li>" +
            "    <li><b>Обновленная задача:</b> %s</li>" +
            "  </ul>" +
            "</div>",
            client != null ? client.getFullName() : "Клиент",
            task.getTitle()
        );

        String html = buildFormalEmailHtml("Обновление задачи клиентом", user.getFullName(), contentHtml, "Посмотреть задачу", frontendUrl);
        sendHtmlEmail(user.getEmail(), subject, html);
    }

    public void sendTaskDeletedByClientEmail(com.example.zhanfinancebackend.modules.auth.entity.User user, String taskTitle, com.example.zhanfinancebackend.modules.auth.entity.User client) {
        if (user.getEmail() == null || user.getEmail().isBlank()) return;

        String subject = "Клиент удалил задачу: " + taskTitle;
        String contentHtml = String.format(
            "<p>Обратите внимание, задача была отменена и удалена клиентом.</p>" +
            "<div style=\"background-color: #fef2f2; padding: 16px; border-radius: 8px; border: 1px solid #fee2e2; margin: 16px 0;\">" +
            "  <ul style=\"margin: 0; padding-left: 20px; color: #991b1b;\">" +
            "    <li><b>Клиент:</b> %s</li>" +
            "    <li><b>Удаленная задача:</b> %s</li>" +
            "  </ul>" +
            "</div>",
            client != null ? client.getFullName() : "Клиент",
            taskTitle
        );

        String html = buildFormalEmailHtml("Удаление задачи", user.getFullName(), contentHtml, null, null);
        sendHtmlEmail(user.getEmail(), subject, html);
    }
}