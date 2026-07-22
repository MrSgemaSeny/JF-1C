package com.example.zhanfinancebackend.modules.crm.dto;

import java.util.Map;

public record EmployeeDashboardDto(
        long totalClients,
        long totalTasks,
        Map<String, Long> tasksByStatus,
        double avgCompletionDays
) {
}
