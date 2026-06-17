package com.example.zhanfinancebackend.modules.user.dto;

public record UserProfileDto(
        Long userId,
        String fullName,
        String email,
        String phone,
        String companyName
) {
}
