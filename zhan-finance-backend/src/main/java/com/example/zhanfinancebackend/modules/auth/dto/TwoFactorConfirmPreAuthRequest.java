package com.example.zhanfinancebackend.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record TwoFactorConfirmPreAuthRequest(
        @NotBlank(message = "Pre-auth token is required")
        String preAuthToken,

        @NotBlank(message = "Secret is required")
        String secret,

        @NotBlank(message = "Code is required")
        @Pattern(regexp = "^\\d{6}$", message = "Code must be 6 digits")
        String code
) {
}
