package com.example.zhanfinancebackend.modules.notifications.event;

import java.util.List;

public record SendHtmlEmailEvent(
        String to,
        String subject,
        String htmlBody,
        List<EmailAttachment> attachments
) {
    public SendHtmlEmailEvent(String to, String subject, String htmlBody) {
        this(to, subject, htmlBody, List.of());
    }
}
