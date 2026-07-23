package com.example.zhanfinancebackend.modules.crm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserLabelCreateRequest(
        @NotBlank @Size(max = 64) String name,
        @NotBlank @Size(max = 32) String color
) {}
