package com.example.zhanfinancebackend.common.events;

import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.notifications.service.EmailNotificationService;
import com.example.zhanfinancebackend.modules.notifications.service.NotificationService;
import com.example.zhanfinancebackend.modules.telegram.service.TelegramOutboxService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class TransactionalNotificationListener {

    private static final Logger log = LoggerFactory.getLogger(TransactionalNotificationListener.class);

    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final TelegramOutboxService telegramOutboxService;
    private final EmailNotificationService emailNotificationService;

    public TransactionalNotificationListener(
            UserRepository userRepository,
            NotificationService notificationService,
            TelegramOutboxService telegramOutboxService,
            EmailNotificationService emailNotificationService
    ) {
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.telegramOutboxService = telegramOutboxService;
        this.emailNotificationService = emailNotificationService;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleNotificationEvent(NotificationEvent event) {
        log.debug("Processing transaction-safe notification event: {}", event.eventType());
        try {
            switch (event.eventType()) {
                case TELEGRAM -> {
                    if (event.recipientUserId() != null) {
                        userRepository.findById(event.recipientUserId()).ifPresent(user ->
                                telegramOutboxService.enqueue(user, event.title(), event.message(), event.link())
                        );
                    }
                }
                case IN_APP -> {
                    if (event.recipientUserId() != null) {
                        userRepository.findById(event.recipientUserId()).ifPresent(user ->
                                notificationService.createNotification(user, event.title(), event.message(), event.link())
                        );
                    }
                }
                case EMAIL -> {
                    if (event.recipientEmail() != null) {
                        emailNotificationService.sendEmailAsync(event.recipientEmail(), event.title(), event.message());
                    }
                }
                case SYSTEM_BROADCAST -> notificationService.notifyAdmins(event.title(), event.message(), event.link());
            }
        } catch (Exception e) {
            log.error("Failed to process transaction-safe notification {}: {}", event.eventType(), e.getMessage(), e);
        }
    }
}
