package com.example.zhanfinancebackend.modules.courses.service;

import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.courses.dto.CertificateDto;
import com.example.zhanfinancebackend.modules.courses.dto.CourseProgressDto;
import com.example.zhanfinancebackend.modules.courses.entity.*;
import com.example.zhanfinancebackend.modules.courses.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class LessonProgressService {

    private final LessonProgressRepository lessonProgressRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LessonRepository lessonRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final CertificateRepository certificateRepository;

    public LessonProgressService(LessonProgressRepository lessonProgressRepository,
                                 EnrollmentRepository enrollmentRepository,
                                 LessonRepository lessonRepository,
                                 CourseRepository courseRepository,
                                 UserRepository userRepository,
                                 CertificateRepository certificateRepository) {
        this.lessonProgressRepository = lessonProgressRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.lessonRepository = lessonRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
        this.certificateRepository = certificateRepository;
    }

    @Transactional
    public void completeLesson(Long courseId, Long lessonId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));

        if (!lesson.getChapter().getCourse().getId().equals(courseId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lesson does not belong to this course");
        }

        boolean isAdmin = user.getRole() == Role.ADMIN;

        LessonProgress progress = lessonProgressRepository.findByLessonIdAndUserId(lessonId, userId)
                .orElseGet(() -> {
                    LessonProgress newProgress = new LessonProgress();
                    newProgress.setLesson(lesson);
                    newProgress.setUser(user);
                    return newProgress;
                });

        if (!progress.isCompleted()) {
            if (!isAdmin) {
                enforceSequenceAndDripRules(courseId, lessonId, userId);
            }

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
        if (progressDto.isCompleted()) {
            if (enrollment.getCompletedAt() == null) {
                enrollment.setCompletedAt(LocalDateTime.now());
                enrollmentRepository.save(enrollment);
            }
            issueCertificateIfMissing(courseRepository.findById(courseId).orElse(null), user);
        }
    }

    private void enforceSequenceAndDripRules(Long courseId, Long targetLessonId, Long userId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

        List<Lesson> orderedLessons = new ArrayList<>();
        for (Chapter chapter : course.getChapters()) {
            orderedLessons.addAll(chapter.getLessons());
        }

        int targetIndex = -1;
        for (int i = 0; i < orderedLessons.size(); i++) {
            if (orderedLessons.get(i).getId().equals(targetLessonId)) {
                targetIndex = i;
                break;
            }
        }

        if (targetIndex > 0) {
            Lesson prevLesson = orderedLessons.get(targetIndex - 1);
            boolean isPrevCompleted = lessonProgressRepository.findByLessonIdAndUserId(prevLesson.getId(), userId)
                    .map(LessonProgress::isCompleted)
                    .orElse(false);

            if (!isPrevCompleted) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Вы не можете пройти этот урок, не завершив предыдущий урок.");
            }
        }

        // Drip content rule: 1 lesson per calendar day
        List<LessonProgress> userProgresses = lessonProgressRepository.findAllByCourseIdAndUserId(courseId, userId);
        boolean completedAnyToday = userProgresses.stream()
                .filter(LessonProgress::isCompleted)
                .anyMatch(p -> p.getCompletedAt() != null && p.getCompletedAt().toLocalDate().isEqual(LocalDate.now()));

        if (completedAnyToday) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ограничение: можно проходить не более 1 урока в день. Следующий урок откроется завтра!");
        }
    }

    private void issueCertificateIfMissing(Course course, User user) {
        if (course == null || user == null) return;
        certificateRepository.findByCourseIdAndUserId(course.getId(), user.getId())
                .orElseGet(() -> {
                    String code = "CERT-" + LocalDate.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                    Certificate cert = new Certificate(user, course, code, LocalDateTime.now());
                    return certificateRepository.save(cert);
                });
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

        List<Lesson> orderedLessons = new ArrayList<>();
        for (var chapter : course.getChapters()) {
            orderedLessons.addAll(chapter.getLessons());
        }

        int totalLessons = orderedLessons.size();
        int completionPercentage = 0;
        if (totalLessons > 0) {
            completionPercentage = (int) (((double) completedLessonIds.size() / totalLessons) * 100);
        }

        boolean isCompleted = totalLessons > 0 && completedLessonIds.size() >= totalLessons;

        // Calculate unlocked lesson IDs
        List<Long> unlockedLessonIds = new ArrayList<>();
        for (int i = 0; i < orderedLessons.size(); i++) {
            Lesson l = orderedLessons.get(i);
            if (i == 0 || completedLessonIds.contains(orderedLessons.get(i - 1).getId())) {
                unlockedLessonIds.add(l.getId());
            }
        }

        boolean completedAnyToday = progresses.stream()
                .filter(LessonProgress::isCompleted)
                .anyMatch(p -> p.getCompletedAt() != null && p.getCompletedAt().toLocalDate().isEqual(LocalDate.now()));

        String certCode = certificateRepository.findByCourseIdAndUserId(courseId, userId)
                .map(Certificate::getCertificateCode)
                .orElse(null);

        CourseProgressDto dto = new CourseProgressDto(courseId, completionPercentage, isCompleted, completedLessonIds);
        dto.setUnlockedLessonIds(unlockedLessonIds);
        dto.setCanCompleteToday(!completedAnyToday);
        dto.setCertificateCode(certCode);

        return dto;
    }

    @Transactional(readOnly = true)
    public CertificateDto getCertificate(Long courseId, Long userId) {
        Certificate cert = certificateRepository.findByCourseIdAndUserId(courseId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Сертификат ещё не выдан для этого курса."));

        return new CertificateDto(
                cert.getId(),
                cert.getCertificateCode(),
                cert.getUser().getId(),
                cert.getUser().getFullName(),
                cert.getCourse().getId(),
                cert.getCourse().getTitle(),
                cert.getIssuedAt()
        );
    }

    @Transactional(readOnly = true)
    public CertificateDto verifyCertificate(String code) {
        Certificate cert = certificateRepository.findByCertificateCode(code.trim().toUpperCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Сертификат с таким кодом не найден."));

        return new CertificateDto(
                cert.getId(),
                cert.getCertificateCode(),
                cert.getUser().getId(),
                cert.getUser().getFullName(),
                cert.getCourse().getId(),
                cert.getCourse().getTitle(),
                cert.getIssuedAt()
        );
    }
}
