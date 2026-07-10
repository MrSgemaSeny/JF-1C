package com.example.zhanfinancebackend.modules.crm.dto;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record TaskCreateRequest(
        @NotBlank String title,
        String description,
        @NotNull Long clientId,
        Long assignedToId,
        LocalDate dueDate,
        List<SubtaskCreateRequest> subtasks,
        List<Long> serviceIds
) {
}
