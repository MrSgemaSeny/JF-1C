package com.example.zhanfinancebackend.modules.crm.dto;

import com.example.zhanfinancebackend.modules.auth.dto.UserDto;

import java.time.ZonedDateTime;

public record ClientDto(
        Long id,
        UserDto user,
        String companyName,
        String phone,
        String notes,
        ZonedDateTime createdAt,
        ZonedDateTime updatedAt
) {
}
