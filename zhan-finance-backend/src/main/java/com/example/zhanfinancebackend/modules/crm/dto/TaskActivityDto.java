package com.example.zhanfinancebackend.modules.crm.dto;

import com.example.zhanfinancebackend.modules.auth.dto.UserDto;
import java.time.ZonedDateTime;

public record TaskActivityDto(
        Long id,
        Long taskId,
        UserDto actor,
        String actionText,
        ZonedDateTime createdAt
) {}
