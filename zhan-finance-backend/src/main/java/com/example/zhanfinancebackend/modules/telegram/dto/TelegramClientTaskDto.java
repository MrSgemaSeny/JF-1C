package com.example.zhanfinancebackend.modules.telegram.dto;

public record TelegramClientTaskDto(
        Long id,
        String title,
        String stageName,
        String stageType,
        String dueDate,
        String assignedEmployeeName
) {}
