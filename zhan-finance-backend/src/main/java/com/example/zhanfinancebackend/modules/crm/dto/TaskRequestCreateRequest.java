package com.example.zhanfinancebackend.modules.crm.dto;

import jakarta.validation.constraints.NotBlank;

public record TaskRequestCreateRequest(
        @NotBlank String title,
        String description
) {
}
