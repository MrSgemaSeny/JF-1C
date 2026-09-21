package com.example.zhanfinancebackend.modules.telegram.dto;

import java.time.Instant;

public record TelegramLinkStatusResponse(
        boolean linked,
        Long chatId,
        String telegramUsername,
        Instant linkedAt
) {}
