package com.example.zhanfinancebackend.modules.landing.dto;

import com.example.zhanfinancebackend.modules.crm.dto.TaskDto;

public record ContactRequestConvertResponse(
        TaskDto task,
        String generatedPassword
) {}
