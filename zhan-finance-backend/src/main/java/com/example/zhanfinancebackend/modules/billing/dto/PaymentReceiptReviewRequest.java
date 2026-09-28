package com.example.zhanfinancebackend.modules.billing.dto;

import jakarta.validation.constraints.Size;

public record PaymentReceiptReviewRequest(
        @Size(max = 1000, message = "Reject note must not exceed 1000 characters")
        String note
) {}
