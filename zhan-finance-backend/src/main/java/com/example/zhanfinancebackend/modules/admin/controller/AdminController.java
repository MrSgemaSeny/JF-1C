package com.example.zhanfinancebackend.modules.admin.controller;

import com.example.zhanfinancebackend.common.response.ApiResponse;
import com.example.zhanfinancebackend.modules.admin.service.AdminService;
import com.example.zhanfinancebackend.modules.auth.security.UserPrincipal;
import com.example.zhanfinancebackend.modules.crm.dto.AdminDashboardDto;
import com.example.zhanfinancebackend.modules.crm.dto.EmployeeDto;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final com.example.zhanfinancebackend.modules.auth.service.UserService userService;

    public AdminController(AdminService adminService, com.example.zhanfinancebackend.modules.auth.service.UserService userService) {
        this.adminService = adminService;
        this.userService = userService;
    }

    @GetMapping("/employees")
    public ApiResponse<List<EmployeeDto>> getAllEmployees(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ApiResponse.success(adminService.getAllEmployees());
    }

    @GetMapping("/employees/pending")
    public ApiResponse<List<EmployeeDto>> getPendingEmployees() {
        return ApiResponse.success(adminService.getPendingEmployees());
    }

    @GetMapping("/employees/workload")
    public ApiResponse<List<com.example.zhanfinancebackend.modules.crm.dto.EmployeeWorkloadDto>> getEmployeeWorkload() {
        return ApiResponse.success(adminService.getEmployeeWorkloads());
    }

    @PostMapping("/employees/{id}/approve")
    public ApiResponse<Void> approveEmployee(@PathVariable Long id) {
        adminService.approveEmployee(id);
        return ApiResponse.success(null, "Сотрудник одобрен");
    }

    @DeleteMapping("/employees/{id}")
    public ApiResponse<Void> deleteEmployee(@PathVariable Long id) {
        userService.softDeleteUser(id);
        return ApiResponse.success(null, "Сотрудник деактивирован");
    }

    @GetMapping("/employees/assigned")
    public ApiResponse<List<EmployeeDto>> getAssignedEmployees() {
        return ApiResponse.success(adminService.getAssignedEmployees());
    }

    @GetMapping("/employees/unassigned")
    public ApiResponse<List<EmployeeDto>> getUnassignedEmployees() {
        return ApiResponse.success(adminService.getUnassignedEmployees());
    }

    @GetMapping("/dashboard")
    public ApiResponse<AdminDashboardDto> getAdminDashboard() {
        return ApiResponse.success(adminService.getAdminDashboard());
    }

    @GetMapping("/clients/stats")
    public ApiResponse<List<com.example.zhanfinancebackend.modules.crm.dto.ClientStatsDto>> getClientStats() {
        return ApiResponse.success(adminService.getClientStats());
    }

    @GetMapping("/learners")
    public ApiResponse<List<EmployeeDto>> getAllLearners() {
        return ApiResponse.success(adminService.getAllLearners());
    }

    @PostMapping("/learners")
    public ApiResponse<Void> createLearner(@jakarta.validation.Valid @RequestBody com.example.zhanfinancebackend.modules.auth.dto.RegisterRequest request) {
        adminService.createLearner(request);
        return ApiResponse.success(null, "Обучающийся успешно создан");
    }
}
