package com.example.zhanfinancebackend.modules.auth.dto;

import com.example.zhanfinancebackend.modules.auth.entity.AuthProvider;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.fasterxml.jackson.annotation.JsonIgnore;

public record AuthResponse(
        String accessToken,
        @JsonIgnore String refreshToken,
        String tokenType,
        Long id,
        String email,
        String fullName,
        Role role,
        boolean isNewUser,
        String avatarUrl,
        AuthProvider authProvider,
        String locale,
        Boolean requires2FA,
        String preAuthToken,
        Boolean twoFactorEnabled,
        Boolean isPendingApproval,
        Boolean requiresEmailOtp,
        Boolean googleLinked,
        String googleEmail
) {
    public AuthResponse(
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
    ) {
        this(accessToken, refreshToken, tokenType, id, email, fullName, role, isNewUser, avatarUrl, authProvider, locale, false, null, false, false, false, false, null);
    }

    public static AuthResponse requires2FA(String preAuthToken) {
        return new AuthResponse(null, null, null, null, null, null, null, false, null, null, null, true, preAuthToken, false, false, false, false, null);
    }

    public static AuthResponse requiresEmailOtp(String preAuthToken, String email) {
        return new AuthResponse(null, null, null, null, email, null, null, false, null, null, null, false, preAuthToken, false, false, true, false, null);
    }
}