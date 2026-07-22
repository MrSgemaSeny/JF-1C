package com.example.zhanfinancebackend.modules.crm.dto;

import com.example.zhanfinancebackend.modules.crm.entity.StageType;

public record StageUpdateRequest(
        String name,
        String nameEn,
        String color,
        StageType type,
        Boolean isPreFinal,
        Integer orderIndex
) {}
