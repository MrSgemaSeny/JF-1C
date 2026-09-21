package com.example.zhanfinancebackend.modules.telegram.dto;

import java.time.Instant;

public record TelegramNotificationDto(
        Long id,
        Long chatId,
        Long userId,
        String message,
        int attempts,
        Instant createdAt
) {}
