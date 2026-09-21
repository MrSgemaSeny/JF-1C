package com.example.zhanfinancebackend.modules.telegram;

import com.example.zhanfinancebackend.ZhanFinanceBackendApplication;
import com.example.zhanfinancebackend.common.exception.ResourceNotFoundException;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.security.InternalTokenFilter;
import com.example.zhanfinancebackend.modules.crm.entity.ClientProfile;
import com.example.zhanfinancebackend.modules.crm.entity.Stage;
import com.example.zhanfinancebackend.modules.crm.entity.StageType;
import com.example.zhanfinancebackend.modules.crm.entity.Task;
import com.example.zhanfinancebackend.modules.crm.repository.ClientProfileRepository;
import com.example.zhanfinancebackend.modules.crm.repository.TaskRepository;
import com.example.zhanfinancebackend.modules.documents.entity.Document;
import com.example.zhanfinancebackend.modules.documents.repository.DocumentRepository;
import com.example.zhanfinancebackend.modules.telegram.dto.*;
import com.example.zhanfinancebackend.modules.telegram.entity.TelegramLink;
import com.example.zhanfinancebackend.modules.telegram.repository.TelegramLinkRepository;
import com.example.zhanfinancebackend.modules.telegram.service.TelegramLinkService;
import com.example.zhanfinancebackend.modules.telegram.service.TelegramOutboxService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = ZhanFinanceBackendApplication.class)
@AutoConfigureMockMvc
class InternalTelegramControllerIntegrationTest {

    private static final String INTERNAL_TOKEN = "test-internal-bot-token-secret-minimum-32-chars-long";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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

    @Test
    @DisplayName("Request to /api/v1/internal without token returns 401")
    void missingToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/internal/telegram/pending").contextPath("/api"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Request to /api/v1/internal with invalid token returns 401")
    void invalidToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/internal/telegram/pending")
                        .contextPath("/api")
                        .header(InternalTokenFilter.INTERNAL_TOKEN_HEADER, "invalid-token-here"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/v1/internal/telegram/bind with valid token binds chat successfully")
    void bindTelegram_withValidToken_returns200() throws Exception {
        TelegramBindRequest request = new TelegramBindRequest("valid-token", 123456L, "tg_user", "Alihan", null);
        TelegramBindResponse response = new TelegramBindResponse(true, 42L, "Алихан", "alihan@test.kz", "CLIENT");

        when(telegramLinkService.bindTelegram(any(TelegramBindRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/internal/telegram/bind")
                        .contextPath("/api")
                        .header(InternalTokenFilter.INTERNAL_TOKEN_HEADER, INTERNAL_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.userId").value(42))
                .andExpect(jsonPath("$.fullName").value("Алихан"));
    }

    @Test
    @DisplayName("GET /api/v1/internal/telegram/chat/{chatId}/client returns client summary")
    void getClientByChatId_found_returns200() throws Exception {
        User clientUser = new User();
        clientUser.setId(42L);
        clientUser.setFullName("Алихан");
        clientUser.setEmail("alihan@test.kz");
        clientUser.setRole(Role.CLIENT);

        TelegramLink link = new TelegramLink(clientUser, 123456L, "tg_user");

        ClientProfile profile = new ClientProfile(clientUser);
        profile.setPhone("+77011234567");
        profile.setCompanyName("ТОО Береке");

        when(telegramLinkRepository.findByChatIdAndIsActiveTrue(123456L)).thenReturn(Optional.of(link));
        when(clientProfileRepository.findByUser(clientUser)).thenReturn(Optional.of(profile));

        mockMvc.perform(get("/api/v1/internal/telegram/chat/123456/client")
                        .contextPath("/api")
                        .header(InternalTokenFilter.INTERNAL_TOKEN_HEADER, INTERNAL_TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.linked").value(true))
                .andExpect(jsonPath("$.userId").value(42))
                .andExpect(jsonPath("$.companyName").value("ТОО Береке"))
                .andExpect(jsonPath("$.phone").value("+77011234567"));
    }

    @Test
    @DisplayName("GET /api/v1/internal/clients/{clientId}/tasks returns task list")
    void getClientTasks_returnsTasks() throws Exception {
        Task task = new Task();
        task.setId(101L);
        task.setTitle("Сдача налоговой отчетности");
        task.setDueDate(LocalDate.of(2026, 9, 30));

        Stage stage = new Stage();
        stage.setName("В работе");
        stage.setType(StageType.OPEN);
        task.setStage(stage);

        when(taskRepository.findAllByClientWithDetails(42L)).thenReturn(List.of(task));

        mockMvc.perform(get("/api/v1/internal/clients/42/tasks")
                        .contextPath("/api")
                        .header(InternalTokenFilter.INTERNAL_TOKEN_HEADER, INTERNAL_TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(101))
                .andExpect(jsonPath("$[0].title").value("Сдача налоговой отчетности"))
                .andExpect(jsonPath("$[0].stageName").value("В работе"))
                .andExpect(jsonPath("$[0].stageType").value("OPEN"));
    }

    @Test
    @DisplayName("GET /api/v1/internal/clients/{clientId}/documents returns document list")
    void getClientDocuments_returnsDocuments() throws Exception {
        Document doc = new Document(new User(), new User(), "Акт_сверки.pdf", "storage-key", "application/pdf", 1024L);
        doc.setId(201L);
        doc.setStatus("UPLOADED");

        when(documentRepository.findByUserIdOrderByCreatedAtDesc(eq(42L), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(doc)));

        mockMvc.perform(get("/api/v1/internal/clients/42/documents")
                        .contextPath("/api")
                        .header(InternalTokenFilter.INTERNAL_TOKEN_HEADER, INTERNAL_TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(201))
                .andExpect(jsonPath("$[0].fileName").value("Акт_сверки.pdf"))
                .andExpect(jsonPath("$[0].status").value("UPLOADED"));
    }

    @Test
    @DisplayName("GET /api/v1/internal/telegram/pending returns outbox notifications")
    void getPendingNotifications_returnsList() throws Exception {
        TelegramNotificationDto notif = new TelegramNotificationDto(
                1001L,
                123456L,
                42L,
                "<b>Уведомление</b>",
                0,
                Instant.now()
        );

        when(telegramOutboxService.getPendingNotifications(50)).thenReturn(List.of(notif));

        mockMvc.perform(get("/api/v1/internal/telegram/pending")
                        .contextPath("/api")
                        .header(InternalTokenFilter.INTERNAL_TOKEN_HEADER, INTERNAL_TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1001))
                .andExpect(jsonPath("$[0].chatId").value(123456))
                .andExpect(jsonPath("$[0].message").value("<b>Уведомление</b>"));
    }

    @Test
    @DisplayName("POST /api/v1/internal/telegram/ack acknowledges batches successfully")
    void acknowledgeBatch_returnsCounts() throws Exception {
        TelegramAckRequest request = new TelegramAckRequest(
                List.of(new TelegramAckItemDto(1001L, "SENT", true, null)),
                null
        );
        TelegramAckResponse response = new TelegramAckResponse(1, 1, 1, 0);

        when(telegramOutboxService.acknowledgeBatch(any(TelegramAckRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/internal/telegram/ack")
                        .contextPath("/api")
                        .header(InternalTokenFilter.INTERNAL_TOKEN_HEADER, INTERNAL_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.acknowledgedCount").value(1))
                .andExpect(jsonPath("$.successCount").value(1));
    }
}
