package com.example.zhanfinancebackend.modules.auth.dto.user;

import com.example.zhanfinancebackend.modules.auth.entity.AuthProvider;
import com.example.zhanfinancebackend.modules.auth.entity.Role;

public record UserProfileDto(
        Long id,
        String email,
        String fullName,
        Role role,
        String phone,
        String companyName,
        String avatarUrl,
        AuthProvider authProvider,
        Long assignedEmployeeId,
        String assignedEmployeeName
) {}
