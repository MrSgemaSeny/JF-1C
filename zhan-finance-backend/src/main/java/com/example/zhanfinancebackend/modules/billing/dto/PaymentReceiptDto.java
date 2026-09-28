package com.example.zhanfinancebackend.modules.billing.dto;

import com.example.zhanfinancebackend.modules.billing.entity.PaymentReceiptStatus;

import java.math.BigDecimal;
import java.time.Instant;

public record PaymentReceiptDto(
        Long id,
        Long clientId,
        String clientName,
        String clientEmail,
        Long subscriptionId,
        String planName,
        Long invoiceId,
        String invoiceTitle,
        BigDecimal amount,
        String currency,
        String receiptFileKey,
        PaymentReceiptStatus status,
        Long reviewedById,
        String reviewedByName,
        Instant reviewedAt,
        String rejectNote,
        Instant createdAt,
        Instant updatedAt
) {}
