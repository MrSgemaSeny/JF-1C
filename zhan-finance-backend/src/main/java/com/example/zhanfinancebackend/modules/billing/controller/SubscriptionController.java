package com.example.zhanfinancebackend.modules.billing.controller;

import com.example.zhanfinancebackend.common.response.ApiResponse;
import com.example.zhanfinancebackend.modules.auth.security.UserPrincipal;
import com.example.zhanfinancebackend.modules.billing.dto.SubscriptionDto;
import com.example.zhanfinancebackend.modules.billing.service.SubscriptionService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @GetMapping
    public ApiResponse<List<SubscriptionDto>> findAll(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(subscriptionService.findAll(principal.getUser()));
    }

    @PostMapping
    public ApiResponse<SubscriptionDto> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SubscriptionDto request
    ) {
        return ApiResponse.success(subscriptionService.create(principal.getUser(), request));
    }

    @PutMapping("/{id}")
    public ApiResponse<SubscriptionDto> update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody SubscriptionDto request
    ) {
        return ApiResponse.success(subscriptionService.update(principal.getUser(), id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        subscriptionService.delete(principal.getUser(), id);
        return ApiResponse.success(null, "Subscription deleted");
    }
}
