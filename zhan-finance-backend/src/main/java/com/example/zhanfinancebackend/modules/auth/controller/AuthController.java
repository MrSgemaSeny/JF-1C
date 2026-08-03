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
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.CookieValue;

@RestController
@RequestMapping("/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final GoogleAuthService googleAuthService;

    public AuthController(AuthService authService, GoogleAuthService googleAuthService) {
        this.authService = authService;
        this.googleAuthService = googleAuthService;
    }

    private void setTokenCookies(HttpServletResponse response, AuthResponse authResponse) {
        if (authResponse == null || authResponse.accessToken() == null) {
            return;
        }

        // SameSite=None; Secure - required for cross-domain requests between github.io and fly.dev
        ResponseCookie accessCookie = ResponseCookie.from("accessToken", authResponse.accessToken())
                .httpOnly(true)
                .secure(true)
                .sameSite("None")
                .path("/")
                .maxAge(15 * 60) // 15 minutes
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());

        if (authResponse.refreshToken() != null) {
            ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", authResponse.refreshToken())
                    .httpOnly(true)
                    .secure(true)
                    .sameSite("None")
                    .path("/")
                    .maxAge(7 * 24 * 60 * 60) // 7 days
                    .build();
            response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
        }
    }

    private void clearTokenCookies(HttpServletResponse response) {
        ResponseCookie accessCookie = ResponseCookie.from("accessToken", "")
                .httpOnly(true)
                .secure(true)
                .sameSite("None")
                .path("/")
                .maxAge(0)
                .build();
        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(true)
                .sameSite("None")
                .path("/")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
    }

    @PostMapping("/google")
    public ApiResponse<AuthResponse> loginWithGoogle(@Valid @RequestBody GoogleLoginRequest request, HttpServletResponse httpServletResponse) {
        AuthResponse response = googleAuthService.loginWithGoogle(request.credential(), request.role());
        if (response == null) {
            return ApiResponse.success(null, "Заявка на регистрацию отправлена. Ожидайте подтверждения администратора.");
        }
        setTokenCookies(httpServletResponse, response);
        return ApiResponse.success(response);
    }

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request, HttpServletResponse httpServletResponse) {
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
        setTokenCookies(httpServletResponse, response);
        return ApiResponse.success(response);
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletResponse httpServletResponse) {
        AuthResponse response = authService.login(request);
        setTokenCookies(httpServletResponse, response);
        return ApiResponse.success(response);
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthResponse> refresh(@CookieValue(name = "refreshToken", required = false) String refreshTokenCookie, 
                                             @RequestBody(required = false) RefreshRequest request, 
                                             HttpServletResponse httpServletResponse) {
        String tokenToRefresh = refreshTokenCookie;
        if (tokenToRefresh == null && request != null) {
            tokenToRefresh = request.refreshToken();
        }
        if (tokenToRefresh == null) {
            throw new com.example.zhanfinancebackend.common.exception.ApiException(
                com.example.zhanfinancebackend.common.exception.ErrorCode.UNAUTHORIZED, 
                "Refresh token is missing"
            );
        }
        AuthResponse response = authService.refresh(new RefreshRequest(tokenToRefresh));
        setTokenCookies(httpServletResponse, response);
        return ApiResponse.success(response);
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@CookieValue(name = "refreshToken", required = false) String refreshTokenCookie, HttpServletResponse httpServletResponse) {
        authService.logout(refreshTokenCookie);
        clearTokenCookies(httpServletResponse);
        return ApiResponse.success(null, "Успешный выход");
    }

    @org.springframework.web.bind.annotation.GetMapping("/me")
    public ApiResponse<AuthResponse> me(@org.springframework.security.core.annotation.AuthenticationPrincipal com.example.zhanfinancebackend.modules.auth.security.UserPrincipal principal) {
        if (principal == null) {
            throw new com.example.zhanfinancebackend.common.exception.ApiException(
                com.example.zhanfinancebackend.common.exception.ErrorCode.UNAUTHORIZED, 
                "Unauthorized"
            );
        }
        return ApiResponse.success(authService.me(principal.getUser()));
    }

    @PostMapping("/check-email")
    public ApiResponse<CheckEmailResponse> checkEmail(@Valid @RequestBody CheckEmailRequest request) {
        return ApiResponse.success(authService.checkEmail(request.email()));
    }
}
