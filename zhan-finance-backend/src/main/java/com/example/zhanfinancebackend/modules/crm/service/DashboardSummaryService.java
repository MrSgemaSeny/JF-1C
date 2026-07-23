package com.example.zhanfinancebackend.modules.crm.service;

import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.crm.dto.WeeklySummaryDto;
import com.example.zhanfinancebackend.modules.crm.entity.StageType;
import com.example.zhanfinancebackend.modules.crm.entity.Task;
import com.example.zhanfinancebackend.modules.crm.repository.TaskRepository;
import com.example.zhanfinancebackend.modules.documents.repository.DocumentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.example.zhanfinancebackend.modules.auth.entity.Role;

@Service
public class DashboardSummaryService {

    private final TaskRepository taskRepository;
    private final DocumentRepository documentRepository;

    public DashboardSummaryService(TaskRepository taskRepository, DocumentRepository documentRepository) {
        this.taskRepository = taskRepository;
        this.documentRepository = documentRepository;
    }

    @Transactional(readOnly = true)
    public WeeklySummaryDto getWeeklySummary(User user) {
        List<Task> allTasks = taskRepository.findAllWithDetails();

        LocalDate now = LocalDate.now();
        LocalDate monday = now.with(DayOfWeek.MONDAY);

        int completedThisWeek = 0;
        int activeTasksCount = 0;
        int upcomingDeadlines = 0;
        long weeklyRevenue = 0;

        List<String> highlights = new ArrayList<>();

        for (Task t : allTasks) {
            if (user.getRole() == Role.CLIENT && t.getClient() != null && !t.getClient().getId().equals(user.getId())) {
                continue;
            }
            if (user.getRole() == Role.EMPLOYEE && t.getAssignedTo() != null && !t.getAssignedTo().getId().equals(user.getId())) {
                continue;
            }

            if (t.getStage() != null) {
                if (t.getStage().getType() == StageType.WON) {
                    if (t.getClosedAt() != null && !t.getClosedAt().isBefore(monday)) {
                        completedThisWeek++;
                        if (t.getAmount() != null) {
                            weeklyRevenue += t.getAmount().longValue();
                        }
                    }
                } else if (t.getStage().getType() == StageType.OPEN) {
                    activeTasksCount++;
                    if (t.getDueDate() != null && !t.getDueDate().isBefore(now) && !t.getDueDate().isAfter(now.plusDays(7))) {
                        upcomingDeadlines++;
                    }
                }
            }
        }

        int pendingDocs = (int) documentRepository.findAll().stream()
                .filter(d -> "AWAITING_SIGNATURE".equalsIgnoreCase(d.getStatus()) || "UPLOADED".equalsIgnoreCase(d.getStatus()))
                .count();

        highlights.add("Завершено задач на этой неделе: " + completedThisWeek);
        highlights.add("Задач в работе: " + activeTasksCount);
        if (upcomingDeadlines > 0) {
            highlights.add("Ближайших дедлайнов на неделе: " + upcomingDeadlines);
        }

        return new WeeklySummaryDto(
                completedThisWeek,
                activeTasksCount,
                upcomingDeadlines,
                pendingDocs,
                weeklyRevenue,
                highlights
        );
    }
}
