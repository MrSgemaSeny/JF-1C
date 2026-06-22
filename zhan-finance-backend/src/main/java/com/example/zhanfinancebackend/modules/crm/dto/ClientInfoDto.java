package com.example.zhanfinancebackend.modules.crm.dto;

public record ClientInfoDto(
        Long id,
        String fullName,
        String email,
        String companyName
) {
}
