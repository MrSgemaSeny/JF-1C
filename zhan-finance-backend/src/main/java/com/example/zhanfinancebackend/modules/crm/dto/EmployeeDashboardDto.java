package com.example.zhanfinancebackend.modules.crm.dto;

import java.util.List;
import java.util.Map;

public record EmployeeDashboardDto(
        long totalClients,
        long totalTasks,
        Map<String, Long> tasksByStatus,
        double avgCompletionDays,
        List<TaskDto> urgentTasks,
        List<TaskDto> plannedTasks,
        List<TaskDto> recentHistory
) {
}
