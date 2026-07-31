package com.example.zhanfinancebackend.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TwoFactorVerifyRequest(
        @NotBlank(message = "Pre-auth token is required")
        String preAuthToken,

        @NotBlank(message = "Verification code is required")
        @Size(min = 6, max = 6, message = "Code must be 6 digits")
        String code
) {}
