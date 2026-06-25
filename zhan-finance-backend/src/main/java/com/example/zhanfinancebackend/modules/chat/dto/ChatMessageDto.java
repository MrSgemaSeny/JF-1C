package com.example.zhanfinancebackend.modules.chat.dto;

import java.time.Instant;

public record ChatMessageDto(
        Long id,
        Long senderId,
        Long receiverId,
        String content,
        Instant createdAt,
        boolean isRead,
        boolean isDeleted
) {}
