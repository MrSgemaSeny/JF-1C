package com.example.zhanfinancebackend.modules.notifications.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import java.util.Map;

@Slf4j
@Service
public class TelegramNotifierService {

    private final RestClient restClient;
    private final String botToken;
    private final String adminChatId;

    public TelegramNotifierService(
            @Value("${telegram.business.bot.token:}") String botToken,
            @Value("${telegram.business.admin.chat-id:}") String adminChatId) {
        this.restClient = RestClient.create();
        this.botToken = botToken;
        this.adminChatId = adminChatId;
    }

    @Async("telegramExecutor")
    public void sendAdminNotificationAsync(String title, String message, String relativeLink) {
        if (botToken == null || botToken.isBlank() || adminChatId == null || adminChatId.isBlank()) {
            log.debug("Telegram credentials not configured, skipping notification.");
            return;
        }

        try {
            String url = "https://api.telegram.org/bot" + botToken + "/sendMessage";
            
            String text = "*" + escapeMarkdown(title) + "*\n\n" +
                          escapeMarkdown(message) + "\n\n" +
                          (relativeLink != null ? "[Перейти](" + escapeMarkdown(relativeLink) + ")" : "");

            Map<String, Object> body = Map.of(
                    "chat_id", adminChatId,
                    "text", text,
                    "parse_mode", "MarkdownV2"
            );

            restClient.post()
                    .uri(url)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
            
            log.info("Successfully sent Telegram notification to admin");

        } catch (Exception e) {
            log.error("Failed to send Telegram notification (title: {}). Reason: {}", title, e.getMessage());
            // TODO: In the future, once Sentry is re-enabled for Spring Boot 4.1.0, this error should be reported to Sentry.
        }
    }

    private String escapeMarkdown(String text) {
        if (text == null) return "";
        // Escape characters required by Telegram MarkdownV2
        return text.replaceAll("([_\\\\*\\[\\]()~`>#+\\-=|{}.!])", "\\\\$1");
    }
}
