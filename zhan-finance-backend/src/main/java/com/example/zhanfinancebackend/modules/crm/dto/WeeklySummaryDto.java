package com.example.zhanfinancebackend.modules.crm.dto;

import java.util.List;

public record WeeklySummaryDto(
        int completedTasksThisWeek,
        int activeTasksCount,
        int upcomingDeadlinesCount,
        int pendingDocumentsCount,
        long totalRevenueThisWeek,
        List<String> topWeeklyHighlights
) {}
