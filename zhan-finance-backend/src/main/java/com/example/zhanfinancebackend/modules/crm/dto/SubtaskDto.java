package com.example.zhanfinancebackend.modules.crm.dto;

import com.example.zhanfinancebackend.modules.crm.entity.SubtaskStatus;
import java.time.ZonedDateTime;

public record SubtaskDto(
        Long id,
        Long taskId,
        String title,
        SubtaskStatus status,
        ZonedDateTime createdAt
) {}
