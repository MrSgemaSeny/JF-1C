package com.example.zhanfinancebackend.modules.courses.controller;

import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.common.exception.ErrorCode;
import com.example.zhanfinancebackend.common.response.ApiResponse;
import com.example.zhanfinancebackend.modules.auth.security.UserPrincipal;
import com.example.zhanfinancebackend.modules.courses.entity.Course;
import com.example.zhanfinancebackend.modules.courses.entity.Enrollment;
import com.example.zhanfinancebackend.modules.courses.repository.CourseCuratorRepository;
import com.example.zhanfinancebackend.modules.courses.repository.CourseRepository;
import com.example.zhanfinancebackend.modules.courses.repository.EnrollmentRepository;
import com.example.zhanfinancebackend.modules.courses.service.CourseAccessService;
import com.example.zhanfinancebackend.modules.courses.service.LessonProgressService;
import lombok.Data;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;
import com.example.zhanfinancebackend.modules.courses.entity.Chapter;

@RestController
@RequestMapping("/api/curator")
@PreAuthorize("hasRole('CURATOR')")
public class CuratorCourseController {

    private final CourseRepository courseRepository;
    private final CourseCuratorRepository courseCuratorRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CourseAccessService courseAccessService;
    private final LessonProgressService lessonProgressService;

    public CuratorCourseController(CourseRepository courseRepository,
                                  CourseCuratorRepository courseCuratorRepository,
                                  EnrollmentRepository enrollmentRepository,
                                  CourseAccessService courseAccessService,
                                  LessonProgressService lessonProgressService) {
        this.courseRepository = courseRepository;
        this.courseCuratorRepository = courseCuratorRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.courseAccessService = courseAccessService;
        this.lessonProgressService = lessonProgressService;
    }

    @Data
    public static class StudentProgressDto {
        private Long id;
        private Long userId;
        private String userFullName;
        private String userEmail;
        private Long courseId;
        private String courseTitle;
        private LocalDateTime enrolledAt;
        private LocalDateTime completedAt;
        private int completedLessonsCount;
        private double progressPercent;
    }

    @GetMapping("/courses")
    @Transactional(readOnly = true)
    public ApiResponse<List<Course>> getMyCourses(@AuthenticationPrincipal UserPrincipal principal) {
        List<Long> assignedCourseIds = courseCuratorRepository.findByCuratorId(principal.getId()).stream()
                .map(cc -> cc.getCourse().getId())
                .toList();

        List<Course> courses = courseRepository.findAllById(assignedCourseIds);
        courses.forEach(this::initializeCourse);
        return ApiResponse.success(courses);
    }

    @GetMapping("/courses/{id}")
    @Transactional(readOnly = true)
    public ApiResponse<Course> getMyCourseById(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
        if (!courseAccessService.canManageCourse(principal.getUser(), id)) {
            throw new ApiException(ErrorCode.FORBIDDEN, "Access denied to this course");
        }

        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Course not found"));
        initializeCourse(course);
        return ApiResponse.success(course);
    }

    private void initializeCourse(Course course) {
        if (course.getChapters() != null) {
            course.getChapters().size();
            for (Chapter chapter : course.getChapters()) {
                if (chapter.getLessons() != null) {
                    chapter.getLessons().size();
                }
            }
        }
    }

    @GetMapping("/students")
    public ApiResponse<List<StudentProgressDto>> getMyStudents(@AuthenticationPrincipal UserPrincipal principal) {
        List<Long> assignedCourseIds = courseCuratorRepository.findByCuratorId(principal.getId()).stream()
                .map(cc -> cc.getCourse().getId())
                .toList();

        if (assignedCourseIds.isEmpty()) {
            return ApiResponse.success(List.of());
        }

        List<Enrollment> enrollments = enrollmentRepository.findAllByCourseIdIn(assignedCourseIds);
        List<StudentProgressDto> studentDtos = enrollments.stream().map(e -> {
            StudentProgressDto dto = new StudentProgressDto();
            dto.setId(e.getId());
            dto.setUserId(e.getUser().getId());
            dto.setUserFullName(e.getUser().getFullName());
            dto.setUserEmail(e.getUser().getEmail());
            dto.setCourseId(e.getCourse().getId());
            dto.setCourseTitle(e.getCourse().getTitle());
            dto.setEnrolledAt(e.getEnrolledAt());
            dto.setCompletedAt(e.getCompletedAt());

            var progress = lessonProgressService.getCourseProgress(e.getCourse().getId(), e.getUser().getId());
            if (progress != null) {
                dto.setCompletedLessonsCount(progress.getCompletedLessonIds() != null ? progress.getCompletedLessonIds().size() : 0);
                dto.setProgressPercent(progress.getCompletionPercentage());
            }

            return dto;
        }).toList();

        return ApiResponse.success(studentDtos);
    }
}
