package com.example.zhanfinancebackend.modules.crm.dto;

import jakarta.validation.constraints.NotNull;

public record ClientCreateRequest(
        @NotNull Long userId,
        String companyName,
        String phone,
        String notes
) {
}
