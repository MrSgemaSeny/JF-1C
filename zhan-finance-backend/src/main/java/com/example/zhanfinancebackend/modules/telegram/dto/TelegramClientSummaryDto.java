package com.example.zhanfinancebackend.modules.telegram.dto;

public record TelegramClientSummaryDto(
        boolean linked,
        Long userId,
        String fullName,
        String email,
        String phone,
        String companyName,
        String role
) {}
