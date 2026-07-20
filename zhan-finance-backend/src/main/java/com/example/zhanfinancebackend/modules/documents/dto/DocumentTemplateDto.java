package com.example.zhanfinancebackend.modules.documents.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record DocumentTemplateDto(
        UUID id,
        String name,
        String description,
        LocalDateTime createdAt,
        String createdByName
) {}
