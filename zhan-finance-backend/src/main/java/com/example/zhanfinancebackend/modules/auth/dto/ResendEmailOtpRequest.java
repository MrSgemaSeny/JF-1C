package com.example.zhanfinancebackend.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record ResendEmailOtpRequest(
        @NotBlank(message = "preAuthToken is required")
        String preAuthToken
) {
}
