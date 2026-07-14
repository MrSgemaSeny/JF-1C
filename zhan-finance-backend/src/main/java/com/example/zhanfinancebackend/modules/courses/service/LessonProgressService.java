package com.example.zhanfinancebackend.modules.courses.service;

import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.courses.dto.CourseProgressDto;
import com.example.zhanfinancebackend.modules.courses.entity.Course;
import com.example.zhanfinancebackend.modules.courses.entity.Enrollment;
import com.example.zhanfinancebackend.modules.courses.entity.Lesson;
import com.example.zhanfinancebackend.modules.courses.entity.LessonProgress;
import com.example.zhanfinancebackend.modules.courses.repository.CourseRepository;
import com.example.zhanfinancebackend.modules.courses.repository.EnrollmentRepository;
import com.example.zhanfinancebackend.modules.courses.repository.LessonProgressRepository;
import com.example.zhanfinancebackend.modules.courses.repository.LessonRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LessonProgressService {

    private final LessonProgressRepository lessonProgressRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LessonRepository lessonRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    public LessonProgressService(LessonProgressRepository lessonProgressRepository,
                                 EnrollmentRepository enrollmentRepository,
                                 LessonRepository lessonRepository,
                                 CourseRepository courseRepository,
                                 UserRepository userRepository) {
        this.lessonProgressRepository = lessonProgressRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.lessonRepository = lessonRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void completeLesson(Long courseId, Long lessonId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));

        // Verify lesson belongs to the course
        if (!lesson.getChapter().getCourse().getId().equals(courseId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lesson does not belong to this course");
        }

        LessonProgress progress = lessonProgressRepository.findByLessonIdAndUserId(lessonId, userId)
                .orElseGet(() -> {
                    LessonProgress newProgress = new LessonProgress();
                    newProgress.setLesson(lesson);
                    newProgress.setUser(user);
                    return newProgress;
                });

        if (!progress.isCompleted()) {
            progress.setCompleted(true);
            progress.setCompletedAt(LocalDateTime.now());
            lessonProgressRepository.save(progress);
        }

        // Create or update enrollment
        Enrollment enrollment = enrollmentRepository.findByCourseIdAndUserId(courseId, userId)
                .orElseGet(() -> {
                    Enrollment newEnrollment = new Enrollment();
                    newEnrollment.setCourse(courseRepository.getReferenceById(courseId));
                    newEnrollment.setUser(user);
                    return enrollmentRepository.save(newEnrollment);
                });

        // Check if course is fully completed
        CourseProgressDto progressDto = getCourseProgress(courseId, userId);
        if (progressDto.isCompleted() && enrollment.getCompletedAt() == null) {
            enrollment.setCompletedAt(LocalDateTime.now());
            enrollmentRepository.save(enrollment);
        }
    }

    @Transactional(readOnly = true)
    public CourseProgressDto getCourseProgress(Long courseId, Long userId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

        List<LessonProgress> progresses = lessonProgressRepository.findAllByCourseIdAndUserId(courseId, userId);
        
        List<Long> completedLessonIds = progresses.stream()
                .filter(LessonProgress::isCompleted)
                .map(p -> p.getLesson().getId())
                .collect(Collectors.toList());

        int totalLessons = 0;
        for (var chapter : course.getChapters()) {
            totalLessons += chapter.getLessons().size();
        }

        int completionPercentage = 0;
        if (totalLessons > 0) {
            completionPercentage = (int) (((double) completedLessonIds.size() / totalLessons) * 100);
        }

        boolean isCompleted = totalLessons > 0 && completedLessonIds.size() >= totalLessons;

        return new CourseProgressDto(courseId, completionPercentage, isCompleted, completedLessonIds);
    }
}
