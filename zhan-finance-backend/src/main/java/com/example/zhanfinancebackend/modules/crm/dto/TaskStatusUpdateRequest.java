package com.example.zhanfinancebackend.modules.crm.dto;

import com.example.zhanfinancebackend.modules.crm.entity.TaskStatus;
import jakarta.validation.constraints.NotNull;

public record TaskStatusUpdateRequest(
        @NotNull TaskStatus status
) {
}
