package com.example.zhanfinancebackend.modules.search.dto;

import com.example.zhanfinancebackend.modules.auth.dto.UserDto;
import com.example.zhanfinancebackend.modules.crm.dto.TaskDto;

import com.example.zhanfinancebackend.modules.courses.dto.CourseDto;
import com.example.zhanfinancebackend.modules.courses.dto.LessonDto;

import java.util.List;

public record GlobalSearchResponse(
        List<TaskDto> tasks,
        List<UserDto> users,
        List<CourseDto> courses,
        List<LessonDto> lessons
) {
}
