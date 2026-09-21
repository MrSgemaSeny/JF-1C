package com.example.zhanfinancebackend.modules.telegram.dto;

public record TelegramAckItemDto(
        Long id,
        String status,
        Boolean success,
        String error
) {}
