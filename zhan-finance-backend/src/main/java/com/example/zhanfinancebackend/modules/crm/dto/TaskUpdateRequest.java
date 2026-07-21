package com.example.zhanfinancebackend.modules.crm.dto;

import java.util.List;

public record TaskUpdateRequest(
        String title,
        String description,
        List<String> tags,
        List<SubtaskDto> subtasks
) {}
