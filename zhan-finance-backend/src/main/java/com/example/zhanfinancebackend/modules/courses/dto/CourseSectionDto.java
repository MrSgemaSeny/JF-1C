package com.example.zhanfinancebackend.modules.courses.dto;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class CourseSectionDto {
    private Long id;
    private Long courseId;
    private String title;
    private int orderIndex;
    private List<LessonDto> lessons = new ArrayList<>();
}
