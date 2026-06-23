package com.example.zhanfinancebackend.modules.crm.dto;

import com.example.zhanfinancebackend.modules.crm.entity.SubtaskStatus;
import jakarta.validation.constraints.NotBlank;

public record SubtaskCreateRequest(
        Long id, // Optional, if updating existing
        @NotBlank(message = "Subtask title is required")
        String title,
        SubtaskStatus status
) {}
