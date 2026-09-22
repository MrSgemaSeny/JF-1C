package com.example.zhanfinancebackend.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record GoogleLinkRequest(
        @NotBlank(message = "credential is required")
        String credential
) {
}
