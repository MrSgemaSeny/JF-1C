package com.example.zhanfinancebackend.modules.services.controller;

import com.example.zhanfinancebackend.common.response.ApiResponse;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.security.UserPrincipal;
import com.example.zhanfinancebackend.modules.services.dto.ServiceDto;

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
    public ServiceController(ServiceService serviceService) {
        this.serviceService = serviceService;
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


}
