package com.example.zhanfinancebackend.modules.auth.controller;

import com.example.zhanfinancebackend.common.response.ApiResponse;
import com.example.zhanfinancebackend.modules.auth.dto.AuthResponse;
import com.example.zhanfinancebackend.modules.auth.dto.TwoFactorConfirmRequest;
import com.example.zhanfinancebackend.modules.auth.dto.TwoFactorDisableRequest;
import com.example.zhanfinancebackend.modules.auth.dto.TwoFactorSetupDto;
import com.example.zhanfinancebackend.modules.auth.dto.TwoFactorVerifyRequest;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.security.UserPrincipal;
import com.example.zhanfinancebackend.modules.auth.service.AuthService;
import com.example.zhanfinancebackend.modules.auth.service.TwoFactorService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/auth/2fa")
public class TwoFactorController {

    private final TwoFactorService twoFactorService;
    private final AuthService authService;

    public TwoFactorController(TwoFactorService twoFactorService, AuthService authService) {
        this.twoFactorService = twoFactorService;
        this.authService = authService;
    }

    @PostMapping("/verify")
    public ApiResponse<AuthResponse> verify(@Valid @RequestBody TwoFactorVerifyRequest request, jakarta.servlet.http.HttpServletResponse httpServletResponse) {
        User user = twoFactorService.validatePreAuthToken(request.preAuthToken());

        if (!twoFactorService.verifyCode(user, request.code())) {
            throw new com.example.zhanfinancebackend.common.exception.UnauthorizedException("Неверный код 2FA");
        }

        twoFactorService.deletePreAuthToken(request.preAuthToken());
        AuthResponse response = authService.buildFullAuthResponse(user);
        AuthCookieHelper.setTokenCookies(httpServletResponse, response);
        return ApiResponse.success(response);
    }

    @GetMapping("/setup")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<TwoFactorSetupDto> getSetup(@AuthenticationPrincipal UserPrincipal principal) {
        TwoFactorSetupDto setupDto = twoFactorService.generateSetup(principal.getUser());
        return ApiResponse.success(setupDto);
    }

    @PostMapping("/setup/confirm")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> confirmSetup(
            @Valid @RequestBody TwoFactorConfirmRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        twoFactorService.confirmSetup(principal.getUser(), request.secret(), request.code());
        return ApiResponse.success(null);
    }

    @PostMapping("/disable")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> disable(
            @Valid @RequestBody TwoFactorDisableRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        twoFactorService.disable2FA(principal.getUser(), request.code());
        return ApiResponse.success(null);
    }
}
