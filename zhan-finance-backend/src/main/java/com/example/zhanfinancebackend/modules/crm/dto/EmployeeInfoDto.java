package com.example.zhanfinancebackend.modules.crm.dto;

public record EmployeeInfoDto(
        Long id,
        String fullName,
        String email,
        String avatarUrl
) {
}
