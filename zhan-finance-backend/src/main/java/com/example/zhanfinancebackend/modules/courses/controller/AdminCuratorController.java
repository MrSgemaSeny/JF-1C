package com.example.zhanfinancebackend.modules.courses.controller;

import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.common.exception.ErrorCode;
import com.example.zhanfinancebackend.common.exception.ResourceNotFoundException;
import com.example.zhanfinancebackend.common.response.ApiResponse;
import com.example.zhanfinancebackend.modules.auth.entity.AuthProvider;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.courses.entity.Course;
import com.example.zhanfinancebackend.modules.courses.entity.CourseCurator;
import com.example.zhanfinancebackend.modules.courses.repository.CourseCuratorRepository;
import com.example.zhanfinancebackend.modules.courses.repository.CourseRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/curators")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCuratorController {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final CourseCuratorRepository courseCuratorRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminCuratorController(UserRepository userRepository,
                                  CourseRepository courseRepository,
                                  CourseCuratorRepository courseCuratorRepository,
                                  PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.courseCuratorRepository = courseCuratorRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Data
    public static class CreateCuratorRequest {
        @NotBlank(message = "Full name is required")
        private String fullName;

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;
    }

    @Data
    public static class CuratorDto {
        private Long id;
        private String fullName;
        private String email;
        private boolean enabled;
        private List<Long> assignedCourseIds;
    }

    @GetMapping
    public ApiResponse<List<CuratorDto>> getCurators() {
        List<User> curators = userRepository.findAllByRole(Role.CURATOR);
        List<CuratorDto> dtos = curators.stream().map(c -> {
            CuratorDto dto = new CuratorDto();
            dto.setId(c.getId());
            dto.setFullName(c.getFullName());
            dto.setEmail(c.getEmail());
            dto.setEnabled(c.isEnabled());
            List<Long> courseIds = courseCuratorRepository.findByCuratorId(c.getId()).stream()
                    .map(cc -> cc.getCourse().getId())
                    .toList();
            dto.setAssignedCourseIds(courseIds);
            return dto;
        }).toList();
        return ApiResponse.success(dtos);
    }

    @PostMapping
    @Transactional
    public ApiResponse<CuratorDto> createCurator(@Valid @RequestBody CreateCuratorRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new ApiException(ErrorCode.EMAIL_ALREADY_REGISTERED, "User with this email already exists");
        }

        User curator = new User(request.getFullName(), request.getEmail(), passwordEncoder.encode(request.getPassword()), Role.CURATOR);
        curator.setAuthProvider(AuthProvider.LOCAL);
        curator.setEnabled(true);

        User saved = userRepository.save(curator);

        CuratorDto dto = new CuratorDto();
        dto.setId(saved.getId());
        dto.setFullName(saved.getFullName());
        dto.setEmail(saved.getEmail());
        dto.setEnabled(saved.isEnabled());
        dto.setAssignedCourseIds(List.of());
        return ApiResponse.success(dto);
    }

    @PostMapping("/{id}/toggle-status")
    @Transactional
    public ApiResponse<CuratorDto> toggleStatus(@PathVariable Long id) {
        User curator = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Curator not found"));

        if (curator.getRole() != Role.CURATOR) {
            throw new ApiException(ErrorCode.BAD_REQUEST, "User is not a curator");
        }

        curator.setEnabled(!curator.isEnabled());
        User saved = userRepository.save(curator);

        CuratorDto dto = new CuratorDto();
        dto.setId(saved.getId());
        dto.setFullName(saved.getFullName());
        dto.setEmail(saved.getEmail());
        dto.setEnabled(saved.isEnabled());
        List<Long> courseIds = courseCuratorRepository.findByCuratorId(saved.getId()).stream()
                .map(cc -> cc.getCourse().getId())
                .toList();
        dto.setAssignedCourseIds(courseIds);
        return ApiResponse.success(dto);
    }

    @PostMapping("/{curatorId}/courses/{courseId}")
    @Transactional
    public ApiResponse<Void> assignCourse(@PathVariable Long curatorId,
                                          @PathVariable Long courseId,
                                          @AuthenticationPrincipal User admin) {
        User curator = userRepository.findById(curatorId)
                .orElseThrow(() -> new ResourceNotFoundException("Curator not found"));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));

        if (curator.getRole() != Role.CURATOR) {
            throw new ApiException(ErrorCode.BAD_REQUEST, "User is not a curator");
        }

        if (!courseCuratorRepository.existsByCourseIdAndCuratorId(courseId, curatorId)) {
            CourseCurator cc = new CourseCurator(course, curator, admin);
            courseCuratorRepository.save(cc);
        }

        return ApiResponse.success(null);
    }

    @DeleteMapping("/{curatorId}/courses/{courseId}")
    @Transactional
    public ApiResponse<Void> unassignCourse(@PathVariable Long curatorId,
                                            @PathVariable Long courseId) {
        courseCuratorRepository.deleteByCourseIdAndCuratorId(courseId, curatorId);
        return ApiResponse.success(null);
    }
}
