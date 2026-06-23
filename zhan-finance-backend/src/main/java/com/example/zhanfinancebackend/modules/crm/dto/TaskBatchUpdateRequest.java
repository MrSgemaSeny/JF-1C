package com.example.zhanfinancebackend.modules.crm.dto;

import java.util.List;

public record TaskBatchUpdateRequest(
        List<TaskDto> updates
) {}
