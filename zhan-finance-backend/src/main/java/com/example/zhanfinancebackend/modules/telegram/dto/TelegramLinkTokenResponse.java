package com.example.zhanfinancebackend.modules.telegram.dto;

import java.time.Instant;

public record TelegramLinkTokenResponse(
        String token,
        String deepLink,
        Instant expiresAt
) {}
