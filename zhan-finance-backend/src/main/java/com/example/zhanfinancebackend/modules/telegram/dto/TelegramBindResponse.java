package com.example.zhanfinancebackend.modules.telegram.dto;

public record TelegramBindResponse(
        boolean success,
        Long userId,
        String fullName,
        String email,
        String role
) {}
