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
    private boolean isPublished;
    private Long createdById;
    private LocalDateTime createdAt;
    private List<CourseSectionDto> sections = new ArrayList<>();
}
