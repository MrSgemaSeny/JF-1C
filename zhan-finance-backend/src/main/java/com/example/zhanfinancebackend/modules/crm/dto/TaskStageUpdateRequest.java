package com.example.zhanfinancebackend.modules.crm.dto;

import jakarta.validation.constraints.NotNull;

public record TaskStageUpdateRequest(
        @NotNull(message = "Stage ID is required")
        Long stageId,
        String lostReason
) {
}
