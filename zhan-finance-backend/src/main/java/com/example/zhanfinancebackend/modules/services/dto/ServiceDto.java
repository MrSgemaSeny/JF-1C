package com.example.zhanfinancebackend.modules.services.dto;

import java.time.ZonedDateTime;
import java.util.List;

public record ServiceDto(
        Long id,
        String title,
        String titleEn,
        String description,
        String descriptionEn,
        String price,
        String imageUrl,
        Boolean isHighlighted,
        List<String> features,
        ZonedDateTime createdAt
) {}
