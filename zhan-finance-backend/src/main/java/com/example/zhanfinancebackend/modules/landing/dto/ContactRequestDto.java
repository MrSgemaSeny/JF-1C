package com.example.zhanfinancebackend.modules.landing.dto;

import com.example.zhanfinancebackend.modules.landing.entity.ContactRequest.ContactRequestStatus;

import java.time.Instant;

public record ContactRequestDto(
        Long id,
        String name,
        String phone,
        String message,
        String source,
        ContactRequestStatus status,
        Instant createdAt,
        Instant updatedAt
) {
}
