package com.example.zhanfinancebackend.modules.notifications.service;

import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.crm.entity.Task;
import com.example.zhanfinancebackend.modules.documents.entity.Document;
import com.example.zhanfinancebackend.modules.documents.service.StorageService;
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
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;

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
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            
            mailSender.send(message);
            log.info("Sent email to: {}", to);
        } catch (MailAuthenticationException e) {
            log.warn("Mocking email to {}. (SMTP authentication failed - skipping real email)", to);
        } catch (MessagingException e) {
            log.error("Failed to send email to: {}", to, e);
        } catch (Exception e) {
            log.error("Error sending email: ", e);
        }
    }

    /**
     * Master-шаблон. Табличная верстка гарантирует, что дизайн не развалится в десктопном Outlook.
     */
    public String buildFormalEmailHtml(String headerTitle, String recipientName, String contentHtml, String buttonText, String buttonUrl) {
        String buttonHtml = "";
        if (buttonText != null && buttonUrl != null && !buttonText.isBlank() && !buttonUrl.isBlank()) {
            buttonHtml = String.format(
                "<table width=\"100%%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin-top: 32px; margin-bottom: 8px;\">" +
                "  <tr><td align=\"center\">" +
                "    <a href=\"%s\" style=\"display: inline-block; padding: 14px 32px; background-color: #047857; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(4, 120, 87, 0.2);\">%s</a>" +
                "  </td></tr>" +
                "</table>",
                buttonUrl, buttonText
            );
        }

        String template = 
            "<!DOCTYPE html>" +
            "<html><head><meta charset=\"UTF-8\"></head>" +
            "<body style=\"margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;\">" +
            "  <table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"background-color: #f3f4f6; padding: 40px 20px;\">" +
            "    <tr><td align=\"center\">" +
            "      <table width=\"100%\" max-width=\"600\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);\">" +
            "        <tr><td style=\"background-color: #047857; padding: 32px 40px; text-align: center;\">" +
            "          <h1 style=\"color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 1px;\">Zhan Finance</h1>" +
            "        </td></tr>" +
            "        <tr><td style=\"padding: 40px;\">" +
            "          <h2 style=\"color: #111827; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 24px;\">{HEADER_TITLE}</h2>" +
            "          <p style=\"color: #374151; font-size: 16px; line-height: 24px; margin-top: 0; margin-bottom: 24px;\">Здравствуйте, <b style=\"color: #111827;\">{RECIPIENT_NAME}</b>!</p>" +
            "          {CONTENT_HTML}" +
            "          {BUTTON_HTML}" +
            "          <table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin-top: 32px; border-top: 1px solid #e5e7eb;\">" +
            "            <tr><td style=\"padding-top: 24px;\">" +
            "              <p style=\"font-size: 14px; color: #6b7280; line-height: 20px; margin: 0;\">С уважением,<br/><b style=\"color: #374151;\">Команда Zhan Finance</b></p>" +
            "            </td></tr>" +
            "          </table>" +
            "        </td></tr>" +
            "      </table>" +
            "    </td></tr>" +
            "  </table>" +
            "</body></html>";
            
        return template
            .replace("{HEADER_TITLE}", headerTitle != null ? headerTitle : "")
            .replace("{RECIPIENT_NAME}", recipientName != null ? recipientName : "")
            .replace("{CONTENT_HTML}", contentHtml != null ? contentHtml : "")
            .replace("{BUTTON_HTML}", buttonHtml != null ? buttonHtml : "");
    }

    @Async
    public void sendTaskAssignedEmail(User assignee, Task task) {
        if (assignee.getEmail() == null || assignee.getEmail().isBlank()) return;

        String subject = "Вам назначена новая задача: " + task.getTitle();
        String deadlineStr = task.getDueDate() != null ? task.getDueDate().format(DateTimeFormatter.ofPattern("dd.MM.yyyy")) : "Не указан";
        
        String contentHtml = String.format(
            "<p style=\"color: #4b5563; font-size: 16px; line-height: 24px; margin-top: 0; margin-bottom: 24px;\">Вам была назначена новая задача в рабочей системе.</p>" +
            "<table width=\"100%%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;\">" +
            "  <tr><td style=\"padding: 24px;\">" +
            "    <p style=\"color: #111827; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-top: 0; margin-bottom: 16px;\">Детали задачи</p>" +
            "    <table width=\"100%%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">" +
            "      <tr><td style=\"padding-bottom: 12px; color: #6b7280; font-size: 14px; width: 30%%;\">Название:</td><td style=\"padding-bottom: 12px; color: #111827; font-size: 15px; font-weight: 500;\">%s</td></tr>" +
            "      <tr><td style=\"padding-bottom: 12px; color: #6b7280; font-size: 14px;\">Клиент:</td><td style=\"padding-bottom: 12px; color: #111827; font-size: 15px; font-weight: 500;\">%s</td></tr>" +
            "      <tr><td style=\"padding-bottom: 12px; color: #6b7280; font-size: 14px;\">Дедлайн:</td><td style=\"padding-bottom: 12px; color: #111827; font-size: 15px; font-weight: 500;\">%s</td></tr>" +
            "      <tr><td style=\"color: #6b7280; font-size: 14px; vertical-align: top;\">Описание:</td><td style=\"color: #111827; font-size: 15px; font-weight: 500; line-height: 22px;\">%s</td></tr>" +
            "    </table>" +
            "  </td></tr>" +
            "</table>",
            task.getTitle(),
            task.getClient() != null ? task.getClient().getFullName() : "Не указан",
            deadlineStr,
            task.getDescription() != null && !task.getDescription().isBlank() ? task.getDescription() : "Отсутствует"
        );

        String html = buildFormalEmailHtml("Новая задача в системе", assignee.getFullName(), contentHtml, "Открыть задачу", frontendUrl);
        sendHtmlEmail(assignee.getEmail(), subject, html);
    }

    @Async
    public void sendTaskDeadlineAlertEmail(User user, Task task) {
        if (user.getEmail() == null || user.getEmail().isBlank()) return;

        String subject = "🚨 Приближается дедлайн по задаче: " + task.getTitle();
        String deadlineStr = task.getDueDate() != null ? task.getDueDate().format(DateTimeFormatter.ofPattern("dd.MM.yyyy")) : "Не указан";
        
        String contentHtml = String.format(
            "<p style=\"color: #4b5563; font-size: 16px; line-height: 24px; margin-top: 0; margin-bottom: 24px;\">Напоминаем, что срок выполнения задачи скоро истекает. Пожалуйста, проверьте статус выполнения.</p>" +
            "<table width=\"100%%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"background-color: #fef2f2; border-radius: 8px; border: 1px solid #fecaca;\">" +
            "  <tr><td style=\"padding: 24px;\">" +
            "    <p style=\"color: #991b1b; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-top: 0; margin-bottom: 16px;\">Параметры дедлайна</p>" +
            "    <table width=\"100%%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">" +
            "      <tr><td style=\"padding-bottom: 12px; color: #7f1d1d; font-size: 14px; width: 30%%;\">Задача:</td><td style=\"padding-bottom: 12px; color: #7f1d1d; font-size: 15px; font-weight: 600;\">%s</td></tr>" +
            "      <tr><td style=\"padding-bottom: 12px; color: #7f1d1d; font-size: 14px;\">Клиент:</td><td style=\"padding-bottom: 12px; color: #7f1d1d; font-size: 15px; font-weight: 600;\">%s</td></tr>" +
            "      <tr><td style=\"color: #7f1d1d; font-size: 14px;\">Дедлайн:</td><td style=\"color: #dc2626; font-size: 15px; font-weight: 700;\">%s</td></tr>" +
            "    </table>" +
            "  </td></tr>" +
            "</table>",
            task.getTitle(),
            task.getClient() != null ? task.getClient().getFullName() : "Не указан",
            deadlineStr
        );

        String html = buildFormalEmailHtml("Внимание: Горит Дедлайн!", user.getFullName(), contentHtml, "Посмотреть задачу", frontendUrl);
        sendHtmlEmail(user.getEmail(), subject, html);
    }

    @Async
    public void sendTaskStatusUpdatedEmail(User user, Task task, String oldStatus, String newStatus, String lostReason) {
        if (user.getEmail() == null || user.getEmail().isBlank()) return;

        String subject = "Обновлен статус задачи: " + task.getTitle();
        
        String lostReasonRow = (lostReason != null && !lostReason.isBlank()) 
            ? "<tr><td style=\"padding-top: 12px; color: #6b7280; font-size: 14px; vertical-align: top;\">Причина отмены:</td><td style=\"padding-top: 12px; color: #111827; font-size: 15px; font-weight: 500;\">" + lostReason + "</td></tr>"
            : "";

        String contentHtml = String.format(
            "<p style=\"color: #4b5563; font-size: 16px; line-height: 24px; margin-top: 0; margin-bottom: 24px;\">Статус вашей задачи был успешно изменен в системе.</p>" +
            "<table width=\"100%%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;\">" +
            "  <tr><td style=\"padding: 24px;\">" +
            "    <p style=\"color: #111827; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-top: 0; margin-bottom: 16px;\">Информация о статусе</p>" +
            "    <table width=\"100%%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">" +
            "      <tr><td style=\"padding-bottom: 12px; color: #6b7280; font-size: 14px; width: 40%%;\">Задача:</td><td style=\"padding-bottom: 12px; color: #111827; font-size: 15px; font-weight: 500;\">%s</td></tr>" +
            "      <tr><td style=\"padding-bottom: 12px; color: #6b7280; font-size: 14px;\">Предыдущий статус:</td><td style=\"padding-bottom: 12px; color: #4b5563; font-size: 15px;\">%s</td></tr>" +
            "      <tr><td style=\"color: #6b7280; font-size: 14px;\">Новый статус:</td><td style=\"color: #047857; font-size: 15px; font-weight: 700;\">%s</td></tr>" +
            "      %s" +
            "    </table>" +
            "  </td></tr>" +
            "</table>",
            task.getTitle(),
            oldStatus,
            newStatus,
            lostReasonRow
        );

        String html = buildFormalEmailHtml("Изменение статуса задачи", user.getFullName(), contentHtml, "Посмотреть задачу", frontendUrl);
        sendHtmlEmail(user.getEmail(), subject, html);
    }

    @Async
    public void sendTaskCompletedEmailWithDocuments(User user, Task task, List<Document> documents, StorageService storageService) {
        if (user.getEmail() == null || user.getEmail().isBlank()) return;

        String subject = "✅ Ваша задача успешно завершена: " + task.getTitle();
        
        String contentHtml = String.format(
            "<p style=\"color: #4b5563; font-size: 16px; line-height: 24px; margin-top: 0; margin-bottom: 24px;\">С радостью сообщаем, что работа по вашей задаче полностью завершена.</p>" +
            "<table width=\"100%%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"background-color: #ecfdf5; border-radius: 8px; border: 1px solid #a7f3d0;\">" +
            "  <tr><td style=\"padding: 24px;\">" +
            "    <p style=\"color: #065f46; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-top: 0; margin-bottom: 16px;\">Результат выполнения</p>" +
            "    <table width=\"100%%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">" +
            "      <tr><td style=\"padding-bottom: 12px; color: #047857; font-size: 14px; width: 30%%;\">Задача:</td><td style=\"padding-bottom: 12px; color: #065f46; font-size: 15px; font-weight: 600;\">%s</td></tr>" +
            "      <tr><td style=\"color: #047857; font-size: 14px;\">Документы:</td><td style=\"color: #065f46; font-size: 15px; font-weight: 600;\">Итоговые файлы прикреплены во вложении</td></tr>" +
            "    </table>" +
            "  </td></tr>" +
            "</table>",
            task.getTitle()
        );

        String html = buildFormalEmailHtml("Задача успешно выполнена!", user.getFullName(), contentHtml, "Перейти в личный кабинет", frontendUrl);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromAddress);
            helper.setTo(user.getEmail());
            helper.setSubject(subject);
            helper.setText(html, true);
            
            if (documents != null && !documents.isEmpty() && storageService != null) {
                for (Document doc : documents) {
                    try {
                        if (doc.getStorageKey() == null || doc.getStorageKey().isBlank()) {
                            log.warn("Document {} has no storageKey, skipping attachment", doc.getId());
                            continue;
                        }
                        byte[] fileData = storageService.loadAsBytes(doc.getStorageKey());
                        helper.addAttachment(doc.getFileName(), new ByteArrayResource(fileData));
                    } catch (Exception e) {
                        log.warn("Failed to attach document {} to email: {}", doc.getFileName(), e.getMessage());
                    }
                }
            }
            
            mailSender.send(message);
            log.info("Sent completed task email with documents to: {}", user.getEmail());
        } catch (MailAuthenticationException e) {
            log.warn("Mocking email to {}. (SMTP authentication failed - skipping real email)", user.getEmail());
        } catch (MessagingException e) {
            log.error("Failed to send email to: {}", user.getEmail(), e);
        } catch (Exception e) {
            log.error("Error sending email: ", e);
        }
    }

    @Async
    public void sendWelcomeEmail(User user) {
        if (user.getEmail() == null || user.getEmail().isBlank()) return;

        String subject = "Добро пожаловать в Zhan Finance";
        String contentHtml = 
            "<p style=\"color: #4b5563; font-size: 16px; line-height: 24px; margin-top: 0; margin-bottom: 24px;\">Вы успешно зарегистрировались в системе Zhan Finance.</p>" +
            "<table width=\"100%%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"background-color: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;\">" +
            "  <tr><td style=\"padding: 24px;\">" +
            "    <p style=\"color: #166534; font-size: 15px; line-height: 24px; margin: 0;\">Вам открыт доступ в личный кабинет для работы с бухгалтерскими и финансовыми услугами.</p>" +
            "  </td></tr>" +
            "</table>";

        String html = buildFormalEmailHtml("Добро пожаловать в Zhan Finance!", user.getFullName(), contentHtml, "Войти в личный кабинет", frontendUrl + "/login");
        sendHtmlEmail(user.getEmail(), subject, html);
    }

    @Async
    public void sendAccountApprovedEmail(User user) {
        if (user.getEmail() == null || user.getEmail().isBlank()) return;

        String subject = "Аккаунт сотрудника подтвержден";
        String contentHtml = 
            "<p style=\"color: #4b5563; font-size: 16px; line-height: 24px; margin-top: 0; margin-bottom: 24px;\">Ваш аккаунт сотрудника был успешно подтвержден администратором.</p>" +
            "<table width=\"100%%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;\">" +
            "  <tr><td style=\"padding: 24px;\">" +
            "    <p style=\"color: #374151; font-size: 15px; line-height: 24px; margin: 0;\">Теперь вы можете войти в рабочую систему и приступить к выполнению задач.</p>" +
            "  </td></tr>" +
            "</table>";

        String html = buildFormalEmailHtml("Подтверждение аккаунта", user.getFullName(), contentHtml, "Войти в систему", frontendUrl + "/login");
        sendHtmlEmail(user.getEmail(), subject, html);
    }

    @Async
    public void sendTaskEditedByClientEmail(User user, Task task, User client) {
        if (user.getEmail() == null || user.getEmail().isBlank()) return;

        String subject = "Клиент отредактировал задачу: " + task.getTitle();
        String contentHtml = String.format(
            "<p style=\"color: #4b5563; font-size: 16px; line-height: 24px; margin-top: 0; margin-bottom: 24px;\">Клиент внес изменения в параметры задачи.</p>" +
            "<table width=\"100%%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"background-color: #f0f9ff; border-radius: 8px; border: 1px solid #bae6fd;\">" +
            "  <tr><td style=\"padding: 24px;\">" +
            "    <table width=\"100%%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">" +
            "      <tr><td style=\"padding-bottom: 12px; color: #0369a1; font-size: 14px; width: 30%%;\">Клиент:</td><td style=\"padding-bottom: 12px; color: #075985; font-size: 15px; font-weight: 600;\">%s</td></tr>" +
            "      <tr><td style=\"color: #0369a1; font-size: 14px;\">Обновленная задача:</td><td style=\"color: #075985; font-size: 15px; font-weight: 600;\">%s</td></tr>" +
            "    </table>" +
            "  </td></tr>" +
            "</table>",
            client != null ? client.getFullName() : "Клиент",
            task.getTitle()
        );

        String html = buildFormalEmailHtml("Обновление задачи клиентом", user.getFullName(), contentHtml, "Посмотреть задачу", frontendUrl);
        sendHtmlEmail(user.getEmail(), subject, html);
    }

    @Async
    public void sendTaskDeletedByClientEmail(User user, String taskTitle, User client) {
        if (user.getEmail() == null || user.getEmail().isBlank()) return;

        String subject = "Клиент удалил задачу: " + taskTitle;
        String contentHtml = String.format(
            "<p style=\"color: #4b5563; font-size: 16px; line-height: 24px; margin-top: 0; margin-bottom: 24px;\">Обратите внимание, задача была отменена и удалена клиентом.</p>" +
            "<table width=\"100%%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"background-color: #fef2f2; border-radius: 8px; border: 1px solid #fecaca;\">" +
            "  <tr><td style=\"padding: 24px;\">" +
            "    <table width=\"100%%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">" +
            "      <tr><td style=\"padding-bottom: 12px; color: #991b1b; font-size: 14px; width: 30%%;\">Клиент:</td><td style=\"padding-bottom: 12px; color: #7f1d1d; font-size: 15px; font-weight: 600;\">%s</td></tr>" +
            "      <tr><td style=\"color: #991b1b; font-size: 14px;\">Удаленная задача:</td><td style=\"color: #7f1d1d; font-size: 15px; font-weight: 600;\">%s</td></tr>" +
            "    </table>" +
            "  </td></tr>" +
            "</table>",
            client != null ? client.getFullName() : "Клиент",
            taskTitle
        );

        String html = buildFormalEmailHtml("Удаление задачи", user.getFullName(), contentHtml, null, null);
        sendHtmlEmail(user.getEmail(), subject, html);
    }

    @Async
    public void sendDocumentAttachedEmail(User user, Document document, Task task) {
        if (user.getEmail() == null || user.getEmail().isBlank()) return;

        String subject = "Новый документ: " + document.getFileName();
        
        String taskInfo = task != null 
            ? "<tr><td style=\"padding-bottom: 12px; color: #6b7280; font-size: 14px; width: 30%;\">Задача:</td><td style=\"padding-bottom: 12px; color: #111827; font-size: 15px; font-weight: 500;\">" + task.getTitle() + "</td></tr>"
            : "";

        String contentHtml = String.format(
            "<p style=\"color: #4b5563; font-size: 16px; line-height: 24px; margin-top: 0; margin-bottom: 24px;\">Сотрудник загрузил новый документ для вас.</p>" +
            "<table width=\"100%%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;\">" +
            "  <tr><td style=\"padding: 24px;\">" +
            "    <table width=\"100%%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">" +
            "      %s" +
            "      <tr><td style=\"padding-bottom: 12px; color: #6b7280; font-size: 14px; width: 30%%;\">Файл:</td><td style=\"padding-bottom: 12px; color: #111827; font-size: 15px; font-weight: 500;\">%s</td></tr>" +
            "    </table>" +
            "  </td></tr>" +
            "</table>",
            taskInfo,
            document.getFileName()
        );

        String html = buildFormalEmailHtml("Новый документ", user.getFullName(), contentHtml, "Перейти в личный кабинет", frontendUrl + "/client");
        sendHtmlEmail(user.getEmail(), subject, html);
    }
}