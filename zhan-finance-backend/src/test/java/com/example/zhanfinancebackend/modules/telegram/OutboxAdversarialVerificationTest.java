package com.example.zhanfinancebackend.modules.telegram;

import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.notifications.entity.Notification;
import com.example.zhanfinancebackend.modules.notifications.repository.NotificationRepository;
import com.example.zhanfinancebackend.modules.notifications.service.EmailNotificationService;
import com.example.zhanfinancebackend.modules.notifications.service.NotificationService;
import com.example.zhanfinancebackend.modules.notifications.service.TelegramNotifierService;
import com.example.zhanfinancebackend.modules.telegram.dto.TelegramBindRequest;
import com.example.zhanfinancebackend.modules.telegram.dto.TelegramBindResponse;
import com.example.zhanfinancebackend.modules.telegram.entity.TelegramLink;
import com.example.zhanfinancebackend.modules.telegram.entity.TelegramLinkToken;
import com.example.zhanfinancebackend.modules.telegram.entity.TelegramNotification;
import com.example.zhanfinancebackend.modules.telegram.repository.TelegramLinkRepository;
import com.example.zhanfinancebackend.modules.telegram.repository.TelegramLinkTokenRepository;
import com.example.zhanfinancebackend.modules.telegram.repository.TelegramNotificationRepository;
import com.example.zhanfinancebackend.modules.telegram.service.TelegramLinkService;
import com.example.zhanfinancebackend.modules.telegram.service.TelegramOutboxService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Method;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Adversarial verification test suite for Outbox transactional isolation,
 * Propagation.REQUIRES_NEW semantics, and Telegram chat_id rebind collision handling.
 * Stripped of UTF-8 BOM encoding.
 */
class OutboxAdversarialVerificationTest {

    private TelegramNotificationRepository telegramNotificationRepository;
    private TelegramLinkRepository telegramLinkRepository;
    private TelegramLinkTokenRepository telegramLinkTokenRepository;
    private TelegramOutboxService telegramOutboxService;
    private TelegramLinkService telegramLinkService;

    private NotificationRepository notificationRepository;
    private EmailNotificationService emailNotificationService;
    private TelegramNotifierService telegramNotifierService;
    private NotificationService notificationService;

    private User userA;
    private User userB;

    @BeforeEach
    void setUp() {
        telegramNotificationRepository = mock(TelegramNotificationRepository.class);
        telegramLinkRepository = mock(TelegramLinkRepository.class);
        telegramLinkTokenRepository = mock(TelegramLinkTokenRepository.class);

        telegramOutboxService = new TelegramOutboxService(
                telegramNotificationRepository,
                telegramLinkRepository,
                "https://mrsgemaseny.github.io/JF-1C"
        );

        telegramLinkService = new TelegramLinkService(
                telegramLinkRepository,
                telegramLinkTokenRepository,
                "zhanfinancebot"
        );

        notificationRepository = mock(NotificationRepository.class);
        emailNotificationService = mock(EmailNotificationService.class);
        telegramNotifierService = mock(TelegramNotifierService.class);

        notificationService = new NotificationService(
                notificationRepository,
                emailNotificationService,
                null,
                telegramNotifierService,
                telegramOutboxService
        );

        userA = new User();
        userA.setId(101L);
        userA.setFullName("Асет Маратов");
        userA.setEmail("aset@zhanfinance.kz");
        userA.setRole(Role.CLIENT);

        userB = new User();
        userB.setId(102L);
        userB.setFullName("Динара Касымова");
        userB.setEmail("dinara@zhanfinance.kz");
        userB.setRole(Role.CLIENT);
    }

    @Test
    @DisplayName("Outbox enqueue methods are configured with Propagation.REQUIRES_NEW for isolated transactions")
    void enqueueMethods_configuredWithRequiresNewPropagation() throws NoSuchMethodException {
        Method enqueueUser = TelegramOutboxService.class.getMethod("enqueue", User.class, String.class, String.class, String.class);
        Transactional txUser = enqueueUser.getAnnotation(Transactional.class);
        assertNotNull(txUser, "enqueue(User, ...) must be annotated with @Transactional");
        assertEquals(Propagation.REQUIRES_NEW, txUser.propagation(),
                "enqueue(User, ...) must use Propagation.REQUIRES_NEW to isolate from caller CRM transaction");

        Method enqueueCustom = TelegramOutboxService.class.getMethod("enqueue", Long.class, String.class);
        Transactional txCustom = enqueueCustom.getAnnotation(Transactional.class);
        assertNotNull(txCustom, "enqueue(Long, ...) must be annotated with @Transactional");
        assertEquals(Propagation.REQUIRES_NEW, txCustom.propagation(),
                "enqueue(Long, ...) must use Propagation.REQUIRES_NEW to isolate from caller CRM transaction");
    }

