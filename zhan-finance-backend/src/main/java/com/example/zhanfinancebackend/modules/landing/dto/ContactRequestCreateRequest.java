package com.example.zhanfinancebackend.modules.landing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ContactRequestCreateRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(max = 40) String phone,
        @Size(max = 600) String message,
        @Size(max = 80) String source
) {
}
