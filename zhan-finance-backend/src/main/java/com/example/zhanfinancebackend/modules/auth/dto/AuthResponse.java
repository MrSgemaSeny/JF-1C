package com.example.zhanfinancebackend.modules.auth.dto;

import com.example.zhanfinancebackend.modules.auth.entity.Role;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        Long id,
        String email,
        String fullName,
        Role role,
        boolean isNewUser,
        String avatarUrl,
        com.example.zhanfinancebackend.modules.auth.entity.AuthProvider authProvider
) {}