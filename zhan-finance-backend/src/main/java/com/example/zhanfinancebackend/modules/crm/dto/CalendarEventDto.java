package com.example.zhanfinancebackend.modules.crm.dto;

public record CalendarEventDto(
        String id,
        Long originalId,
        String type, // "EVENT" or "TASK"
        String date,
        String time,
        String title,
        String description,
        String color,
        boolean isCompleted
) {}
