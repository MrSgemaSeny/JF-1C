package com.example.zhanfinancebackend.modules.auth.controller;

import com.example.zhanfinancebackend.common.response.ApiResponse;
import com.example.zhanfinancebackend.modules.auth.dto.AuthResponse;
import com.example.zhanfinancebackend.modules.auth.dto.LoginRequest;
import com.example.zhanfinancebackend.modules.auth.dto.RefreshRequest;
import com.example.zhanfinancebackend.modules.auth.dto.RegisterRequest;
import com.example.zhanfinancebackend.modules.auth.dto.GoogleLoginRequest;
import com.example.zhanfinancebackend.modules.auth.dto.CheckEmailRequest;
import com.example.zhanfinancebackend.modules.auth.dto.CheckEmailResponse;
import com.example.zhanfinancebackend.modules.auth.service.AuthService;
import com.example.zhanfinancebackend.modules.auth.service.GoogleAuthService;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final GoogleAuthService googleAuthService;

    public AuthController(AuthService authService, GoogleAuthService googleAuthService) {
        this.authService = authService;
        this.googleAuthService = googleAuthService;
    }

    @PostMapping("/google")
    public ApiResponse<AuthResponse> loginWithGoogle(@Valid @RequestBody GoogleLoginRequest request) {
        AuthResponse response = googleAuthService.loginWithGoogle(request.credential(), request.role());
        if (response == null) {
            return ApiResponse.success(null, "Заявка на регистрацию отправлена. Ожидайте подтверждения администратора.");
        }
        return ApiResponse.success(response);
    }

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        Role requestedRole = request.role();
        if (requestedRole != Role.EMPLOYEE && requestedRole != Role.CLIENT) {
            requestedRole = Role.CLIENT;
        }
        RegisterRequest sanitizedRequest = new RegisterRequest(
                request.fullName(),
                request.email(),
                request.password(),
                requestedRole,
                request.phone(),
                request.companyName()
        );
        AuthResponse response = authService.register(sanitizedRequest);
        if (response == null) {
            return ApiResponse.success(null, "Заявка на регистрацию отправлена. Ожидайте подтверждения администратора.");
        }
        return ApiResponse.success(response);
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success(authService.login(request));
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        return ApiResponse.success(authService.refresh(request));
    }

    @PostMapping("/check-email")
    public ApiResponse<CheckEmailResponse> checkEmail(@Valid @RequestBody CheckEmailRequest request) {
        return ApiResponse.success(authService.checkEmail(request.email()));
    }
}
