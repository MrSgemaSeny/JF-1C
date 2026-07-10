package com.example.zhanfinancebackend.modules.crm.dto;

import com.example.zhanfinancebackend.modules.crm.entity.StageType;

public record StageDto(
        Long id,
        Long pipelineId,
        String name,
        Integer orderIndex,
        String color,
        StageType type,
        boolean isDefault
) {
}
