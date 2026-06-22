package com.example.zhanfinancebackend.modules.crm.dto;

import java.time.ZonedDateTime;

public record EmployeeDto(
        Long id,
        String fullName,
        String email,
        String role,
        ZonedDateTime createdAt
) {
}
