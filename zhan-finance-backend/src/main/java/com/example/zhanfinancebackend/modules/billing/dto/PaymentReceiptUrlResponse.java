package com.example.zhanfinancebackend.modules.billing.dto;

public record PaymentReceiptUrlResponse(
        String url,
        long expiresInSeconds
) {}
