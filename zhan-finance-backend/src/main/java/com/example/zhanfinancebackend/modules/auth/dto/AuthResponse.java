package com.example.zhanfinancebackend.modules.auth.dto;

import com.example.zhanfinancebackend.modules.auth.entity.Role;

import com.example.zhanfinancebackend.modules.auth.entity.AuthProvider;

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
        AuthProvider authProvider,
        String locale
) {}