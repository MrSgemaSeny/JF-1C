package com.example.zhanfinancebackend.modules.crm.controller;

import com.example.zhanfinancebackend.common.response.ApiResponse;
import com.example.zhanfinancebackend.modules.admin.service.AdminService;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.crm.dto.EmployeeDto;
import com.example.zhanfinancebackend.modules.crm.dto.EmployeeWorkloadDto;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/v1/crm/employees")
@PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE', 'ADVISOR')")
public class CrmEmployeeController {

    private final UserRepository userRepository;
    private final AdminService adminService;

    public CrmEmployeeController(UserRepository userRepository, AdminService adminService) {
        this.userRepository = userRepository;
        this.adminService = adminService;
    }

    @GetMapping
    public ApiResponse<List<EmployeeDto>> getEmployees() {
        List<EmployeeDto> employees = userRepository.findAllByRoleIn(List.of(Role.EMPLOYEE, Role.ADVISOR)).stream()
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

    @GetMapping("/workload")
    public ApiResponse<List<EmployeeWorkloadDto>> getEmployeeWorkload() {
        return ApiResponse.success(adminService.getEmployeeWorkloads());
    }
}
