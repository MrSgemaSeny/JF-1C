package com.example.zhanfinancebackend.modules.crm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public record CalendarEventCreateRequest(
        @NotNull(message = "Date is required")
        LocalDate date,
        
        LocalTime time,
        
        @NotBlank(message = "Title is required")
        String title,
        
        String description,
        String color
) {}
