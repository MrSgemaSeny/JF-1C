package com.example.zhanfinancebackend.modules.crm.controller;

import com.example.zhanfinancebackend.common.response.ApiResponse;
import com.example.zhanfinancebackend.modules.auth.security.UserPrincipal;
import com.example.zhanfinancebackend.modules.crm.dto.AdminDashboardDto;
import com.example.zhanfinancebackend.modules.crm.dto.ClientDashboardDto;
import com.example.zhanfinancebackend.modules.crm.dto.EmployeeDashboardDto;
import com.example.zhanfinancebackend.modules.crm.service.DashboardService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/crm/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<AdminDashboardDto> getAdminDashboard() {
        return ApiResponse.success(dashboardService.getAdminDashboard());
    }

    @GetMapping("/employee")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ApiResponse<EmployeeDashboardDto> getEmployeeDashboard(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(dashboardService.getEmployeeDashboard(principal.getUser()));
    }

    @GetMapping("/client")
    @PreAuthorize("hasRole('CLIENT')")
    public ApiResponse<ClientDashboardDto> getClientDashboard(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(dashboardService.getClientDashboard(principal.getUser()));
    }
}
