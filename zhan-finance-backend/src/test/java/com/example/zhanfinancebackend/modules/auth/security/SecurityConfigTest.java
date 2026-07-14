package com.example.zhanfinancebackend.modules.auth.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testEmailEndpoint_shouldRequireAuth() throws Exception {
        mockMvc.perform(post("/api/test-email"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void uploadsEndpoint_shouldRequireAuth() throws Exception {
        mockMvc.perform(get("/uploads/some-file.pdf"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void avatarsEndpoint_shouldBePublic() throws Exception {
        // According to our config, /uploads/avatars/** should be public, although the actual file might not exist (returns 404).
        // Let's just verify it doesn't return 401 Unauthorized.
        mockMvc.perform(get("/uploads/avatars/user-123.jpg"))
                .andExpect(status().isNotFound());
    }
}
