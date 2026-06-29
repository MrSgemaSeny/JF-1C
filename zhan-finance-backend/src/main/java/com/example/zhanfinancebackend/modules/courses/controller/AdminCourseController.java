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
    public ResponseEntity<List<Course>> getAllCourses() {
        return ResponseEntity.ok(courseService.getAllCourses());
    }

    @PostMapping
    public ResponseEntity<Course> createCourse(
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "isPublished", defaultValue = "false") boolean isPublished,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        User admin = userPrincipal.getUser();
        return ResponseEntity.ok(courseService.createCourse(title, description, null, isPublished, admin));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Course> updateCourse(
            @PathVariable Long id,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "isPublished", required = false) Boolean isPublished) {
        return ResponseEntity.ok(courseService.updateCourse(id, title, description, null, isPublished != null ? isPublished : false));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourse(@PathVariable Long id) {
        courseService.deleteCourse(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/sections")
    public ResponseEntity<CourseSection> createSection(
            @PathVariable Long id,
            @RequestParam("title") String title,
            @RequestParam(value = "orderIndex", defaultValue = "0") int orderIndex) {
        return ResponseEntity.ok(courseService.createSection(id, title, orderIndex));
    }

    @PutMapping("/sections/{sectionId}")
    public ResponseEntity<CourseSection> updateSection(
            @PathVariable Long sectionId,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "orderIndex", required = false) Integer orderIndex) {
        return ResponseEntity.ok(courseService.updateSection(sectionId, title, orderIndex));
    }

    @DeleteMapping("/sections/{sectionId}")
    public ResponseEntity<Void> deleteSection(@PathVariable Long sectionId) {
        courseService.deleteSection(sectionId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/sections/{sectionId}/lessons")
    public ResponseEntity<Lesson> createLesson(
            @PathVariable Long sectionId,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("type") LessonType type,
            @RequestParam(value = "orderIndex", defaultValue = "0") int orderIndex,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        return ResponseEntity.ok(lessonService.createLesson(sectionId, title, description, type, orderIndex, file));
    }

    @PutMapping("/lessons/{lessonId}")
    public ResponseEntity<Lesson> updateLesson(
            @PathVariable Long lessonId,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "orderIndex", required = false) Integer orderIndex,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        return ResponseEntity.ok(lessonService.updateLesson(lessonId, title, description, orderIndex, file));
    }

    @DeleteMapping("/lessons/{lessonId}")
    public ResponseEntity<Void> deleteLesson(@PathVariable Long lessonId) {
        lessonService.deleteLesson(lessonId);
        return ResponseEntity.ok().build();
    }
}
