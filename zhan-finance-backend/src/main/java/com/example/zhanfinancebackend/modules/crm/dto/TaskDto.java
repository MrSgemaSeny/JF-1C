package com.example.zhanfinancebackend.modules.crm.dto;

import com.example.zhanfinancebackend.modules.auth.dto.UserDto;
import com.example.zhanfinancebackend.modules.crm.entity.TaskPriority;
import com.example.zhanfinancebackend.modules.crm.entity.TaskStatus;

import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.List;

public record TaskDto(
        Long id,
        String title,
        String description,
        Long clientId,
        ClientInfoDto client,
        Long assignedToId,
        EmployeeInfoDto assignedTo,
        TaskStatus status,
        TaskPriority priority,
        LocalDate dueDate,
        UserDto createdBy,
        ZonedDateTime createdAt,
        ZonedDateTime updatedAt,
        List<SubtaskDto> subtasks
) {
}
