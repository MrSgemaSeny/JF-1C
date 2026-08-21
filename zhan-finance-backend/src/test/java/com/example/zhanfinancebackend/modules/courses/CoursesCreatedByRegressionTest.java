package com.example.zhanfinancebackend.modules.courses;

import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.courses.entity.Course;
import com.example.zhanfinancebackend.modules.courses.repository.CourseRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class CoursesCreatedByRegressionTest {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("C4 Regression: All existing courses must have valid non-null createdBy")
    void allCourses_mustHaveValidCreatedBy() {
        List<Course> courses = courseRepository.findAll();
        for (Course course : courses) {
            assertNotNull(course.getCreatedBy(), "Course '" + course.getTitle() + "' must have non-null createdBy");
            assertNotNull(course.getCreatedBy().getId(), "Course creator must have a valid user ID");
        }
    }

    @Test
    @DisplayName("C4 Regression: V119 SQL update query executes safely when admin exists")
    void v119SqlUpdateQuery_executesSafely() {
        // Ensure at least one admin exists
        User admin = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ADMIN)
                .findFirst()
                .orElseGet(() -> {
                    User newAdmin = new User("admin_test_c4@zhanfinance.kz", "hash", "Admin Test", Role.ADMIN);
                    return userRepository.save(newAdmin);
                });

        assertNotNull(admin.getId());

        // Execute the backfill logic from V119
        assertDoesNotThrow(() -> {
            jdbcTemplate.update("""
                UPDATE courses
                SET created_by = (
                    SELECT id
                    FROM app_users
                    WHERE role = 'ADMIN'
                    ORDER BY id ASC
                    LIMIT 1
                )
                WHERE created_by IS NULL
                  AND EXISTS (
                    SELECT 1
                    FROM app_users
                    WHERE role = 'ADMIN'
                )
            """);
        });
    }
}
