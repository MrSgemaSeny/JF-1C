package com.example.zhanfinancebackend.modules.courses.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class CourseDto {
    private Long id;
    private String title;
    private String description;
    private String thumbnail;
    private com.example.zhanfinancebackend.modules.courses.entity.CourseStatus status;
    private Long createdById;
    private LocalDateTime createdAt;
    private List<ChapterDto> chapters = new ArrayList<>();
}
