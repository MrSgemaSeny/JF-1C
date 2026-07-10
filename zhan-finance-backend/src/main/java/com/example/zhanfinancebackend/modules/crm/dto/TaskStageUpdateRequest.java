package com.example.zhanfinancebackend.modules.crm.dto;

import jakarta.validation.constraints.NotNull;

public record TaskStageUpdateRequest(
        @NotNull Long stageId
) {
}
