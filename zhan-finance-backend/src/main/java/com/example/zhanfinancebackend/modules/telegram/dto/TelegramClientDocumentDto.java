package com.example.zhanfinancebackend.modules.telegram.dto;

import java.time.Instant;

public record TelegramClientDocumentDto(
        Long id,
        String fileName,
        String contentType,
        Long fileSize,
        String status,
        Instant createdAt
) {}
