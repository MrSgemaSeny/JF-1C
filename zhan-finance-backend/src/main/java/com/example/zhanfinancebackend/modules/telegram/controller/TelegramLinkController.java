// zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/telegram/controller/TelegramLinkController.java
package com.example.zhanfinancebackend.modules.telegram.controller;

import com.example.zhanfinancebackend.common.response.ApiResponse;
import com.example.zhanfinancebackend.modules.auth.security.UserPrincipal;
import com.example.zhanfinancebackend.modules.telegram.dto.TelegramLinkStatusResponse;
import com.example.zhanfinancebackend.modules.telegram.dto.TelegramLinkTokenResponse;
import com.example.zhanfinancebackend.modules.telegram.service.TelegramLinkService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/telegram/link")
@Tag(name = "Telegram Link", description = "Endpoints for managing user Telegram account linkage")
public class TelegramLinkController {

    private final TelegramLinkService telegramLinkService;

    public TelegramLinkController(TelegramLinkService telegramLinkService) {
        this.telegramLinkService = telegramLinkService;
    }

    @PostMapping("/generate")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Generate a 15-minute temporary linking token and Telegram deeplink")
    public ResponseEntity<ApiResponse<TelegramLinkTokenResponse>> generateLinkToken(
            @AuthenticationPrincipal UserPrincipal principal) {
        TelegramLinkTokenResponse response = telegramLinkService.generateLinkToken(principal.getUser());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/status")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get Telegram account link status for the current authenticated user")
    public ResponseEntity<ApiResponse<TelegramLinkStatusResponse>> getLinkStatus(
            @AuthenticationPrincipal UserPrincipal principal) {
        TelegramLinkStatusResponse response = telegramLinkService.getLinkStatus(principal.getUser());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Unlink Telegram account for the current authenticated user")
    public ResponseEntity<ApiResponse<Void>> unlinkTelegram(
            @AuthenticationPrincipal UserPrincipal principal) {
        telegramLinkService.unlinkTelegram(principal.getUser());
        return ResponseEntity.ok(ApiResponse.success(null, "Telegram account unlinked successfully"));
    }
}