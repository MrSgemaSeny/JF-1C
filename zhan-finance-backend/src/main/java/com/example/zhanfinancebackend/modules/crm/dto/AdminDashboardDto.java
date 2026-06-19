package com.example.zhanfinancebackend.modules.crm.dto;

import java.util.Map;

public record AdminDashboardDto(
        long totalClients,
        long totalEmployees,
        long totalTasks,
        Map<String, Long> tasksByStatus
) {
}
