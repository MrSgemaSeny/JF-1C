package com.example.zhanfinancebackend.modules.courses.controller;

import com.example.zhanfinancebackend.modules.courses.dto.CourseProgressDto;
import com.example.zhanfinancebackend.modules.courses.entity.Course;
import com.example.zhanfinancebackend.modules.courses.service.CourseService;
import com.example.zhanfinancebackend.modules.courses.service.LessonProgressService;
import com.example.zhanfinancebackend.modules.courses.service.LessonService;
import com.example.zhanfinancebackend.modules.documents.service.StorageService;
import com.example.zhanfinancebackend.modules.auth.security.UserPrincipal;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpRange;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.example.zhanfinancebackend.common.response.ApiResponse;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/courses")
@PreAuthorize("hasAnyRole('ADMIN', 'LEARNER')")
public class LearnerCourseController {

    private final CourseService courseService;
    private final LessonService lessonService;
    private final StorageService storageService;
    private final LessonProgressService lessonProgressService;

    public LearnerCourseController(CourseService courseService, LessonService lessonService, StorageService storageService, LessonProgressService lessonProgressService) {
        this.courseService = courseService;
        this.lessonService = lessonService;
        this.storageService = storageService;
        this.lessonProgressService = lessonProgressService;
    }

    @GetMapping
    public ApiResponse<List<Course>> getPublishedCourses() {
        return ApiResponse.success(courseService.getPublishedCourses());
    }

    @GetMapping("/{id}")
    public ApiResponse<Course> getCourseById(@PathVariable Long id) {
        return ApiResponse.success(courseService.getPublishedCourseById(id));
    }

    @GetMapping("/{courseId}/progress")
    public ApiResponse<CourseProgressDto> getCourseProgress(@PathVariable Long courseId, @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(lessonProgressService.getCourseProgress(courseId, principal.getId()));
    }

    @PostMapping("/{courseId}/lessons/{lessonId}/complete")
    public ApiResponse<Void> completeLesson(@PathVariable Long courseId, @PathVariable Long lessonId, @AuthenticationPrincipal UserPrincipal principal) {
        lessonProgressService.completeLesson(courseId, lessonId, principal.getId());
        return ApiResponse.success(null);
    }

    @GetMapping("/lessons/{id}/file")
    public ResponseEntity<org.springframework.core.io.support.ResourceRegion> streamLessonFile(@PathVariable Long id, @RequestHeader HttpHeaders headers) throws IOException {
        // TODO: Phase 2 - Implement file streaming from LessonBlock
        return ResponseEntity.notFound().build();
    }
}
