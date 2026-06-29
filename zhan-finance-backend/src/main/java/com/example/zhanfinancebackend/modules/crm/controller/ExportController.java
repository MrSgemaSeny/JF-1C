package com.example.zhanfinancebackend.modules.crm.controller;

import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.security.UserPrincipal;
import com.example.zhanfinancebackend.modules.crm.dto.TaskDto;
import com.example.zhanfinancebackend.modules.crm.service.TaskService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/crm/export")
public class ExportController {

    private final TaskService taskService;

    public ExportController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping("/tasks")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public ResponseEntity<byte[]> exportTasks(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) Long clientId,
            @RequestParam(required = false) Long assignedToId,
            @RequestParam(required = false) String status
    ) {
        User user = principal.getUser();
        List<TaskDto> tasks;

        if (user.getRole() == Role.ADMIN) {
            tasks = taskService.getAllTasks(clientId, assignedToId, status);
        } else {
            tasks = taskService.getTasksForEmployee(user);
        }

        StringBuilder csvBuilder = new StringBuilder();
        // BOM for Excel to recognize UTF-8
        csvBuilder.append('\ufeff');
        csvBuilder.append("ID,Название,Клиент,Исполнитель,Статус,Приоритет,Дедлайн,Создана\n");

        for (TaskDto t : tasks) {
            csvBuilder.append(t.id()).append(",")
                    .append("\"").append(t.title() != null ? t.title().replace("\"", "\"\"") : "").append("\",")
                    .append("\"").append(t.client() != null ? t.client().fullName() : "").append("\",")
                    .append("\"").append(t.assignedTo() != null ? t.assignedTo().fullName() : "Не назначен").append("\",")
                    .append(t.status()).append(",")
                    .append(t.priority()).append(",")
                    .append(t.dueDate() != null ? t.dueDate().toString() : "").append(",")
                    .append(t.createdAt() != null ? t.createdAt().toLocalDate().toString() : "")
                    .append("\n");
        }

        byte[] csvBytes = csvBuilder.toString().getBytes(StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"tasks_export.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=utf-8"))
                .body(csvBytes);
    }
}
