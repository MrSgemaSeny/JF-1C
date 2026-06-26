package com.example.zhanfinancebackend.modules.crm.job;

import com.example.zhanfinancebackend.modules.notifications.service.EmailNotificationService;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.crm.entity.Task;
import com.example.zhanfinancebackend.modules.crm.entity.TaskStatus;
import com.example.zhanfinancebackend.modules.crm.repository.TaskRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

@Component
public class DeadlineAlertJob {

    private static final Logger logger = LoggerFactory.getLogger(DeadlineAlertJob.class);

    private final TaskRepository taskRepository;
    private final EmailNotificationService emailNotificationService;

    public DeadlineAlertJob(TaskRepository taskRepository, EmailNotificationService emailNotificationService) {
        this.taskRepository = taskRepository;
        this.emailNotificationService = emailNotificationService;
    }

    // Run every day at 9:00 AM server time
    @Scheduled(cron = "0 0 9 * * ?")
    public void checkDeadlines() {
        logger.info("Running deadline alert job...");
        
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        List<TaskStatus> excludedStatuses = Arrays.asList(TaskStatus.DONE, TaskStatus.CANCELLED);
        
        List<Task> dueTomorrowTasks = taskRepository.findByDueDateAndStatusNotIn(tomorrow, excludedStatuses);
        
        int count = 0;
        for (Task task : dueTomorrowTasks) {
            User employee = task.getClient().getAssignedEmployee();
            if (employee != null) {
                emailNotificationService.sendTaskDeadlineAlertEmail(employee, task);
                count++;
            }
        }
        
        logger.info("Sent {} deadline alert emails for tasks due tomorrow.", count);
    }
}
