package com.example.zhanfinancebackend.modules.crm.dto;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Future;

public record TaskCreateRequest(
        @NotBlank @Size(max = 255) String title,
        @Size(max = 5000) String description,
        @NotNull Long clientId,
        Long assignedToId,
        @Future LocalDate dueDate,
        List<SubtaskCreateRequest> subtasks,
        List<Long> serviceIds
) {
}
