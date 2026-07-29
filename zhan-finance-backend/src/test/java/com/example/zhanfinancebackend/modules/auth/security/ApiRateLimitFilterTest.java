package com.example.zhanfinancebackend.modules.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ApiRateLimitFilterTest {

    private ApiRateLimitFilter apiRateLimitFilter;

    @BeforeEach
    void setUp() {
        apiRateLimitFilter = new ApiRateLimitFilter();
    }

    @Test
    @DisplayName("Запросы к /api/auth/** проминаются без учета глобального rate limit")
    void testAuthEndpoints_Bypassed() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/auth/login");

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        apiRateLimitFilter.doFilterInternal(request, response, chain);

        verify(chain, times(1)).doFilter(request, response);
        assertNotEquals(429, response.getStatus());
    }

    @Test
    @DisplayName("Первый нормальный запрос к /api/courses проходит успешно")
    void testNormalRequest_Allowed() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/courses");
        request.setRemoteAddr("192.168.1.100");

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        apiRateLimitFilter.doFilterInternal(request, response, chain);

        verify(chain, times(1)).doFilter(request, response);
        assertNotEquals(429, response.getStatus());
    }
}
