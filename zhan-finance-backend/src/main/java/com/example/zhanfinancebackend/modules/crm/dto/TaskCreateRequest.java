package com.example.zhanfinancebackend.modules.crm.dto;

import com.example.zhanfinancebackend.modules.crm.entity.TaskPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record TaskCreateRequest(
        @NotBlank String title,
        String description,
        @NotNull Long clientId,
        Long assignedToId,
        TaskPriority priority,
        LocalDate dueDate,
        List<SubtaskCreateRequest> subtasks
) {
}
