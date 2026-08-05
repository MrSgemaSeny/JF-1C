package com.example.zhanfinancebackend.modules.courses.service;

import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.courses.repository.CourseCuratorRepository;
import com.example.zhanfinancebackend.modules.courses.repository.EnrollmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CourseAccessServiceTest {

    private CourseAccessService courseAccessService;
    private CourseCuratorRepository courseCuratorRepository;
    private EnrollmentRepository enrollmentRepository;

    @BeforeEach
    void setUp() {
        courseCuratorRepository = mock(CourseCuratorRepository.class);
        enrollmentRepository = mock(EnrollmentRepository.class);
        courseAccessService = new CourseAccessService(courseCuratorRepository, enrollmentRepository);
    }

    @Test
    void testCanManageCourse_Admin() {
        User admin = new User();
        admin.setId(1L);
        admin.setRole(Role.ADMIN);

        assertTrue(courseAccessService.canManageCourse(admin, 100L));
    }

    @Test
    void testCanManageCourse_CuratorAssigned() {
        User curator = new User();
        curator.setId(1L);
        curator.setRole(Role.CURATOR);

        when(courseCuratorRepository.existsByCourseIdAndCuratorId(100L, 1L)).thenReturn(true);

        assertTrue(courseAccessService.canManageCourse(curator, 100L));
    }

    @Test
    void testCanManageCourse_CuratorUnassigned() {
        User curator = new User();
        curator.setId(1L);
        curator.setRole(Role.CURATOR);

        when(courseCuratorRepository.existsByCourseIdAndCuratorId(100L, 1L)).thenReturn(false);

        assertFalse(courseAccessService.canManageCourse(curator, 100L));
    }

    @Test
    void testCanAccessCourseContent_Enrolled() {
        User learner = new User();
        learner.setId(1L);
        learner.setRole(Role.LEARNER);

        when(enrollmentRepository.existsByCourseIdAndUserId(100L, 1L)).thenReturn(true);

        assertTrue(courseAccessService.canAccessCourseContent(learner, 100L));
    }

    @Test
    void testCanAccessCourseContent_NotEnrolled() {
        User learner = new User();
        learner.setId(1L);
        learner.setRole(Role.LEARNER);

        when(enrollmentRepository.existsByCourseIdAndUserId(100L, 1L)).thenReturn(false);

        assertFalse(courseAccessService.canAccessCourseContent(learner, 100L));
    }

    @Test
    void testCanAccessCourseContent_Admin() {
        User admin = new User();
        admin.setId(1L);
        admin.setRole(Role.ADMIN);

        assertTrue(courseAccessService.canAccessCourseContent(admin, 100L));
    }
}
