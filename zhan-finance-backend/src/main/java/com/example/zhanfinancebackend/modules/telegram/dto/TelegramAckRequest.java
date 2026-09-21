package com.example.zhanfinancebackend.modules.telegram.dto;

import java.util.List;

public record TelegramAckRequest(
        List<TelegramAckItemDto> processed,
        List<TelegramAckItemDto> results
) {
    public List<TelegramAckItemDto> getItems() {
        if (processed != null && !processed.isEmpty()) {
            return processed;
        }
        if (results != null && !results.isEmpty()) {
            return results;
        }
        return List.of();
    }
}
