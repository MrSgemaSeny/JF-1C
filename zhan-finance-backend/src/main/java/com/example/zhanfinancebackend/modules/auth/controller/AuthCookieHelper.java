package com.example.zhanfinancebackend.modules.auth.controller;

import com.example.zhanfinancebackend.modules.auth.dto.AuthResponse;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;

public class AuthCookieHelper {

    public static void setTokenCookies(HttpServletResponse response, AuthResponse authResponse) {
        if (authResponse == null || authResponse.accessToken() == null) {
            return;
        }

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

    public static void clearTokenCookies(HttpServletResponse response) {
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
}
