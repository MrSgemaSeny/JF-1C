package com.example.zhanfinancebackend.modules.courses.dto;

import com.example.zhanfinancebackend.modules.courses.entity.LessonType;
import lombok.Data;

@Data
public class LessonDto {
    private Long id;
    private Long sectionId;
    private String title;
    private String description;
    private String content;
    private LessonType type;
    private String fileName;
    private String contentType;
    private Long fileSize;
    private int orderIndex;
}
