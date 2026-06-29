package com.example.zhanfinancebackend.modules.search.controller;

import com.example.zhanfinancebackend.common.response.ApiResponse;
import com.example.zhanfinancebackend.modules.auth.dto.UserDto;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.auth.security.UserPrincipal;
import com.example.zhanfinancebackend.modules.crm.dto.TaskDto;
import com.example.zhanfinancebackend.modules.crm.entity.Task;
import com.example.zhanfinancebackend.modules.crm.repository.TaskRepository;
import com.example.zhanfinancebackend.modules.crm.service.TaskService;
import com.example.zhanfinancebackend.modules.courses.entity.Course;
import com.example.zhanfinancebackend.modules.courses.entity.Lesson;
import com.example.zhanfinancebackend.modules.courses.repository.CourseRepository;
import com.example.zhanfinancebackend.modules.courses.repository.LessonRepository;
import com.example.zhanfinancebackend.modules.courses.dto.CourseDto;
import com.example.zhanfinancebackend.modules.courses.dto.LessonDto;
import com.example.zhanfinancebackend.modules.search.dto.GlobalSearchResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;
import java.util.Collections;

@RestController
@RequestMapping("/api/search")
public class GlobalSearchController {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final TaskService taskService;
    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;

    public GlobalSearchController(TaskRepository taskRepository, UserRepository userRepository, TaskService taskService, CourseRepository courseRepository, LessonRepository lessonRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.taskService = taskService;
        this.courseRepository = courseRepository;
        this.lessonRepository = lessonRepository;
    }

    private CourseDto mapToCourseDto(Course c) {
        CourseDto dto = new CourseDto();
        dto.setId(c.getId());
        dto.setTitle(c.getTitle());
        dto.setDescription(c.getDescription());
        dto.setThumbnail(c.getThumbnail());
        dto.setPublished(c.isPublished());
        if (c.getCreatedAt() != null) {
            dto.setCreatedAt(java.time.LocalDateTime.ofInstant(c.getCreatedAt(), java.time.ZoneId.systemDefault()));
        }
        if (c.getCreatedBy() != null) dto.setCreatedById(c.getCreatedBy().getId());
        return dto;
    }

    private LessonDto mapToLessonDto(Lesson l) {
        LessonDto dto = new LessonDto();
        dto.setId(l.getId());
        if (l.getCourse() != null) dto.setSectionId(l.getCourse().getId()); // sectionId used as courseId in frontend usually
        dto.setTitle(l.getTitle());
        dto.setDescription(l.getDescription());
        dto.setType(l.getType());
        dto.setOrderIndex(l.getOrderIndex());
        return dto;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE', 'CLIENT', 'LEARNER')")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ApiResponse<GlobalSearchResponse> search(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("q") String query
    ) {
        User user = principal.getUser();
        if (query == null || query.trim().length() < 2) {
            return ApiResponse.success(new GlobalSearchResponse(List.of(), List.of(), List.of(), List.of()));
        }

        // Search tasks
        List<Task> foundTasks = taskRepository.searchTasks(query);
        List<TaskDto> taskDtos = foundTasks.stream()
                .filter(t -> {
                    if (user.getRole() == Role.ADMIN) return true;
                    if (user.getRole() == Role.EMPLOYEE) {
                        return t.getAssignedTo() != null && t.getAssignedTo().getId().equals(user.getId()) ||
                                (t.getClient() != null && t.getClient().getAssignedEmployee() != null && t.getClient().getAssignedEmployee().getId().equals(user.getId()));
                    }
                    if (user.getRole() == Role.CLIENT) {
                        return t.getClient() != null && t.getClient().getId().equals(user.getId()) || (t.getCreatedBy() != null && t.getCreatedBy().getId().equals(user.getId()));
                    }
                    return false;
                })
                .map(taskService::mapToDto)
                .collect(Collectors.toList());

        // Search users
        List<User> foundUsers = userRepository.searchUsers(query);
        List<UserDto> userDtos = foundUsers.stream()
                .filter(u -> {
                    if (user.getRole() == Role.ADMIN) return true;
                    if (user.getRole() == Role.EMPLOYEE) {
                        return u.getRole() == Role.CLIENT && u.getAssignedEmployee() != null && u.getAssignedEmployee().getId().equals(user.getId());
                    }
                    if (user.getRole() == Role.CLIENT) {
                        return u.getRole() == Role.EMPLOYEE && user.getAssignedEmployee() != null && u.getId().equals(user.getAssignedEmployee().getId());
                    }
                    return false;
                })
                .map(u -> new UserDto(u.getId(), u.getFullName(), u.getEmail(), u.getRole()))
                .collect(Collectors.toList());

        // Search courses and lessons
        List<CourseDto> courseDtos = Collections.emptyList();
        List<LessonDto> lessonDtos = Collections.emptyList();

        if (user.getRole() == Role.ADMIN || user.getRole() == Role.LEARNER) {
            List<Course> foundCourses = user.getRole() == Role.ADMIN ? 
                courseRepository.searchCourses(query) : 
                courseRepository.searchPublishedCourses(query);
                
            courseDtos = foundCourses.stream().map(this::mapToCourseDto).collect(Collectors.toList());
            
            List<Lesson> foundLessons = lessonRepository.searchLessons(query);
            lessonDtos = foundLessons.stream()
                .filter(l -> user.getRole() == Role.ADMIN || (l.getCourse() != null && l.getCourse().isPublished()))
                .map(this::mapToLessonDto)
                .collect(Collectors.toList());
        }

        return ApiResponse.success(new GlobalSearchResponse(taskDtos, userDtos, courseDtos, lessonDtos));
    }
}
