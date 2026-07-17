package com.example.zhanfinancebackend.modules.landing.dto;

public record ContactRequestFileDto(
        Long id,
        String fileName,
        String contentType,
        Long fileSize
) {}
