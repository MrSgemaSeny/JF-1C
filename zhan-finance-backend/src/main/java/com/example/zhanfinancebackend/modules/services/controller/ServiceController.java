package com.example.zhanfinancebackend.modules.services.controller;

import com.example.zhanfinancebackend.common.response.ApiResponse;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.security.UserPrincipal;
import com.example.zhanfinancebackend.modules.services.dto.ServiceDto;
import com.example.zhanfinancebackend.modules.services.dto.ServiceRequestCreateRequest;
import com.example.zhanfinancebackend.modules.services.dto.ServiceRequestDto;
import com.example.zhanfinancebackend.modules.services.service.ServiceRequestService;
import com.example.zhanfinancebackend.modules.services.service.ServiceService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/services")
public class ServiceController {

    private final ServiceService serviceService;
    private final ServiceRequestService serviceRequestService;

    public ServiceController(ServiceService serviceService, ServiceRequestService serviceRequestService) {
        this.serviceService = serviceService;
        this.serviceRequestService = serviceRequestService;
    }

    // ========== PUBLIC: каталог услуг ==========

    /**
     * GET /api/services — Список всех активных услуг (публичный)
     */
    @GetMapping
    public ApiResponse<List<ServiceDto>> getAllServices() {
        return ApiResponse.success(serviceService.getAllActiveServices());
    }

    /**
     * GET /api/services/highlighted — Только подсвеченные услуги (для главной страницы)
     */
    @GetMapping("/highlighted")
    public ApiResponse<List<ServiceDto>> getHighlightedServices() {
        return ApiResponse.success(serviceService.getHighlightedServices());
    }

    // ========== AUTHENTICATED: запросы на услуги ==========

    /**
     * POST /api/services/request — Клиент запрашивает услугу
     */
    @PostMapping("/request")
    @PreAuthorize("hasAnyRole('CLIENT', 'ADMIN', 'EMPLOYEE')")
    public ApiResponse<ServiceRequestDto> requestService(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ServiceRequestCreateRequest request
    ) {
        return ApiResponse.success(
                serviceRequestService.createRequest(request, principal.getUser())
        );
    }

    /**
     * GET /api/services/requests/my — Мои запросы (для клиента)
     */
    @GetMapping("/requests/my")
    @PreAuthorize("hasAnyRole('CLIENT', 'ADMIN', 'EMPLOYEE')")
    public ApiResponse<List<ServiceRequestDto>> getMyRequests(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ApiResponse.success(
                serviceRequestService.getClientRequests(principal.getUser().getId())
        );
    }

    /**
     * GET /api/services/requests — Все запросы (для админа/сотрудника)
     */
    @GetMapping("/requests")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public ApiResponse<List<ServiceRequestDto>> getAllRequests() {
        return ApiResponse.success(serviceRequestService.getAllRequests());
    }

    /**
     * GET /api/services/requests/by-task/{taskId} — Получить информацию об услуге по ID задачи (для сотрудника)
     */
    @GetMapping("/requests/by-task/{taskId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE', 'CLIENT')")
    public ApiResponse<ServiceRequestDto> getRequestByTaskId(@PathVariable Long taskId) {
        return ApiResponse.success(serviceRequestService.getRequestByTaskId(taskId));
    }
}
