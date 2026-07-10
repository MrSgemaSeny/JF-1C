package com.example.zhanfinancebackend.modules.crm.dto;

import java.util.List;

public record PipelineDto(
        Long id,
        String name,
        boolean isDefault,
        List<StageDto> stages
) {
}
