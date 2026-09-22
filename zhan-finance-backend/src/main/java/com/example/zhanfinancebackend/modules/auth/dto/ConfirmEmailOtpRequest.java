package com.example.zhanfinancebackend.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record ConfirmEmailOtpRequest(
        @NotBlank(message = "preAuthToken is required")
        String preAuthToken,

        @NotBlank(message = "otpCode is required")
        String otpCode
) {
}
