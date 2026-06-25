package com.example.zhanfinancebackend.modules.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import com.example.zhanfinancebackend.modules.auth.entity.Role;

public record RegisterRequest(
        @NotBlank @Size(max = 120) String fullName,
        @NotBlank @Email @Size(max = 160) String email,
        @NotBlank 
        @Size(min = 8, max = 120, message = "Пароль должен содержать минимум 8 символов") 
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).*$", message = "Пароль должен содержать хотя бы одну букву и одну цифру")
        String password,
        Role role,
        @Size(max = 32) String phone,
        @Size(max = 255) String companyName
) {
}
