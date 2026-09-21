package com.example.zhanfinancebackend.modules.telegram.dto;

public record TelegramAckResponse(
        int acknowledgedCount,
        int processedCount,
        int successCount,
        int failedCount
) {
    public TelegramAckResponse(int count) {
        this(count, count, count, 0);
    }
}
