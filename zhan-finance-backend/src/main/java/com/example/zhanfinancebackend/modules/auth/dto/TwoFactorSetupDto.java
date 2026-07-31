package com.example.zhanfinancebackend.modules.auth.dto;

public record TwoFactorSetupDto(
        String secret,
        String qrCodeImage,
        String uri
) {}
