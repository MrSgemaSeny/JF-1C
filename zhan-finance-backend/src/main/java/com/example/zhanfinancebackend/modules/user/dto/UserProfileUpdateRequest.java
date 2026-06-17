package com.example.zhanfinancebackend.modules.user.dto;

import jakarta.validation.constraints.Size;

public record UserProfileUpdateRequest(
        @Size(max = 120) String fullName,
        @Size(max = 40) String phone,
        @Size(max = 120) String companyName
) {
}
