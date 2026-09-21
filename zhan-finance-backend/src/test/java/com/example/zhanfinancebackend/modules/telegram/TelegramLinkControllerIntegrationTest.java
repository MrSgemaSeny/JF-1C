package com.example.zhanfinancebackend.modules.telegram;

import com.example.zhanfinancebackend.ZhanFinanceBackendApplication;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.security.UserPrincipal;
import com.example.zhanfinancebackend.modules.telegram.dto.TelegramLinkStatusResponse;
import com.example.zhanfinancebackend.modules.telegram.dto.TelegramLinkTokenResponse;
import com.example.zhanfinancebackend.modules.telegram.service.TelegramLinkService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = ZhanFinanceBackendApplication.class)
@AutoConfigureMockMvc
class TelegramLinkControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TelegramLinkService telegramLinkService;

    private UserPrincipal testPrincipal;

    @BeforeEach
    void setUp() {
        User user = new User();
        user.setId(50L);
        user.setEmail("client@zhanfinance.kz");
        user.setFullName("Клиент Тест");
        user.setRole(Role.CLIENT);
        user.setEnabled(true);
        this.testPrincipal = new UserPrincipal(user);
    }

    @Test
    @DisplayName("POST /api/v1/telegram/link/generate without auth returns 401")
    void generateToken_unauthenticated_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/telegram/link/generate").contextPath("/api"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/v1/telegram/link/generate with user returns 200 and token payload")
    void generateToken_authenticated_returnsToken() throws Exception {
        Instant expires = Instant.now().plusSeconds(900);
        TelegramLinkTokenResponse response = new TelegramLinkTokenResponse(
                "token-abc-123",
                "https://t.me/zhanfinancebot?start=token-abc-123",
                expires
        );

        when(telegramLinkService.generateLinkToken(any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/telegram/link/generate")
                        .contextPath("/api")
                        .header("X-Requested-With", "XMLHttpRequest")
                        .contentType(MediaType.APPLICATION_JSON)
                        .with(user(testPrincipal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").value("token-abc-123"))
                .andExpect(jsonPath("$.data.deepLink").value("https://t.me/zhanfinancebot?start=token-abc-123"));
    }

    @Test
    @DisplayName("GET /api/v1/telegram/link/status returns link status")
    void getStatus_authenticated_returnsStatus() throws Exception {
        TelegramLinkStatusResponse response = new TelegramLinkStatusResponse(
                true,
                987654321L,
                "client_tg",
                Instant.now()
        );

        when(telegramLinkService.getLinkStatus(any())).thenReturn(response);

        mockMvc.perform(get("/api/v1/telegram/link/status")
                        .contextPath("/api")
                        .with(user(testPrincipal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.linked").value(true))
                .andExpect(jsonPath("$.data.chatId").value(987654321))
                .andExpect(jsonPath("$.data.telegramUsername").value("client_tg"));
    }

    @Test
    @DisplayName("DELETE /api/v1/telegram/link unlinks account successfully")
    void unlink_authenticated_returnsSuccess() throws Exception {
        doNothing().when(telegramLinkService).unlinkTelegram(any());

        mockMvc.perform(delete("/api/v1/telegram/link")
                        .contextPath("/api")
                        .header("X-Requested-With", "XMLHttpRequest")
                        .with(user(testPrincipal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(telegramLinkService).unlinkTelegram(any());
    }
}
