package com.example.zhanfinancebackend.modules.crm.dto;

import com.example.zhanfinancebackend.modules.crm.entity.StageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record StageCreateRequest(
        @NotBlank String name,
        String nameEn,
        String color,
        @NotNull StageType type,
        boolean isPreFinal,
        Integer orderIndex,
        Integer slaHours
) {}
