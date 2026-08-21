package com.example.zhanfinancebackend.modules.auth.security;

import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ApiRateLimitFilterTest {

    private JwtService jwtService;
    private ApiRateLimitFilter apiRateLimitFilter;

    @BeforeEach
    void setUp() {
        jwtService = mock(JwtService.class);
        apiRateLimitFilter = new ApiRateLimitFilter(jwtService);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateUser(Long userId, String email) {
        User user = new User();
        user.setId(userId);
        user.setEmail(email);
        user.setRole(Role.CLIENT);
        user.setEnabled(true);
        UserPrincipal principal = new UserPrincipal(user);
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("OPTIONS preflight requests pass through immediately")
    void testOptionsRequest_Bypassed() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setMethod("OPTIONS");
        request.setRequestURI("/api/v1/crm/tasks");

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        apiRateLimitFilter.doFilterInternal(request, response, chain);

        verify(chain, times(1)).doFilter(request, response);
        assertEquals(200, response.getStatus());
    }

    @Test
    @DisplayName("Auth endpoints and health checks bypass rate limiting")
    void testWhitelistedEndpoints_Bypassed() throws ServletException, IOException {
        String[] whitelisted = {
                "/api/v1/auth/login",
                "/api/auth/refresh",
                "/actuator/health",
                "/api/actuator/info",
                "/health",
                "/api/health",
                "/uploads/avatars/user-123.jpg",
                "/swagger-ui/index.html",
                "/v3/api-docs/swagger-config"
        };

        for (String uri : whitelisted) {
            MockHttpServletRequest request = new MockHttpServletRequest();
            request.setRequestURI(uri);
            MockHttpServletResponse response = new MockHttpServletResponse();
            FilterChain chain = mock(FilterChain.class);

            apiRateLimitFilter.doFilterInternal(request, response, chain);

            verify(chain, times(1)).doFilter(request, response);
            assertNotEquals(429, response.getStatus());
        }
    }

    @Test
    @DisplayName("Per-user isolation: User A exceeding limit gets 429 while User B is allowed")
    void testPerUserIsolation_TasksEndpoint() throws ServletException, IOException {
        // User A (ID 101) makes 100 task requests
        authenticateUser(101L, "userA@example.com");
        for (int i = 0; i < 100; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest();
            request.setRequestURI("/api/v1/crm/tasks");
            request.setRemoteAddr("192.168.1.10");
            MockHttpServletResponse response = new MockHttpServletResponse();
            FilterChain chain = mock(FilterChain.class);

            apiRateLimitFilter.doFilterInternal(request, response, chain);
            assertEquals(200, response.getStatus());
            verify(chain, times(1)).doFilter(request, response);
        }

        // 101st request by User A is blocked with 429
        MockHttpServletRequest blockedRequest = new MockHttpServletRequest();
        blockedRequest.setRequestURI("/api/v1/crm/tasks");
        blockedRequest.setRemoteAddr("192.168.1.10");
        MockHttpServletResponse blockedResponse = new MockHttpServletResponse();
        FilterChain blockedChain = mock(FilterChain.class);

        apiRateLimitFilter.doFilterInternal(blockedRequest, blockedResponse, blockedChain);
        assertEquals(429, blockedResponse.getStatus());
        assertEquals("60", blockedResponse.getHeader("Retry-After"));
        assertTrue(blockedResponse.getContentAsString().contains("Too many requests"));
        verify(blockedChain, never()).doFilter(blockedRequest, blockedResponse);

        // User B (ID 102) with SAME IP is allowed
        authenticateUser(102L, "userB@example.com");
        MockHttpServletRequest userBRequest = new MockHttpServletRequest();
        userBRequest.setRequestURI("/api/v1/crm/tasks");
        userBRequest.setRemoteAddr("192.168.1.10");
        MockHttpServletResponse userBResponse = new MockHttpServletResponse();
        FilterChain userBChain = mock(FilterChain.class);

        apiRateLimitFilter.doFilterInternal(userBRequest, userBResponse, userBChain);
        assertEquals(200, userBResponse.getStatus());
        verify(userBChain, times(1)).doFilter(userBRequest, userBResponse);
    }

    @Test
    @DisplayName("Unauthenticated requests are rate limited by IP with isolation between IPs")
    void testIpFallback_UnauthenticatedRequests() throws ServletException, IOException {
        String ip1 = "10.0.0.1";
        String ip2 = "10.0.0.2";

        // IP 1 makes 100 general requests
        for (int i = 0; i < 100; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest();
            request.setRequestURI("/api/v1/courses");
            request.setRemoteAddr(ip1);
            MockHttpServletResponse response = new MockHttpServletResponse();
            FilterChain chain = mock(FilterChain.class);

            apiRateLimitFilter.doFilterInternal(request, response, chain);
            assertEquals(200, response.getStatus());
        }

        // 101st request from IP 1 is blocked
        MockHttpServletRequest blockedRequest = new MockHttpServletRequest();
        blockedRequest.setRequestURI("/api/v1/courses");
        blockedRequest.setRemoteAddr(ip1);
        MockHttpServletResponse blockedResponse = new MockHttpServletResponse();
        FilterChain blockedChain = mock(FilterChain.class);

        apiRateLimitFilter.doFilterInternal(blockedRequest, blockedResponse, blockedChain);
        assertEquals(429, blockedResponse.getStatus());

        // IP 2 is not affected
        MockHttpServletRequest ip2Request = new MockHttpServletRequest();
        ip2Request.setRequestURI("/api/v1/courses");
        ip2Request.setRemoteAddr(ip2);
        MockHttpServletResponse ip2Response = new MockHttpServletResponse();
        FilterChain ip2Chain = mock(FilterChain.class);

        apiRateLimitFilter.doFilterInternal(ip2Request, ip2Response, ip2Chain);
        assertEquals(200, ip2Response.getStatus());
        verify(ip2Chain, times(1)).doFilter(ip2Request, ip2Response);
    }

    @Test
    @DisplayName("Document downloads limit is 20 requests per minute")
    void testDocumentDownloadsLimit() throws ServletException, IOException {
        authenticateUser(200L, "docuser@example.com");

        for (int i = 0; i < 20; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest();
            request.setRequestURI("/api/v1/documents/123/download");
            MockHttpServletResponse response = new MockHttpServletResponse();
            FilterChain chain = mock(FilterChain.class);

            apiRateLimitFilter.doFilterInternal(request, response, chain);
            assertEquals(200, response.getStatus());
        }

        // 21st request hits 429
        MockHttpServletRequest blockedRequest = new MockHttpServletRequest();
        blockedRequest.setRequestURI("/api/v1/documents/123/download");
        MockHttpServletResponse blockedResponse = new MockHttpServletResponse();
        FilterChain blockedChain = mock(FilterChain.class);

        apiRateLimitFilter.doFilterInternal(blockedRequest, blockedResponse, blockedChain);
        assertEquals(429, blockedResponse.getStatus());
    }

    @Test
    @DisplayName("Global search limit is 30 requests per minute")
    void testGlobalSearchLimit() throws ServletException, IOException {
        authenticateUser(300L, "searchuser@example.com");

        for (int i = 0; i < 30; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest();
            request.setRequestURI("/api/v1/search");
            request.setParameter("q", "invoice");
            MockHttpServletResponse response = new MockHttpServletResponse();
            FilterChain chain = mock(FilterChain.class);

            apiRateLimitFilter.doFilterInternal(request, response, chain);
            assertEquals(200, response.getStatus());
        }

        // 31st request hits 429
        MockHttpServletRequest blockedRequest = new MockHttpServletRequest();
        blockedRequest.setRequestURI("/api/v1/search");
        blockedRequest.setParameter("q", "invoice");
        MockHttpServletResponse blockedResponse = new MockHttpServletResponse();
        FilterChain blockedChain = mock(FilterChain.class);

        apiRateLimitFilter.doFilterInternal(blockedRequest, blockedResponse, blockedChain);
        assertEquals(429, blockedResponse.getStatus());
    }

    @Test
    @DisplayName("Cross-tier quota independence: exceeding search limit does not block task requests")
    void testCrossTierQuotaIndependence() throws ServletException, IOException {
        authenticateUser(400L, "independent@example.com");

        // Exhaust search quota (30)
        for (int i = 0; i < 30; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest();
            request.setRequestURI("/api/v1/search");
            MockHttpServletResponse response = new MockHttpServletResponse();
            apiRateLimitFilter.doFilterInternal(request, response, mock(FilterChain.class));
        }

        // Search is now 429
        MockHttpServletRequest searchReq = new MockHttpServletRequest();
        searchReq.setRequestURI("/api/v1/search");
        MockHttpServletResponse searchResp = new MockHttpServletResponse();
        apiRateLimitFilter.doFilterInternal(searchReq, searchResp, mock(FilterChain.class));
        assertEquals(429, searchResp.getStatus());

        // Tasks request is still allowed
        MockHttpServletRequest taskReq = new MockHttpServletRequest();
        taskReq.setRequestURI("/api/v1/crm/tasks");
        MockHttpServletResponse taskResp = new MockHttpServletResponse();
        FilterChain taskChain = mock(FilterChain.class);

        apiRateLimitFilter.doFilterInternal(taskReq, taskResp, taskChain);
        assertEquals(200, taskResp.getStatus());
        verify(taskChain, times(1)).doFilter(taskReq, taskResp);
    }

    @Test
    @DisplayName("Defense-in-depth: resolves userId from JWT cookie when SecurityContext is unpopulated")
    void testJwtCookieFallback() throws ServletException, IOException {
        when(jwtService.extractUserIdIfValidAccessToken("valid-token-123")).thenReturn(555L);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/v1/crm/tasks");
        request.setCookies(new Cookie("accessToken", "valid-token-123"));

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        apiRateLimitFilter.doFilterInternal(request, response, chain);

        assertEquals(200, response.getStatus());
        verify(chain, times(1)).doFilter(request, response);
        verify(jwtService, times(1)).extractUserIdIfValidAccessToken("valid-token-123");
    }

    @Test
    @DisplayName("Resolves client IP from X-Forwarded-For multi-IP list")
    void testXForwardedForMultiIp() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/v1/courses");
        request.addHeader("X-Forwarded-For", "203.0.113.195, 70.41.3.18, 150.172.238.178");

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        apiRateLimitFilter.doFilterInternal(request, response, chain);

        assertEquals(200, response.getStatus());
        verify(chain, times(1)).doFilter(request, response);
    }
}
