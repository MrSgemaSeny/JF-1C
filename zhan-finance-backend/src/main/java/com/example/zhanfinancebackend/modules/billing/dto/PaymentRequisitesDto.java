package com.example.zhanfinancebackend.modules.billing.dto;

public record PaymentRequisitesDto(
        String recipientName,
        String bin,
        String iban,
        String kbe,
        String bankName
) {}
