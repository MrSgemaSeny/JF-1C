package com.example.zhanfinancebackend.modules.telegram;

import com.example.zhanfinancebackend.ZhanFinanceBackendApplication;
import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.common.exception.ErrorCode;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.security.InternalTokenFilter;
import com.example.zhanfinancebackend.modules.auth.security.JwtService;
import com.example.zhanfinancebackend.modules.crm.repository.ClientProfileRepository;
import com.example.zhanfinancebackend.modules.crm.repository.TaskRepository;
import com.example.zhanfinancebackend.modules.documents.repository.DocumentRepository;
import com.example.zhanfinancebackend.modules.telegram.dto.TelegramAckRequest;
import com.example.zhanfinancebackend.modules.telegram.dto.TelegramBindRequest;
import com.example.zhanfinancebackend.modules.telegram.dto.TelegramBindResponse;
import com.example.zhanfinancebackend.modules.telegram.repository.TelegramLinkRepository;
import com.example.zhanfinancebackend.modules.telegram.service.TelegramLinkService;
import com.example.zhanfinancebackend.modules.telegram.service.TelegramOutboxService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = ZhanFinanceBackendApplication.class)
@AutoConfigureMockMvc
class TelegramAdversarialChallengeTest {

    private static final String CONFIGURED_INTERNAL_BOT_TOKEN = "test-internal-bot-token-secret-minimum-32-chars-long";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @MockitoBean
    private TelegramLinkService telegramLinkService;

    @MockitoBean
    private TelegramOutboxService telegramOutboxService;

    @MockitoBean
    private TelegramLinkRepository telegramLinkRepository;

    @MockitoBean
    private ClientProfileRepository clientProfileRepository;

    @MockitoBean
    private TaskRepository taskRepository;

    @MockitoBean
    private DocumentRepository documentRepository;

    private User testClientUser;
    private User testEmployeeUser;
    private User testAdminUser;

    @BeforeEach
    void setUp() {
        testClientUser = new User();
        testClientUser.setId(101L);
        testClientUser.setEmail("client.adversary@test.kz");
        testClientUser.setFullName("Client Adversary");
        testClientUser.setRole(Role.CLIENT);
        testClientUser.setEnabled(true);

        testEmployeeUser = new User();
        testEmployeeUser.setId(102L);
        testEmployeeUser.setEmail("employee.adversary@test.kz");
        testEmployeeUser.setFullName("Employee Adversary");
        testEmployeeUser.setRole(Role.EMPLOYEE);
        testEmployeeUser.setEnabled(true);

        testAdminUser = new User();
        testAdminUser.setId(103L);
        testAdminUser.setEmail("admin.adversary@test.kz");
        testAdminUser.setFullName("Admin Adversary");
        testAdminUser.setRole(Role.ADMIN);
        testAdminUser.setEnabled(true);
    }

    // ==========================================
    // 1. REJECTION OF REQUESTS WITHOUT TOKEN (401)
    // ==========================================

