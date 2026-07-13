package com.example.zhanfinancebackend.modules.crm.dto;

import java.util.List;
import java.util.Map;

public record AdminDashboardDto(
        long totalClients,
        long totalEmployees,
        long totalTasks,
        long wonTasks,
        long lostTasks,
        double avgCompletionDays,
        Map<String, Long> tasksByStatus,
        Map<String, Long> tasksByLostReason,
        long totalUsers,
        List<EmployeeStatsDto> employeeStats
) {
}

