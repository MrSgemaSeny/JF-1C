package com.example.zhanfinancebackend.modules.auth.dto.user;

public record UpdatePasswordRequest(
        String currentPassword,
        String newPassword
) {}
