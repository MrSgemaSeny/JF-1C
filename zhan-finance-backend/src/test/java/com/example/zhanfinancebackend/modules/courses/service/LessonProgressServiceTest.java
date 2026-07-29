package com.example.zhanfinancebackend.modules.courses.service;

import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.courses.dto.CourseProgressDto;
import com.example.zhanfinancebackend.modules.courses.entity.*;
import com.example.zhanfinancebackend.modules.courses.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LessonProgressServiceTest {

    @Mock private LessonProgressRepository lessonProgressRepository;
    @Mock private EnrollmentRepository enrollmentRepository;
    @Mock private LessonRepository lessonRepository;
    @Mock private CourseRepository courseRepository;
    @Mock private UserRepository userRepository;
    @Mock private CertificateRepository certificateRepository;

    @InjectMocks
    private LessonProgressService lessonProgressService;

    private User learner;
    private User admin;
    private Course course;
    private Chapter chapter;
    private Lesson lesson1;
    private Lesson lesson2;

    @BeforeEach
    void setUp() {
        learner = new User();
        learner.setId(1L);
        learner.setRole(Role.LEARNER);

        admin = new User();
        admin.setId(99L);
        admin.setRole(Role.ADMIN);

        course = new Course();
        course.setId(10L);
        course.setTitle("Тестовый курс");

        chapter = new Chapter();
        chapter.setId(100L);
        chapter.setCourse(course);

        lesson1 = new Lesson();
        lesson1.setId(101L);
        lesson1.setChapter(chapter);

        lesson2 = new Lesson();
        lesson2.setId(102L);
        lesson2.setChapter(chapter);

        chapter.setLessons(List.of(lesson1, lesson2));
        course.setChapters(List.of(chapter));
    }

    @Test
    @DisplayName("Обычный ученик не может пройти урок 2, если урок 1 не пройден")
    void testSequentialUnlock_Lesson1NotCompleted_ThrowsException() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(learner));
        when(lessonRepository.findById(102L)).thenReturn(Optional.of(lesson2));
        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));
        when(lessonProgressRepository.findByLessonIdAndUserId(102L, 1L)).thenReturn(Optional.empty());
        when(lessonProgressRepository.findByLessonIdAndUserId(101L, 1L)).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> lessonProgressService.completeLesson(10L, 102L, 1L)
        );

        assertTrue(exception.getMessage().contains("не завершив предыдущий урок"));
    }

    @Test
    @DisplayName("Правило 1 день - 1 урок: нельзя пройти второй урок в тот же день")
    void testDripContentRule_SameDayCompletion_ThrowsException() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(learner));
        when(lessonRepository.findById(102L)).thenReturn(Optional.of(lesson2));
        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));

        LessonProgress progress1 = new LessonProgress();
        progress1.setLesson(lesson1);
        progress1.setUser(learner);
        progress1.setCompleted(true);
        progress1.setCompletedAt(LocalDateTime.now());

        when(lessonProgressRepository.findByLessonIdAndUserId(102L, 1L)).thenReturn(Optional.empty());
        when(lessonProgressRepository.findByLessonIdAndUserId(101L, 1L)).thenReturn(Optional.of(progress1));
        when(lessonProgressRepository.findAllByCourseIdAndUserId(10L, 1L)).thenReturn(List.of(progress1));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> lessonProgressService.completeLesson(10L, 102L, 1L)
        );

        assertTrue(exception.getMessage().contains("не более 1 урока в день"));
    }

    @Test
    @DisplayName("Администратор может проходить любые уроки без ограничений по порядку и темпу")
    void testAdmin_BypassesSequentialAndDripRules() {
        when(userRepository.findById(99L)).thenReturn(Optional.of(admin));
        when(lessonRepository.findById(102L)).thenReturn(Optional.of(lesson2));
        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));
        when(enrollmentRepository.findByCourseIdAndUserId(10L, 99L)).thenReturn(Optional.empty());
        when(enrollmentRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        assertDoesNotThrow(() -> lessonProgressService.completeLesson(10L, 102L, 99L));

        verify(lessonProgressRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("При 100% прохождении курса автоматически выдается сертификат")
    void testCourseCompletion_IssuesCertificate() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(learner));
        when(lessonRepository.findById(101L)).thenReturn(Optional.of(lesson1));
        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));

        LessonProgress progress1 = new LessonProgress();
        progress1.setLesson(lesson1);
        progress1.setUser(learner);
        progress1.setCompleted(true);

        LessonProgress progress2 = new LessonProgress();
        progress2.setLesson(lesson2);
        progress2.setUser(learner);
        progress2.setCompleted(true);

        when(lessonProgressRepository.findAllByCourseIdAndUserId(10L, 1L)).thenReturn(List.of(progress1, progress2));
        when(enrollmentRepository.findByCourseIdAndUserId(10L, 1L)).thenReturn(Optional.empty());
        when(enrollmentRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        lessonProgressService.completeLesson(10L, 101L, 1L);

        verify(certificateRepository, times(1)).save(any());
    }
}
