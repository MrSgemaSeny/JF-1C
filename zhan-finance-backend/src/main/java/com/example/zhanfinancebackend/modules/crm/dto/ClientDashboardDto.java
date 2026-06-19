package com.example.zhanfinancebackend.modules.crm.dto;

import java.util.Map;

public record ClientDashboardDto(
        long totalTasks,
        Map<String, Long> tasksByStatus
) {
}
