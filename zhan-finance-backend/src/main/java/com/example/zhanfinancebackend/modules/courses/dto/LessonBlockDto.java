package com.example.zhanfinancebackend.modules.courses.dto;

import com.example.zhanfinancebackend.modules.courses.entity.BlockType;
import lombok.Data;

@Data
public class LessonBlockDto {
    private Long id;
    private Long lessonId;
    private BlockType type;
    private int orderIndex;
    private String content;
}
