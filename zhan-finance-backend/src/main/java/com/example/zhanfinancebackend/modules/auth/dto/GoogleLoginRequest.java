package com.example.zhanfinancebackend.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;

import com.example.zhanfinancebackend.modules.auth.entity.Role;

public record GoogleLoginRequest(
        @NotBlank String credential,
        Role role
) {
}
