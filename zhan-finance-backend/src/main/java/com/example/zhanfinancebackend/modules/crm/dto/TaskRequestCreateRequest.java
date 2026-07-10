package com.example.zhanfinancebackend.modules.crm.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.util.List;

public record TaskRequestCreateRequest(
        @NotBlank String title,
        String description,
        Long clientId,
        LocalDate dueDate,
        List<SubtaskCreateRequest> subtasks,
        List<Long> serviceIds
) {
}
