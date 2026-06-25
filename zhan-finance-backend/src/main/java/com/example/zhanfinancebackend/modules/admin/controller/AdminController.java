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

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
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

    @PostMapping("/employees/{id}/approve")
    public ApiResponse<Void> approveEmployee(@PathVariable Long id) {
        adminService.approveEmployee(id);
        return ApiResponse.success(null, "Сотрудник одобрен");
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
}
