package com.example.zhanfinancebackend.modules.crm.dto;

import com.example.zhanfinancebackend.modules.auth.dto.UserDto;

import com.example.zhanfinancebackend.modules.services.dto.ServiceDto;

import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.List;

import java.math.BigDecimal;
import com.example.zhanfinancebackend.modules.crm.entity.LeadSource;

public record TaskDto(
        Long id,
        String title,
        String description,
        Long clientId,
        ClientInfoDto client,
        Long assignedToId,
        EmployeeInfoDto assignedTo,
        Long stageId,
        StageDto stage,
        BigDecimal amount,
        String currency,
        LeadSource source,
        LocalDate closedAt,
        String lostReason,
        LocalDate dueDate,
        UserDto createdBy,
        ZonedDateTime createdAt,
        ZonedDateTime updatedAt,
        List<SubtaskDto> subtasks,
        List<String> tags,
        List<Long> serviceIds,
        List<ServiceDto> services,
        boolean archived
) {
}
