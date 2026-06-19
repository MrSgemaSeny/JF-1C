package com.example.zhanfinancebackend.modules.auth.dto;

import com.example.zhanfinancebackend.modules.auth.entity.Role;

public record UserDto(
        Long id,
        String fullName,
        String email,
        Role role
) {
}
