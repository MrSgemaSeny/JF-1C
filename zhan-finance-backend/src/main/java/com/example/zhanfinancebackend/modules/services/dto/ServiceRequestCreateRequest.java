package com.example.zhanfinancebackend.modules.services.dto;

import jakarta.validation.constraints.NotNull;

public record ServiceRequestCreateRequest(
        @NotNull Long serviceId,
        String message,
        java.time.LocalDate preferredContactDate
) {}
