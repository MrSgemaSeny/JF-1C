package com.example.zhanfinancebackend.modules.billing.service;

import com.example.zhanfinancebackend.modules.billing.entity.Subscription;
import com.example.zhanfinancebackend.modules.billing.repository.SubscriptionRepository;
import com.example.zhanfinancebackend.modules.telegram.service.TelegramOutboxService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class SubscriptionRenewalReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(SubscriptionRenewalReminderScheduler.class);

    private final SubscriptionRepository subscriptionRepository;
    private final TelegramOutboxService telegramOutboxService;

    public SubscriptionRenewalReminderScheduler(
            SubscriptionRepository subscriptionRepository,
            TelegramOutboxService telegramOutboxService
    ) {
        this.subscriptionRepository = subscriptionRepository;
        this.telegramOutboxService = telegramOutboxService;
    }

    @Scheduled(cron = "0 0 9 * * *", zone = "Asia/Almaty")
    @net.javacrumbs.shedlock.spring.annotation.SchedulerLock(name = "sendExpiringSubscriptionReminders", lockAtMostFor = "15m", lockAtLeastFor = "1m")
    public void sendExpiringSubscriptionReminders() {
        LocalDate reminderDate = LocalDate.now().plusDays(3);
        List<Subscription> expiring = subscriptionRepository.findByStatusAndEndsAt(
                Subscription.SubscriptionStatus.ACTIVE,
                reminderDate
        );

        if (expiring.isEmpty()) {
            return;
        }

        log.info("Found {} active subscriptions expiring on {}", expiring.size(), reminderDate);

        for (Subscription sub : expiring) {
            if (sub.getUser() == null) {
                continue;
            }
            try {
                String title = "Истекает срок тарифа";
                String message = String.format("Ваш тариф «%s» истекает через 3 дня (%s). Рекомендуем оплатить продление заранее для непрерывного доступа.",
                        sub.getPlanName(), sub.getEndsAt());
                telegramOutboxService.enqueue(sub.getUser(), title, message, "/client/billing");
            } catch (Exception e) {
                log.warn("Failed to enqueue renewal reminder for user {}: {}", sub.getUser().getId(), e.getMessage());
            }
        }
    }
}
