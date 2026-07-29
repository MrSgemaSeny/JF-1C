package com.example.zhanfinancebackend.modules.courses.dto;

import java.time.LocalDateTime;

public record CertificateDto(
        Long id,
        String certificateCode,
        Long userId,
        String userName,
        Long courseId,
        String courseTitle,
        LocalDateTime issuedAt
) {}
