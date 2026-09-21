package com.example.zhanfinancebackend.modules.telegram;

import com.example.zhanfinancebackend.modules.telegram.repository.TelegramLinkTokenRepository;
import com.example.zhanfinancebackend.modules.telegram.repository.TelegramNotificationRepository;
import com.example.zhanfinancebackend.modules.telegram.scheduler.TelegramCleanupScheduler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class TelegramCleanupSchedulerTest {

    private TelegramLinkTokenRepository linkTokenRepository;
    private TelegramNotificationRepository notificationRepository;
    private TelegramCleanupScheduler scheduler;

    @BeforeEach
    void setUp() {
        linkTokenRepository = mock(TelegramLinkTokenRepository.class);
        notificationRepository = mock(TelegramNotificationRepository.class);
        scheduler = new TelegramCleanupScheduler(linkTokenRepository, notificationRepository);
    }

    @Test
    @DisplayName("purgeExpiredTokens invokes deleteByExpiresAtBefore")
    void purgeExpiredTokens_invokesRepository() {
        scheduler.purgeExpiredTokens();
        verify(linkTokenRepository).deleteByExpiresAtBefore(any(Instant.class));
    }

    @Test
    @DisplayName("purgeArchivedNotifications invokes deleteByStatusInAndCreatedAtBefore with 30-day cutoff")
    void purgeArchivedNotifications_invokesRepository() {
        scheduler.purgeArchivedNotifications();
        verify(notificationRepository).deleteByStatusInAndCreatedAtBefore(eq(List.of("SENT", "FAILED")), any(Instant.class));
    }
}
