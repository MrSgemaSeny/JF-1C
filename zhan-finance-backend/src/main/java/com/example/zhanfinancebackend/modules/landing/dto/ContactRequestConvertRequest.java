package com.example.zhanfinancebackend.modules.landing.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record ContactRequestConvertRequest(
        @NotBlank @Email String email,
        @NotEmpty List<Long> serviceIds
) {}
