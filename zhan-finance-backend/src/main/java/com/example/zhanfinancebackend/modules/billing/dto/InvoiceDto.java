package com.example.zhanfinancebackend.modules.billing.dto;

import com.example.zhanfinancebackend.modules.billing.entity.Invoice.InvoiceStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record InvoiceDto(
        Long id,
        @NotBlank @Size(max = 160) String title,
        @NotNull @DecimalMin("0.00") BigDecimal amount,
        InvoiceStatus status,
        @NotNull LocalDate dueDate
) {
}
