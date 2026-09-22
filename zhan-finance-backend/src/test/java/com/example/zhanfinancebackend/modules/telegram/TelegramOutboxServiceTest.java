package com.example.zhanfinancebackend.modules.telegram;

import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.telegram.dto.TelegramAckItemDto;
import com.example.zhanfinancebackend.modules.telegram.dto.TelegramAckRequest;
import com.example.zhanfinancebackend.modules.telegram.dto.TelegramAckResponse;
import com.example.zhanfinancebackend.modules.telegram.dto.TelegramNotificationDto;
import com.example.zhanfinancebackend.modules.telegram.entity.TelegramLink;
import com.example.zhanfinancebackend.modules.telegram.entity.TelegramNotification;
import com.example.zhanfinancebackend.modules.telegram.repository.TelegramLinkRepository;
import com.example.zhanfinancebackend.modules.telegram.repository.TelegramNotificationRepository;
import com.example.zhanfinancebackend.modules.telegram.service.TelegramOutboxService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class TelegramOutboxServiceTest {

    private TelegramNotificationRepository telegramNotificationRepository;
    private TelegramLinkRepository telegramLinkRepository;
    private TelegramOutboxService telegramOutboxService;

    private User testUser;
    private TelegramLink activeLink;

    @BeforeEach
    void setUp() {
        telegramNotificationRepository = mock(TelegramNotificationRepository.class);
        telegramLinkRepository = mock(TelegramLinkRepository.class);
        telegramOutboxService = new TelegramOutboxService(
                telegramNotificationRepository,
                telegramLinkRepository,
                "https://mrsgemaseny.github.io/JF-1C"
        );

        testUser = new User();
        testUser.setId(10L);
        testUser.setFullName("Ерлан");

        activeLink = new TelegramLink(testUser, 777L, "erlan_tg");
    }

    @Test
    @DisplayName("enqueue saves notification when client has active Telegram link")
    void enqueue_withActiveLink_savesNotification() {
        when(telegramLinkRepository.findByUserIdAndIsActiveTrue(10L)).thenReturn(Optional.of(activeLink));

        telegramOutboxService.enqueue(testUser, "Задача обновлена", "Статус: В работе", "/client/tasks/101");

        ArgumentCaptor<TelegramNotification> captor = ArgumentCaptor.forClass(TelegramNotification.class);
        verify(telegramNotificationRepository).save(captor.capture());
        TelegramNotification saved = captor.getValue();

        assertEquals(777L, saved.getChatId());
        assertEquals("PENDING", saved.getStatus());
        assertEquals(0, saved.getAttempts());
        assertTrue(saved.getMessage().contains("<b>Задача обновлена</b>"));
        assertTrue(saved.getMessage().contains("Статус: В работе"));
        assertTrue(saved.getMessage().contains("<a href=\"https://mrsgemaseny.github.io/JF-1C/client/tasks/101\">Открыть в кабинете</a>"));
    }

    @Test
    @DisplayName("enqueue is a no-op when user has no linked Telegram account")
    void enqueue_withoutLink_noOp() {
        when(telegramLinkRepository.findByUserIdAndIsActiveTrue(10L)).thenReturn(Optional.empty());

        telegramOutboxService.enqueue(testUser, "Задача обновлена", "Статус: В работе", "/client/tasks/101");

        verify(telegramNotificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("getPendingNotifications retrieves pending items and maps to DTOs")
    void getPendingNotifications_returnsList() {
        TelegramNotification n1 = new TelegramNotification(777L, testUser, "Test 1");
        n1.setId(101L);
        when(telegramNotificationRepository.findByStatusAndAttemptsLessThanOrderByCreatedAtAsc(eq("PENDING"), eq(3), any()))
                .thenReturn(List.of(n1));

        List<TelegramNotificationDto> result = telegramOutboxService.getPendingNotifications(20);

        assertEquals(1, result.size());
        assertEquals(101L, result.get(0).id());
        assertEquals(777L, result.get(0).chatId());
        assertEquals("Test 1", result.get(0).message());
    }

    @Test
    @DisplayName("acknowledgeBatch sets status SENT on success and increments attempts on failure")
    void acknowledgeBatch_successAndFailure() {
        TelegramNotification successNotif = new TelegramNotification(777L, testUser, "Msg 1");
        successNotif.setId(1L);

        TelegramNotification failNotif = new TelegramNotification(888L, testUser, "Msg 2");
        failNotif.setId(2L);
        failNotif.setAttempts(2); // reaches max_attempts on next failure

        when(telegramNotificationRepository.findById(1L)).thenReturn(Optional.of(successNotif));
        when(telegramNotificationRepository.findById(2L)).thenReturn(Optional.of(failNotif));

        TelegramAckRequest request = new TelegramAckRequest(
                List.of(
                        new TelegramAckItemDto(1L, "SENT", true, null),
                        new TelegramAckItemDto(2L, "FAILED", false, "Telegram 403: Forbidden: bot was blocked by the user")
                ),
                null
        );

        when(telegramLinkRepository.findByChatId(888L)).thenReturn(Optional.of(activeLink));

        TelegramAckResponse response = telegramOutboxService.acknowledgeBatch(request);

        assertEquals(2, response.acknowledgedCount());
        assertEquals(1, response.successCount());
        assertEquals(1, response.failedCount());

        assertEquals("SENT", successNotif.getStatus());
        assertNotNull(successNotif.getProcessedAt());

        assertEquals(3, failNotif.getAttempts());
        assertEquals("FAILED", failNotif.getStatus());
        assertEquals("Telegram 403: Forbidden: bot was blocked by the user", failNotif.getLastError());

        // Verifies user was deactivated because bot was blocked
        assertFalse(activeLink.isActive());
        verify(telegramLinkRepository).save(activeLink);
    }
}
