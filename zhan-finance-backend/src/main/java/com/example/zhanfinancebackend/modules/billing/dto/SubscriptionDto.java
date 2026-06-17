package com.example.zhanfinancebackend.modules.billing.dto;

import com.example.zhanfinancebackend.modules.billing.entity.Subscription.SubscriptionStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SubscriptionDto(
        Long id,
        @NotBlank @Size(max = 120) String planName,
        @NotNull @DecimalMin("0.00") BigDecimal monthlyPrice,
        SubscriptionStatus status,
        @NotNull LocalDate startsAt,
        LocalDate endsAt
) {
}
