package com.example.zhanfinancebackend.modules.crm.controller;

import com.example.zhanfinancebackend.common.response.ApiResponse;
import com.example.zhanfinancebackend.modules.auth.security.UserPrincipal;
import com.example.zhanfinancebackend.modules.crm.dto.UserLabelCreateRequest;
import com.example.zhanfinancebackend.modules.crm.dto.UserLabelDto;
import com.example.zhanfinancebackend.modules.crm.service.UserLabelService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/crm/labels")
@PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
public class UserLabelController {

    private final UserLabelService labelService;

    public UserLabelController(UserLabelService labelService) {
        this.labelService = labelService;
    }

    @GetMapping
    public ApiResponse<List<UserLabelDto>> getMyLabels(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(labelService.getUserLabels(principal.getId()));
    }

    @PostMapping
    public ApiResponse<UserLabelDto> createLabel(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UserLabelCreateRequest request
    ) {
        return ApiResponse.success(labelService.createLabel(principal.getUser(), request));
    }

    @DeleteMapping("/{labelId}")
    public ApiResponse<Void> deleteLabel(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long labelId
    ) {
        labelService.deleteLabel(principal.getUser(), labelId);
        return ApiResponse.success(null);
    }
}
