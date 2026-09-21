package com.example.zhanfinancebackend.modules.telegram;

import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.notifications.entity.Notification;
import com.example.zhanfinancebackend.modules.notifications.repository.NotificationRepository;
import com.example.zhanfinancebackend.modules.notifications.service.EmailNotificationService;
import com.example.zhanfinancebackend.modules.notifications.service.NotificationService;
import com.example.zhanfinancebackend.modules.notifications.service.TelegramNotifierService;
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
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Method;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class TelegramOutboxAdversarialTest {

    private TelegramNotificationRepository telegramNotificationRepository;
    private TelegramLinkRepository telegramLinkRepository;
    private TelegramOutboxService telegramOutboxService;

    private NotificationRepository notificationRepository;
    private EmailNotificationService emailNotificationService;
    private UserRepository userRepository;
    private TelegramNotifierService telegramNotifierService;
    private NotificationService notificationService;

    private User linkedUser;
    private User unlinkedUser;
    private User deactivatedUser;
    private TelegramLink activeLink;
    private TelegramLink inactiveLink;

    @BeforeEach
    void setUp() {
        telegramNotificationRepository = mock(TelegramNotificationRepository.class);
        telegramLinkRepository = mock(TelegramLinkRepository.class);
        telegramOutboxService = new TelegramOutboxService(
                telegramNotificationRepository,
                telegramLinkRepository,
                "https://zhanfinance.kz"
        );

        notificationRepository = mock(NotificationRepository.class);
        emailNotificationService = mock(EmailNotificationService.class);
        userRepository = mock(UserRepository.class);
        telegramNotifierService = mock(TelegramNotifierService.class);
        notificationService = new NotificationService(
                notificationRepository,
                emailNotificationService,
                userRepository,
                telegramNotifierService,
                telegramOutboxService
        );

        linkedUser = new User();
        linkedUser.setId(101L);
        linkedUser.setFullName("Кайрат Сейтов");
        linkedUser.setEmail("kairat@zhanfinance.kz");
        linkedUser.setRole(Role.CLIENT);

        unlinkedUser = new User();
        unlinkedUser.setId(102L);
        unlinkedUser.setFullName("Алия Омарова");
        unlinkedUser.setEmail("aliya@zhanfinance.kz");
        unlinkedUser.setRole(Role.CLIENT);

        deactivatedUser = new User();
        deactivatedUser.setId(103L);
        deactivatedUser.setFullName("Берик Нурланов");
        deactivatedUser.setEmail("berik@zhanfinance.kz");
        deactivatedUser.setRole(Role.CLIENT);

        activeLink = new TelegramLink(linkedUser, 999111L, "kairat_tg");
        activeLink.setActive(true);

        inactiveLink = new TelegramLink(deactivatedUser, 999222L, "berik_tg");
        inactiveLink.setActive(false);

        when(telegramLinkRepository.findByUserIdAndIsActiveTrue(101L)).thenReturn(Optional.of(activeLink));
        when(telegramLinkRepository.findByUserIdAndIsActiveTrue(102L)).thenReturn(Optional.empty());
        when(telegramLinkRepository.findByUserIdAndIsActiveTrue(103L)).thenReturn(Optional.empty());
    }

    @Nested
    @DisplayName("Dimension 1: CRM Task / Document Lifecycle Notification Hooking")
    class CrmLifecycleHookingTests {

        @Test
        @DisplayName("1.1: Linked client triggers transactional Outbox enqueue with correct payload & HTML escaping")
        void linkedClient_triggersOutboxEnqueueWithEscapedHtml() {
            notificationService.createNotification(
                    linkedUser,
                    "Задача: <Сдача 100.00> & Проверка",
                    "Внимание: загрузите <акт сверки> & подтвердите",
                    "/client/tasks/101"
            );

            // Verify in-app notification persisted
            verify(notificationRepository, times(1)).save(any(Notification.class));

            // Verify Telegram Outbox record enqueued
            ArgumentCaptor<TelegramNotification> captor = ArgumentCaptor.forClass(TelegramNotification.class);
            verify(telegramNotificationRepository, times(1)).save(captor.capture());

            TelegramNotification enqueued = captor.getValue();
            assertEquals(999111L, enqueued.getChatId());
            assertEquals(TelegramNotification.STATUS_PENDING, enqueued.getStatus());
            assertEquals(0, enqueued.getAttempts());
            assertEquals(3, enqueued.getMaxAttempts());
            assertNull(enqueued.getLastError());
            assertNull(enqueued.getProcessedAt());

            // Check HTML sanitization to prevent Telegram parse break
            assertTrue(enqueued.getMessage().contains("&lt;Сдача 100.00&gt; &amp; Проверка"));
            assertTrue(enqueued.getMessage().contains("&lt;акт сверки&gt; &amp; подтвердите"));
            assertTrue(enqueued.getMessage().contains("<a href=\"https://zhanfinance.kz/client/tasks/101\">Открыть в кабинете</a>"));
        }

        @Test
        @DisplayName("1.2: Unlinked client does NOT enqueue outbox record and core flow completes cleanly")
        void unlinkedClient_doesNotEnqueueOutbox_noException() {
            assertDoesNotThrow(() -> {
                notificationService.createNotification(
                        unlinkedUser,
                        "Задача обновлена",
                        "Статус изменен на В работе",
                        "/client/tasks/102"
                );
            });

            // In-app notification created
            verify(notificationRepository, times(1)).save(any(Notification.class));

            // Outbox NOT created
            verify(telegramNotificationRepository, never()).save(any(TelegramNotification.class));
        }

        @Test
        @DisplayName("1.3: Deactivated link (isActive=false) does NOT enqueue outbox record")
        void deactivatedLink_doesNotEnqueueOutbox() {
            notificationService.createNotification(
                    deactivatedUser,
                    "Документ загружен",
                    "Новый документ в системе",
                    "/client/docs"
            );

            verify(notificationRepository, times(1)).save(any(Notification.class));
            verify(telegramNotificationRepository, never()).save(any(TelegramNotification.class));
        }

        @Test
        @DisplayName("1.4: Null and boundary inputs handled without throwing exceptions")
        void boundaryInputs_handledSafely() {
            assertDoesNotThrow(() -> notificationService.createNotification(null, "Title", "Msg"));
            assertDoesNotThrow(() -> telegramOutboxService.enqueue((User) null, "Title", "Msg", "/link"));

            User userWithoutId = new User();
            assertDoesNotThrow(() -> telegramOutboxService.enqueue(userWithoutId, "Title", "Msg", "/link"));

            assertDoesNotThrow(() -> telegramOutboxService.enqueue(101L, ""));
            assertDoesNotThrow(() -> telegramOutboxService.enqueue((Long) null, "Msg"));

            verify(telegramNotificationRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Dimension 2: Outbox ACK Endpoint & Retry State Machine")
    class OutboxAckStateMachineTests {

        @Test
        @DisplayName("2.1: ACK with SENT transitions status to SENT, sets processedAt, retains attempt count")
        void ack_sentStatus_transitionsToSent() {
            TelegramNotification notif = new TelegramNotification(999111L, linkedUser, "Message");
            notif.setId(501L);
            when(telegramNotificationRepository.findById(501L)).thenReturn(Optional.of(notif));

            TelegramAckRequest request = new TelegramAckRequest(
                    List.of(new TelegramAckItemDto(501L, "SENT", true, null)),
                    null
            );

            TelegramAckResponse response = telegramOutboxService.acknowledgeBatch(request);

            assertEquals(1, response.acknowledgedCount());
            assertEquals(1, response.successCount());
            assertEquals(0, response.failedCount());

            assertEquals(TelegramNotification.STATUS_SENT, notif.getStatus());
            assertNotNull(notif.getProcessedAt());
            assertEquals(0, notif.getAttempts());
            assertNull(notif.getLastError());
            verify(telegramNotificationRepository).save(notif);
        }

        @Test
        @DisplayName("2.2: ACK with FAILED increments attempts from 0 -> 1 -> 2 while keeping PENDING status")
        void ack_failedUnderLimit_incrementsAttemptsAndStaysPending() {
            TelegramNotification notif = new TelegramNotification(999111L, linkedUser, "Message");
            notif.setId(502L);
            when(telegramNotificationRepository.findById(502L)).thenReturn(Optional.of(notif));

            // Attempt 1: FAILED
            TelegramAckRequest req1 = new TelegramAckRequest(
                    List.of(new TelegramAckItemDto(502L, "FAILED", false, "Network timeout 1")),
                    null
            );
            telegramOutboxService.acknowledgeBatch(req1);

            assertEquals(1, notif.getAttempts());
            assertEquals(TelegramNotification.STATUS_PENDING, notif.getStatus());
            assertEquals("Network timeout 1", notif.getLastError());
            assertNull(notif.getProcessedAt());

            // Attempt 2: FAILED
            TelegramAckRequest req2 = new TelegramAckRequest(
                    List.of(new TelegramAckItemDto(502L, "FAILED", false, "Network timeout 2")),
                    null
            );
            telegramOutboxService.acknowledgeBatch(req2);

            assertEquals(2, notif.getAttempts());
            assertEquals(TelegramNotification.STATUS_PENDING, notif.getStatus());
            assertEquals("Network timeout 2", notif.getLastError());
            assertNull(notif.getProcessedAt());
        }

        @Test
        @DisplayName("2.3: ACK with FAILED on attempt 3 (reaches max_attempts=3) transitions status to FAILED")
        void ack_failedReachingLimit_transitionsToFailedWithProcessedAt() {
            TelegramNotification notif = new TelegramNotification(999111L, linkedUser, "Message");
            notif.setId(503L);
            notif.setAttempts(2); // Previous 2 attempts failed
            when(telegramNotificationRepository.findById(503L)).thenReturn(Optional.of(notif));

            // Attempt 3: FAILED
            TelegramAckRequest req3 = new TelegramAckRequest(
                    List.of(new TelegramAckItemDto(503L, "FAILED", false, "Telegram 400 Bad Request")),
                    null
            );
            TelegramAckResponse response = telegramOutboxService.acknowledgeBatch(req3);

            assertEquals(1, response.acknowledgedCount());
            assertEquals(0, response.successCount());
            assertEquals(1, response.failedCount());

            assertEquals(3, notif.getAttempts());
            assertEquals(TelegramNotification.STATUS_FAILED, notif.getStatus());
            assertEquals("Telegram 400 Bad Request", notif.getLastError());
            assertNotNull(notif.getProcessedAt());
        }

        @Test
        @DisplayName("2.4: Query contract: getPendingNotifications enforces status=PENDING and attempts<3")
        void getPendingNotifications_queryContractEnforced() {
            telegramOutboxService.getPendingNotifications(25);

            verify(telegramNotificationRepository).findByStatusAndAttemptsLessThanOrderByCreatedAtAsc(
                    eq(TelegramNotification.STATUS_PENDING),
                    eq(3),
                    eq(PageRequest.of(0, 25))
            );
        }

        @Test
        @DisplayName("2.5: Bot blocked (403) automatically deactivates TelegramLink in repository")
        void ack_botBlocked_deactivatesTelegramLink() {
            TelegramNotification notif = new TelegramNotification(999111L, linkedUser, "Message");
            notif.setId(504L);
            when(telegramNotificationRepository.findById(504L)).thenReturn(Optional.of(notif));
            when(telegramLinkRepository.findByChatId(999111L)).thenReturn(Optional.of(activeLink));

            TelegramAckRequest req = new TelegramAckRequest(
                    List.of(new TelegramAckItemDto(504L, "FAILED", false, "Telegram 403: Forbidden: bot was blocked by the user")),
                    null
            );
            telegramOutboxService.acknowledgeBatch(req);

            assertFalse(activeLink.isActive(), "Link must be deactivated upon bot block");
            verify(telegramLinkRepository).save(activeLink);
        }

        @Test
        @DisplayName("2.6: Mixed batch with nonexistent ID, nulls, and partial successes processed accurately")
        void ack_mixedBatch_handlesAllItemsCorrectly() {
            TelegramNotification notif1 = new TelegramNotification(999111L, linkedUser, "Msg 1");
            notif1.setId(601L);
            TelegramNotification notif2 = new TelegramNotification(999111L, linkedUser, "Msg 2");
            notif2.setId(602L);

            when(telegramNotificationRepository.findById(601L)).thenReturn(Optional.of(notif1));
            when(telegramNotificationRepository.findById(602L)).thenReturn(Optional.of(notif2));
            when(telegramNotificationRepository.findById(999999L)).thenReturn(Optional.empty());

            TelegramAckRequest request = new TelegramAckRequest(
                    List.of(
                            new TelegramAckItemDto(601L, "SENT", true, null),
                            new TelegramAckItemDto(602L, "FAILED", false, "Transient failure"),
                            new TelegramAckItemDto(999999L, "SENT", true, null),
                            new TelegramAckItemDto(null, "SENT", true, null)
                    ),
                    null
            );

            TelegramAckResponse response = telegramOutboxService.acknowledgeBatch(request);

            assertEquals(2, response.acknowledgedCount(), "Only existing IDs should count as acknowledged");
            assertEquals(1, response.successCount());
            assertEquals(1, response.failedCount());

            assertEquals(TelegramNotification.STATUS_SENT, notif1.getStatus());
            assertEquals(TelegramNotification.STATUS_PENDING, notif2.getStatus());
            assertEquals(1, notif2.getAttempts());
        }
    }

    @Nested
    @DisplayName("Dimension 3: Transaction Rollback & Domain Failure Semantics")
    class TransactionalSemanticsTests {

        @Test
        @DisplayName("3.1: TelegramOutboxService.enqueue has @Transactional annotation joining caller transaction")
        void enqueueMethod_isAnnotatedWithTransactional() throws NoSuchMethodException {
            Method enqueueUserMethod = TelegramOutboxService.class.getMethod("enqueue", User.class, String.class, String.class, String.class);
            Transactional transactional = enqueueUserMethod.getAnnotation(Transactional.class);

            assertNotNull(transactional, "enqueue(User, String, String, String) MUST be annotated with @Transactional");

            Method enqueueUserIdMethod = TelegramOutboxService.class.getMethod("enqueue", Long.class, String.class);
            assertNotNull(enqueueUserIdMethod.getAnnotation(Transactional.class), "enqueue(Long, String) MUST be annotated with @Transactional");
        }

        @Test
        @DisplayName("3.2: NotificationService.createNotification has @Transactional ensuring atomic CRM persistence")
        void createNotification_isAnnotatedWithTransactional() throws NoSuchMethodException {
            Method createMethod = NotificationService.class.getMethod("createNotification", User.class, String.class, String.class, String.class);
            Transactional transactional = createMethod.getAnnotation(Transactional.class);

            assertNotNull(transactional, "NotificationService.createNotification MUST be annotated with @Transactional to bind with CRM transaction");
        }

        @Test
        @DisplayName("3.3: TelegramOutboxService executes synchronously in caller thread (no orphan async dispatch before commit)")
        void outboxService_executesSynchronously() {
            // Verify that calling notificationService.createNotification invokes outbox immediately in the same thread
            List<String> executionOrder = new ArrayList<>();

            doAnswer(inv -> {
                executionOrder.add("in-app-saved");
                return null;
            }).when(notificationRepository).save(any());

            doAnswer(inv -> {
                executionOrder.add("outbox-saved");
                return null;
            }).when(telegramNotificationRepository).save(any());

            notificationService.createNotification(linkedUser, "Test", "Msg", "/link");

            assertEquals(List.of("in-app-saved", "outbox-saved"), executionOrder,
                    "Outbox save must execute synchronously in the caller transaction so domain rollback discards both atomically");
        }
    }
}