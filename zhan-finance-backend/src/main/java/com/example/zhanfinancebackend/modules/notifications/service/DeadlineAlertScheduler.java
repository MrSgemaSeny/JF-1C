package com.example.zhanfinancebackend.modules.notifications.service;

import com.example.zhanfinancebackend.modules.crm.entity.Task;
import com.example.zhanfinancebackend.modules.crm.entity.StageType;
import com.example.zhanfinancebackend.modules.crm.repository.TaskRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class DeadlineAlertScheduler {

    private static final Logger log = LoggerFactory.getLogger(DeadlineAlertScheduler.class);
    private final TaskRepository taskRepository;
    private final EmailNotificationService emailNotificationService;

    public DeadlineAlertScheduler(TaskRepository taskRepository, EmailNotificationService emailNotificationService) {
        this.taskRepository = taskRepository;
        this.emailNotificationService = emailNotificationService;
    }

    // Run every day at 8:00 AM
    @Scheduled(cron = "0 0 8 * * *")
    public void checkDeadlines() {
        log.info("Checking task deadlines for today and tomorrow...");
        
        LocalDate today = LocalDate.now();
        LocalDate tomorrow = today.plusDays(1);
        
        List<StageType> excludedTypes = List.of(StageType.WON, StageType.LOST);
        
        List<Task> dueToday = taskRepository.findByDueDateAndStageTypeNotIn(today, excludedTypes);
        List<Task> dueTomorrow = taskRepository.findByDueDateAndStageTypeNotIn(tomorrow, excludedTypes);
        
        log.info("Found {} tasks due today, {} tasks due tomorrow.", dueToday.size(), dueTomorrow.size());
        
        for (Task task : dueToday) {
            if (task.getAssignedTo() != null) {
                emailNotificationService.sendTaskDeadlineAlertEmail(task.getAssignedTo(), task);
            }
        }
        
        for (Task task : dueTomorrow) {
            if (task.getAssignedTo() != null) {
                emailNotificationService.sendTaskDeadlineAlertEmail(task.getAssignedTo(), task);
            }
        }
    }
}
