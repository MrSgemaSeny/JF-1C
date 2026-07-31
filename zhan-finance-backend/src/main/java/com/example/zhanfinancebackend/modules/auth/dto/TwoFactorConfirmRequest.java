package com.example.zhanfinancebackend.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TwoFactorConfirmRequest(
        @NotBlank(message = "Secret is required")
        String secret,

        @NotBlank(message = "Code is required")
        @Size(min = 6, max = 6, message = "Code must be 6 digits")
        String code
) {}
