package com.example.zhanfinancebackend.modules.auth.dto.user;

public record UpdateProfileRequest(
        String fullName,
        String phone,
        String companyName
) {}