    @Test
    @DisplayName("Outbox failure does not compromise core notification persistence in NotificationService")
    void outboxFailure_doesNotCompromiseNotificationPersistence() {
        TelegramLink activeLink = new TelegramLink(userA, 123456L, "aset_tg");
        activeLink.setActive(true);
        when(telegramLinkRepository.findByUserIdAndIsActiveTrue(userA.getId())).thenReturn(Optional.of(activeLink));

        doThrow(new RuntimeException("Simulated Outbox DB connection pool timeout"))
                .when(telegramNotificationRepository).save(any(TelegramNotification.class));

        assertDoesNotThrow(() -> {
            notificationService.createNotification(userA, "Отчет готов", "Акт сверки сформирован", "/docs/1");
        }, "Exception in outbox enqueue must be trapped and logged, not propagated to outer caller");

        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    @DisplayName("Rebinding chat_id currently belonging to another user safely deletes old link and flushes")
    void bindTelegram_chatIdRebindCollision_removesOldLinkAndAvoidsUniqueViolation() {
        Long sharedChatId = 777888999L;
        TelegramLink oldLinkOfUserA = new TelegramLink(userA, sharedChatId, "aset_tg");
        oldLinkOfUserA.setActive(true);

        String token = "binding-token-for-user-b";
        TelegramLinkToken linkToken = new TelegramLinkToken(token, userB, Instant.now().plus(10, ChronoUnit.MINUTES));

        when(telegramLinkTokenRepository.findByToken(token)).thenReturn(Optional.of(linkToken));
        when(telegramLinkRepository.findByChatId(sharedChatId)).thenReturn(Optional.of(oldLinkOfUserA));
        when(telegramLinkRepository.findByUserId(userB.getId())).thenReturn(Optional.empty());

        TelegramBindRequest request = new TelegramBindRequest(token, sharedChatId, "dinara_tg", "Динара", "Касымова");
        TelegramBindResponse response = telegramLinkService.bindTelegram(request);

        assertTrue(response.success());
        assertEquals(userB.getId(), response.userId());
        assertEquals("Динара Касымова", response.fullName());

        // Verify conflicting old link was deleted and flushed before creating new link
        verify(telegramLinkRepository).delete(oldLinkOfUserA);
        verify(telegramLinkRepository).flush();

        // Verify new link saved for userB with sharedChatId
        ArgumentCaptor<TelegramLink> captor = ArgumentCaptor.forClass(TelegramLink.class);
        verify(telegramLinkRepository).save(captor.capture());
        TelegramLink saved = captor.getValue();
        assertEquals(userB, saved.getUser());
        assertEquals(sharedChatId, saved.getChatId());
        assertEquals("dinara_tg", saved.getTelegramUsername());
        assertTrue(saved.isActive());
    }

    @Test
    @DisplayName("Rebinding same chat_id by the same user retains existing link without deleting it")
    void bindTelegram_sameUserRebind_doesNotDeleteOwnLink() {
        Long chatId = 555666777L;
        TelegramLink existingLink = new TelegramLink(userA, chatId, "aset_old_username");
        existingLink.setActive(false);

        String token = "binding-token-same-user";
        TelegramLinkToken linkToken = new TelegramLinkToken(token, userA, Instant.now().plus(10, ChronoUnit.MINUTES));

        when(telegramLinkTokenRepository.findByToken(token)).thenReturn(Optional.of(linkToken));
        when(telegramLinkRepository.findByChatId(chatId)).thenReturn(Optional.of(existingLink));
        when(telegramLinkRepository.findByUserId(userA.getId())).thenReturn(Optional.of(existingLink));

        TelegramBindRequest request = new TelegramBindRequest(token, chatId, "aset_new_username", "Асет", "Маратов");
        TelegramBindResponse response = telegramLinkService.bindTelegram(request);

        assertTrue(response.success());
        verify(telegramLinkRepository, never()).delete(any(TelegramLink.class));

        ArgumentCaptor<TelegramLink> captor = ArgumentCaptor.forClass(TelegramLink.class);
        verify(telegramLinkRepository).save(captor.capture());
        TelegramLink saved = captor.getValue();
        assertEquals(userA, saved.getUser());
        assertEquals("aset_new_username", saved.getTelegramUsername());
        assertTrue(saved.isActive());
    }
}
