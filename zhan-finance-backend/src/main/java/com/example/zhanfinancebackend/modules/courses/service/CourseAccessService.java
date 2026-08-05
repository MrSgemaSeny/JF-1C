package com.example.zhanfinancebackend.modules.courses.service;

import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.courses.repository.CourseCuratorRepository;
import com.example.zhanfinancebackend.modules.courses.repository.EnrollmentRepository;
import org.springframework.stereotype.Service;

@Service
public class CourseAccessService {

    private final CourseCuratorRepository courseCuratorRepository;
    private final EnrollmentRepository enrollmentRepository;

    public CourseAccessService(CourseCuratorRepository courseCuratorRepository, EnrollmentRepository enrollmentRepository) {
        this.courseCuratorRepository = courseCuratorRepository;
        this.enrollmentRepository = enrollmentRepository;
    }

    public boolean canManageCourse(User user, Long courseId) {
        if (user == null) return false;
        if (user.getRole() == Role.ADMIN) return true;
        if (user.getRole() == Role.CURATOR) {
            return courseCuratorRepository.existsByCourseIdAndCuratorId(courseId, user.getId());
        }
        return false;
    }

    public boolean canViewStudent(User user, Long courseId) {
        if (user == null) return false;
        if (user.getRole() == Role.ADMIN) return true;
        if (user.getRole() == Role.CURATOR) {
            return courseCuratorRepository.existsByCourseIdAndCuratorId(courseId, user.getId());
        }
        return false;
    }

    public boolean canAccessCourseContent(User user, Long courseId) {
        if (user == null) return false;
        if (user.getRole() == Role.ADMIN) return true;
        if (user.getRole() == Role.CURATOR) {
            return courseCuratorRepository.existsByCourseIdAndCuratorId(courseId, user.getId());
        }
        if (user.getRole() == Role.LEARNER || user.getRole() == Role.CLIENT) {
            return enrollmentRepository.existsByCourseIdAndUserId(courseId, user.getId());
        }
        return false;
    }
}
