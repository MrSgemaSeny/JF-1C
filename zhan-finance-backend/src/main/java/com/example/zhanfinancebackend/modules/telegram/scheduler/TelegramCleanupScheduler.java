package com.example.zhanfinancebackend.modules.telegram.scheduler;

import com.example.zhanfinancebackend.modules.telegram.entity.TelegramNotification;
import com.example.zhanfinancebackend.modules.telegram.repository.TelegramLinkTokenRepository;
import com.example.zhanfinancebackend.modules.telegram.repository.TelegramNotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
public class TelegramCleanupScheduler {

    private static final Logger log = LoggerFactory.getLogger(TelegramCleanupScheduler.class);

    private final TelegramLinkTokenRepository telegramLinkTokenRepository;
    private final TelegramNotificationRepository telegramNotificationRepository;

    public TelegramCleanupScheduler(
            TelegramLinkTokenRepository telegramLinkTokenRepository,
            TelegramNotificationRepository telegramNotificationRepository
    ) {
        this.telegramLinkTokenRepository = telegramLinkTokenRepository;
        this.telegramNotificationRepository = telegramNotificationRepository;
    }

    @Scheduled(fixedDelay = 900000) // every 15 minutes
    @Transactional
    public void purgeExpiredTokens() {
        try {
            Instant now = Instant.now();
            telegramLinkTokenRepository.deleteByExpiresAtBefore(now);
            log.debug("Purged expired Telegram link tokens prior to {}", now);
        } catch (Exception e) {
            log.error("Failed to purge expired Telegram link tokens: {}", e.getMessage(), e);
        }
    }

    @Scheduled(cron = "0 0 3 * * *") // Daily at 03:00 AM
    @Transactional
    public void purgeArchivedNotifications() {
        try {
            Instant cutoff = Instant.now().minus(30, ChronoUnit.DAYS);
            int deleted = telegramNotificationRepository.deleteByStatusInAndCreatedAtBefore(
                    List.of(TelegramNotification.STATUS_SENT, TelegramNotification.STATUS_FAILED),
                    cutoff
            );
            log.info("Purged {} archived Telegram notifications older than {}", deleted, cutoff);
        } catch (Exception e) {
            log.error("Failed to purge archived Telegram notifications: {}", e.getMessage(), e);
        }
    }
}
