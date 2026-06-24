package com.example.zhanfinancebackend.modules.crm.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record TaskRequestCreateRequest(
        @NotBlank String title,
        String description,
        Long clientId,
        LocalDate dueDate
) {
}
