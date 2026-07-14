package com.example.zhanfinancebackend.modules.crm.dto;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;

public record TaskBatchUpdateRequest(
        @NotEmpty List<TaskDto> updates
) {}
