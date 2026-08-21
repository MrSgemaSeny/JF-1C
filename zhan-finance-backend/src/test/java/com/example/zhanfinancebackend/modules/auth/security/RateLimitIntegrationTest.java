package com.example.zhanfinancebackend.modules.auth.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class RateLimitIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Actuator health check endpoint bypasses rate limiting")
    void testActuatorHealth_BypassesRateLimiting() throws Exception {
        // Can be queried many times without 429
        for (int i = 0; i < 25; i++) {
            mockMvc.perform(get("/actuator/health"))
                    .andExpect(result -> org.junit.jupiter.api.Assertions.assertNotEquals(429, result.getResponse().getStatus()));
        }
    }

    @Test
    @DisplayName("Document download tier limit is enforced at 20 requests per minute")
    void testDocumentDownloadRateLimit_MockMvc() throws Exception {
        // Perform 20 requests
        for (int i = 0; i < 20; i++) {
            mockMvc.perform(get("/api/v1/documents/non-existent-doc/download")
                            .contextPath("/api")
                            .with(user("rate_doc_user").roles("ADMIN")))
                    .andExpect(result -> {
                        int status = result.getResponse().getStatus();
                        org.junit.jupiter.api.Assertions.assertNotEquals(429, status);
                    });
        }

        // 21st request should receive 429 Too Many Requests
        mockMvc.perform(get("/api/v1/documents/non-existent-doc/download")
                        .contextPath("/api")
                        .with(user("rate_doc_user").roles("ADMIN")))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string("Retry-After", "60"));
    }

    @Test
    @DisplayName("Per-user isolation: User 1 exceeding search limit gets 429 while User 2 gets allowed")
    void testSearchUserIsolation_MockMvc() throws Exception {
        // User 1 performs 30 search requests
        for (int i = 0; i < 30; i++) {
            mockMvc.perform(get("/api/v1/search")
                            .contextPath("/api")
                            .param("q", "test")
                            .with(user("search_user_1").roles("ADMIN")))
                    .andExpect(result -> {
                        int status = result.getResponse().getStatus();
                        org.junit.jupiter.api.Assertions.assertNotEquals(429, status);
                    });
        }

        // User 1 31st search request receives 429
        mockMvc.perform(get("/api/v1/search")
                        .contextPath("/api")
                        .param("q", "test")
                        .with(user("search_user_1").roles("ADMIN")))
                .andExpect(status().isTooManyRequests());

        // User 2 search request is NOT blocked
        mockMvc.perform(get("/api/v1/search")
                        .contextPath("/api")
                        .param("q", "test")
                        .with(user("search_user_2").roles("ADMIN")))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    org.junit.jupiter.api.Assertions.assertNotEquals(429, status);
                });
    }
}
