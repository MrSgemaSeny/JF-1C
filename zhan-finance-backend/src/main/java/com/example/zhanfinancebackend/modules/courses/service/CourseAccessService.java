package com.example.zhanfinancebackend.modules.courses.service;

import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.courses.repository.CourseCuratorRepository;
import org.springframework.stereotype.Service;

@Service
public class CourseAccessService {

    private final CourseCuratorRepository courseCuratorRepository;

    public CourseAccessService(CourseCuratorRepository courseCuratorRepository) {
        this.courseCuratorRepository = courseCuratorRepository;
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
}
