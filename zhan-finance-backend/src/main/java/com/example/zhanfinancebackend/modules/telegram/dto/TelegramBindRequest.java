package com.example.zhanfinancebackend.modules.telegram.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record TelegramBindRequest(
        @NotBlank String token,
        @NotNull Long chatId,
        String telegramUsername,
        String firstName,
        String lastName
) {}
