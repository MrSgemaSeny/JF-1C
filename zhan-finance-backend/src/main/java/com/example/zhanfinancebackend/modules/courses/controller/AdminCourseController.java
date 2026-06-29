package com.example.zhanfinancebackend.modules.courses.controller;

import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.security.UserPrincipal;
import com.example.zhanfinancebackend.modules.courses.entity.Course;
import com.example.zhanfinancebackend.modules.courses.entity.CourseSection;
import com.example.zhanfinancebackend.modules.courses.entity.Lesson;
import com.example.zhanfinancebackend.modules.courses.entity.LessonType;
import com.example.zhanfinancebackend.modules.courses.service.CourseService;
import com.example.zhanfinancebackend.modules.courses.service.LessonService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.example.zhanfinancebackend.common.response.ApiResponse;
import java.util.List;

@RestController
@RequestMapping("/api/admin/courses")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCourseController {

    private final CourseService courseService;
    private final LessonService lessonService;

    public AdminCourseController(CourseService courseService, LessonService lessonService) {
        this.courseService = courseService;
        this.lessonService = lessonService;
    }

    @GetMapping
    public ApiResponse<List<Course>> getAllCourses() {
        return ApiResponse.success(courseService.getAllCourses());
    }

    @PostMapping
    public ApiResponse<Course> createCourse(
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "isPublished", defaultValue = "false") boolean isPublished,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        User admin = userPrincipal.getUser();
        return ApiResponse.success(courseService.createCourse(title, description, null, isPublished, admin));
    }

    @PutMapping("/{id}")
    public ApiResponse<Course> updateCourse(
            @PathVariable Long id,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "isPublished", required = false) Boolean isPublished) {
        return ApiResponse.success(courseService.updateCourse(id, title, description, null, isPublished != null ? isPublished : false));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteCourse(@PathVariable Long id) {
        courseService.deleteCourse(id);
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/sections")
    public ApiResponse<CourseSection> createSection(
            @PathVariable Long id,
            @RequestParam("title") String title,
            @RequestParam(value = "orderIndex", defaultValue = "0") int orderIndex) {
        return ApiResponse.success(courseService.createSection(id, title, orderIndex));
    }

    @PutMapping("/sections/{sectionId}")
    public ApiResponse<CourseSection> updateSection(
            @PathVariable Long sectionId,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "orderIndex", required = false) Integer orderIndex) {
        return ApiResponse.success(courseService.updateSection(sectionId, title, orderIndex));
    }

    @DeleteMapping("/sections/{sectionId}")
    public ApiResponse<Void> deleteSection(@PathVariable Long sectionId) {
        courseService.deleteSection(sectionId);
        return ApiResponse.success(null);
    }

    @PostMapping("/sections/{sectionId}/lessons")
    public ApiResponse<Lesson> createLesson(
            @PathVariable Long sectionId,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("type") LessonType type,
            @RequestParam(value = "orderIndex", defaultValue = "0") int orderIndex,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        return ApiResponse.success(lessonService.createLesson(sectionId, title, description, type, orderIndex, file));
    }

    @PutMapping("/lessons/{lessonId}")
    public ApiResponse<Lesson> updateLesson(
            @PathVariable Long lessonId,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "orderIndex", required = false) Integer orderIndex,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        return ApiResponse.success(lessonService.updateLesson(lessonId, title, description, orderIndex, file));
    }

    @DeleteMapping("/lessons/{lessonId}")
    public ApiResponse<Void> deleteLesson(@PathVariable Long lessonId) {
        lessonService.deleteLesson(lessonId);
        return ApiResponse.success(null);
    }
}
