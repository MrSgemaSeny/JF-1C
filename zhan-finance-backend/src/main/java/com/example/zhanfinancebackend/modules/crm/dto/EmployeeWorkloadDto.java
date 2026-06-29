package com.example.zhanfinancebackend.modules.crm.dto;

public record EmployeeWorkloadDto(
        Long employeeId,
        String fullName,
        String email,
        int activeTasksCount
) {
}
