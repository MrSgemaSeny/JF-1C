package com.example.zhanfinancebackend.modules.crm.dto;

import java.util.List;

public record TaskBatchOperationRequest(
        List<Long> taskIds,
        Long stageId,
        Long assignedToId,
        Long labelId
) {}