    @Test
    @DisplayName("GET /api/v1/internal/telegram/pending without token returns 401")
    void getPending_missingToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/internal/telegram/pending").contextPath("/api"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/v1/internal/telegram/bind without token returns 401")
    void postBind_missingToken_returns401() throws Exception {
        TelegramBindRequest request = new TelegramBindRequest("some-token", 123L, "user", "Murat", null);
        mockMvc.perform(post("/api/v1/internal/telegram/bind")
                        .contextPath("/api")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/v1/internal/telegram/chat/{chatId}/client without token returns 401")
    void getClientByChat_missingToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/internal/telegram/chat/12345/client").contextPath("/api"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("DELETE /api/v1/internal/telegram/chat/{chatId} without token returns 401")
    void deleteChat_missingToken_returns401() throws Exception {
        mockMvc.perform(delete("/api/v1/internal/telegram/chat/12345")
                        .contextPath("/api")
                        .with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/v1/internal/clients/{clientId}/tasks without token returns 401")
    void getClientTasks_missingToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/internal/clients/101/tasks").contextPath("/api"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/v1/internal/clients/{clientId}/documents without token returns 401")
    void getClientDocs_missingToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/internal/clients/101/documents").contextPath("/api"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/v1/internal/telegram/ack without token returns 401")
    void postAck_missingToken_returns401() throws Exception {
        TelegramAckRequest request = new TelegramAckRequest(List.of(), null);
        mockMvc.perform(post("/api/v1/internal/telegram/ack")
                        .contextPath("/api")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    // ==========================================
    // 2. REJECTION OF REQUESTS WITH INVALID TOKEN (401)
    // ==========================================

    @Test
    @DisplayName("Arbitrary wrong token returns 401")
    void wrongToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/internal/telegram/pending")
                        .contextPath("/api")
                        .header(InternalTokenFilter.INTERNAL_TOKEN_HEADER, "wrong-unauthorized-secret-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Blank whitespace token returns 401")
    void blankToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/internal/telegram/pending")
                        .contextPath("/api")
                        .header(InternalTokenFilter.INTERNAL_TOKEN_HEADER, "   "))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Off-by-one prefix token returns 401")
    void offByOnePrefix_returns401() throws Exception {
        String shortToken = CONFIGURED_INTERNAL_BOT_TOKEN.substring(0, CONFIGURED_INTERNAL_BOT_TOKEN.length() - 1);
        mockMvc.perform(get("/api/v1/internal/telegram/pending")
                        .contextPath("/api")
                        .header(InternalTokenFilter.INTERNAL_TOKEN_HEADER, shortToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Appended character token returns 401")
    void appendedToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/internal/telegram/pending")
                        .contextPath("/api")
                        .header(InternalTokenFilter.INTERNAL_TOKEN_HEADER, CONFIGURED_INTERNAL_BOT_TOKEN + "X"))
                .andExpect(status().isUnauthorized());
    }

    // ==========================================
    // 3. REJECTION OF REGULAR USER JWT (403)
    // ==========================================

    @Test
    @DisplayName("Client JWT on GET /api/v1/internal/telegram/pending returns 403 Forbidden")
    void clientJwt_onInternalEndpoint_returns403() throws Exception {
        String clientJwt = jwtService.generateAccessToken(testClientUser);

        mockMvc.perform(get("/api/v1/internal/telegram/pending")
                        .contextPath("/api")
                        .header("Authorization", "Bearer " + clientJwt))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Client JWT on POST /api/v1/internal/telegram/bind returns 403 Forbidden")
    void clientJwt_onInternalBind_returns403() throws Exception {
        String clientJwt = jwtService.generateAccessToken(testClientUser);
        TelegramBindRequest request = new TelegramBindRequest("some-token", 123L, "user", "Murat", null);

        mockMvc.perform(post("/api/v1/internal/telegram/bind")
                        .contextPath("/api")
                        .header("Authorization", "Bearer " + clientJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Employee JWT on GET /api/v1/internal/telegram/pending returns 403 Forbidden")
    void employeeJwt_onInternalEndpoint_returns403() throws Exception {
        String employeeJwt = jwtService.generateAccessToken(testEmployeeUser);

        mockMvc.perform(get("/api/v1/internal/telegram/pending")
                        .contextPath("/api")
                        .header("Authorization", "Bearer " + employeeJwt))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Admin JWT on GET /api/v1/internal/telegram/pending returns 403 Forbidden (Least Privilege)")
    void adminJwt_onInternalEndpoint_returns403() throws Exception {
        String adminJwt = jwtService.generateAccessToken(testAdminUser);

        mockMvc.perform(get("/api/v1/internal/telegram/pending")
                        .contextPath("/api")
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("User JWT coupled with invalid X-Internal-Token fails fast with 401 Unauthorized")
    void userJwtWithInvalidInternalToken_failsFastWith401() throws Exception {
        String clientJwt = jwtService.generateAccessToken(testClientUser);

        mockMvc.perform(get("/api/v1/internal/telegram/pending")
                        .contextPath("/api")
                        .header("Authorization", "Bearer " + clientJwt)
                        .header(InternalTokenFilter.INTERNAL_TOKEN_HEADER, "invalid-internal-secret"))
                .andExpect(status().isUnauthorized());
    }

    // ==========================================
    // 4. TOKEN EXPIRATION VIA MOCKMVC (400)
    // ==========================================

    @Test
    @DisplayName("MockMvc: POST /api/v1/internal/telegram/bind with expired token returns 400 Bad Request")
    void mockMvc_bindWithExpiredToken_returns400() throws Exception {
        when(telegramLinkService.bindTelegram(any(TelegramBindRequest.class)))
                .thenThrow(new ApiException(ErrorCode.INVALID_OR_EXPIRED_TOKEN, "Link token has expired"));

        TelegramBindRequest request = new TelegramBindRequest("expired-token", 123456L, "tg_user", "Murat", null);

        mockMvc.perform(post("/api/v1/internal/telegram/bind")
                        .contextPath("/api")
                        .header(InternalTokenFilter.INTERNAL_TOKEN_HEADER, CONFIGURED_INTERNAL_BOT_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.code").value("INVALID_OR_EXPIRED_TOKEN"))
                .andExpect(jsonPath("$.message").value("Link token has expired"));
    }

    // ==========================================
    // 5. ONE-TIME TOKEN CONSUMPTION VIA MOCKMVC (400)
    // ==========================================

    @Test
    @DisplayName("MockMvc: second bind attempt with consumed token returns 400 Bad Request")
    void mockMvc_secondBindAttempt_returns400() throws Exception {
        TelegramBindRequest request = new TelegramBindRequest("reused-token", 123456L, "tg_user", "Murat", null);
        TelegramBindResponse firstResponse = new TelegramBindResponse(true, 101L, "Client Adversary", "client@test.kz", "CLIENT");

        when(telegramLinkService.bindTelegram(any(TelegramBindRequest.class)))
                .thenReturn(firstResponse)
                .thenThrow(new ApiException(ErrorCode.INVALID_OR_EXPIRED_TOKEN, "Invalid or expired link token"));

        // 1st request -> 200 OK
        mockMvc.perform(post("/api/v1/internal/telegram/bind")
                        .contextPath("/api")
                        .header(InternalTokenFilter.INTERNAL_TOKEN_HEADER, CONFIGURED_INTERNAL_BOT_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // 2nd request with same token -> 400 Bad Request
        mockMvc.perform(post("/api/v1/internal/telegram/bind")
                        .contextPath("/api")
                        .header(InternalTokenFilter.INTERNAL_TOKEN_HEADER, CONFIGURED_INTERNAL_BOT_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_OR_EXPIRED_TOKEN"));
    }
}
