package com.example.zhanfinancebackend.modules.telegram;

import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.notifications.entity.Notification;
import com.example.zhanfinancebackend.modules.notifications.repository.NotificationRepository;
import com.example.zhanfinancebackend.modules.notifications.service.EmailNotificationService;
import com.example.zhanfinancebackend.modules.notifications.service.NotificationService;
import com.example.zhanfinancebackend.modules.notifications.service.TelegramNotifierService;
import com.example.zhanfinancebackend.modules.telegram.entity.TelegramLink;
import com.example.zhanfinancebackend.modules.telegram.entity.TelegramNotification;
import com.example.zhanfinancebackend.modules.telegram.repository.TelegramLinkRepository;
import com.example.zhanfinancebackend.modules.telegram.repository.TelegramNotificationRepository;
import com.example.zhanfinancebackend.modules.telegram.service.TelegramOutboxService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class CrmTelegramEventIntegrationTest {

    private NotificationRepository notificationRepository;
    private EmailNotificationService emailNotificationService;
    private UserRepository userRepository;
    private TelegramNotifierService telegramNotifierService;
    private TelegramNotificationRepository telegramNotificationRepository;
    private TelegramLinkRepository telegramLinkRepository;
    private TelegramOutboxService telegramOutboxService;
    private NotificationService notificationService;

    private User clientUser;

    @BeforeEach
    void setUp() {
        notificationRepository = mock(NotificationRepository.class);
        emailNotificationService = mock(EmailNotificationService.class);
        userRepository = mock(UserRepository.class);
        telegramNotifierService = mock(TelegramNotifierService.class);
        telegramNotificationRepository = mock(TelegramNotificationRepository.class);
        telegramLinkRepository = mock(TelegramLinkRepository.class);

        telegramOutboxService = new TelegramOutboxService(
                telegramNotificationRepository,
                telegramLinkRepository,
                "https://mrsgemaseny.github.io/JF-1C"
        );

        notificationService = new NotificationService(
                notificationRepository,
                emailNotificationService,
                userRepository,
                telegramNotifierService,
                telegramOutboxService
        );

        clientUser = new User();
        clientUser.setId(77L);
        clientUser.setFullName("Кайрат");
        clientUser.setEmail("kairat@example.kz");
        clientUser.setRole(Role.CLIENT);
    }

    @Test
    @DisplayName("CRM event notification triggers Telegram outbox enqueue for linked client")
    void crmEventNotification_enqueuesOutboxForLinkedClient() {
        TelegramLink link = new TelegramLink(clientUser, 999888L, "kairat_tg");
        when(telegramLinkRepository.findByUserIdAndIsActiveTrue(77L)).thenReturn(Optional.of(link));

        // Simulate TaskService / DocumentService calling notificationService
        notificationService.createNotification(
                clientUser,
                "Статус задачи изменен",
                "Статус вашей задачи 'Сдача налоговой отчетности' изменен на: Готово",
                "/client"
        );

        // Verify standard in-app notification persisted
        verify(notificationRepository).save(any(Notification.class));

        // Verify Telegram Outbox entry was created
        ArgumentCaptor<TelegramNotification> captor = ArgumentCaptor.forClass(TelegramNotification.class);
        verify(telegramNotificationRepository).save(captor.capture());

        TelegramNotification notification = captor.getValue();
        assertEquals(999888L, notification.getChatId());
        assertEquals("PENDING", notification.getStatus());
        assertTrue(notification.getMessage().contains("<b>Статус задачи изменен</b>"));
        assertTrue(notification.getMessage().contains("Сдача налоговой отчетности"));
        assertTrue(notification.getMessage().contains("Готово"));
        assertTrue(notification.getMessage().contains("https://mrsgemaseny.github.io/JF-1C/client"));
    }

    @Test
    @DisplayName("CRM event notification does not enqueue Outbox if client is not linked to Telegram")
    void crmEventNotification_noOutboxForUnlinkedClient() {
        when(telegramLinkRepository.findByUserIdAndIsActiveTrue(77L)).thenReturn(Optional.empty());

        notificationService.createNotification(
                clientUser,
                "Статус задачи изменен",
                "Новый статус: В работе",
                "/client"
        );

        // Standard in-app notification persisted
        verify(notificationRepository).save(any(Notification.class));

        // Outbox notification NOT created
        verify(telegramNotificationRepository, never()).save(any(TelegramNotification.class));
    }
}
