package com.example.zhanfinancebackend.modules.crm.dto;

import com.example.zhanfinancebackend.modules.auth.dto.UserDto;
import java.time.ZonedDateTime;

public record TaskCommentDto(
        Long id,
        Long taskId,
        UserDto author,
        String text,
        ZonedDateTime createdAt
) {}
