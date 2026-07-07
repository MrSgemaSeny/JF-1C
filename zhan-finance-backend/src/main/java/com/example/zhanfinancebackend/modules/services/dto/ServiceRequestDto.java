package com.example.zhanfinancebackend.modules.services.dto;

import java.time.ZonedDateTime;

public record ServiceRequestDto(
        Long id,
        Long serviceId,
        String serviceTitle,
        String clientMessage,
        java.time.LocalDate preferredContactDate,
        String status,
        Long assignedEmployeeId,
        Long taskId,
        ZonedDateTime createdAt
) {}
