package com.example.zhanfinancebackend.modules.auth.dto;

import com.example.zhanfinancebackend.modules.auth.entity.AuthProvider;

public record CheckEmailResponse(
    boolean exists,
    AuthProvider provider
) {}
