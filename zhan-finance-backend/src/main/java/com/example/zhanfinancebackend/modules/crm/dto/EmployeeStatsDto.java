package com.example.zhanfinancebackend.modules.crm.dto;

public record EmployeeStatsDto(
        Long employeeId,
        String employeeName,
        long activeTasks,
        long doneTasks,
        long overdueTasks
) {
}
