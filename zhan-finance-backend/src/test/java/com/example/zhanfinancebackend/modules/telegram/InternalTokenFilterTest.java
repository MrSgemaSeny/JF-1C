package com.example.zhanfinancebackend.modules.telegram;

import com.example.zhanfinancebackend.modules.auth.security.InternalTokenFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class InternalTokenFilterTest {

    private static final String CONFIGURED_SECRET = "super-secret-internal-token-minimum-32-chars-long";

    private InternalTokenFilter filter;
    private FilterChain filterChain;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
        filter = new InternalTokenFilter(CONFIGURED_SECRET, objectMapper);
        filterChain = mock(FilterChain.class);
    }

    @Test
    @DisplayName("Non-internal paths bypass InternalTokenFilter without checking header")
    void nonInternalPaths_bypassed() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setServletPath("/v1/tasks");
        request.setRequestURI("/api/v1/tasks");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertEquals(HttpServletResponse.SC_OK, response.getStatus());
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    @DisplayName("Internal path with missing X-Internal-Token delegates to filter chain without authenticating")
    void internalPath_missingToken_delegatesToFilterChain() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setServletPath("/v1/internal/telegram/pending");
        request.setRequestURI("/api/v1/internal/telegram/pending");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    @DisplayName("Internal path with wrong token returns 401 Unauthorized")
    void internalPath_wrongToken_returns401() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setServletPath("/v1/internal/telegram/pending");
        request.setRequestURI("/api/v1/internal/telegram/pending");
        request.addHeader(InternalTokenFilter.INTERNAL_TOKEN_HEADER, "invalid-wrong-token-value");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        verify(filterChain, never()).doFilter(request, response);
        assertEquals(HttpServletResponse.SC_UNAUTHORIZED, response.getStatus());
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    @DisplayName("Internal path with valid X-Internal-Token sets ROLE_INTERNAL_BOT and calls chain")
    void internalPath_validToken_authenticatesSuccessfully() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setServletPath("/v1/internal/telegram/pending");
        request.setRequestURI("/api/v1/internal/telegram/pending");
        request.addHeader(InternalTokenFilter.INTERNAL_TOKEN_HEADER, CONFIGURED_SECRET);
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertEquals(HttpServletResponse.SC_OK, response.getStatus());

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(auth);
        assertEquals(InternalTokenFilter.INTERNAL_BOT_PRINCIPAL, auth.getPrincipal());
        assertTrue(auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(InternalTokenFilter.ROLE_INTERNAL_BOT)));
    }
}
