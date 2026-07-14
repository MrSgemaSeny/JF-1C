package com.example.zhanfinancebackend.modules.courses.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CourseProgressDto {
    private Long courseId;
    private int completionPercentage;
    private boolean isCompleted;
    private List<Long> completedLessonIds;
}
