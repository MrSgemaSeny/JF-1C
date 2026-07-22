package com.example.zhanfinancebackend.modules.crm.controller;

import com.example.zhanfinancebackend.common.response.ApiResponse;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.crm.dto.EmployeeDto;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/crm/employees")
@PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
public class CrmEmployeeController {

    private final UserRepository userRepository;

    public CrmEmployeeController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public ApiResponse<List<EmployeeDto>> getEmployees() {
        List<EmployeeDto> employees = userRepository.findAllByRoleIn(List.of(Role.EMPLOYEE, Role.ADMIN)).stream()
                .map(u -> new EmployeeDto(
                        u.getId(),
                        u.getFullName(),
                        u.getEmail(),
                        u.getRole().name(),
                        u.isEnabled(),
                        u.getCreatedAt() != null ? u.getCreatedAt().atZone(java.time.ZoneOffset.UTC) : null
                )).toList();
        return ApiResponse.success(employees);
    }
}
