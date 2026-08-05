package com.example.zhanfinancebackend.modules.billing.service;

import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.billing.dto.SubscriptionDto;
import com.example.zhanfinancebackend.modules.billing.entity.Subscription;
import com.example.zhanfinancebackend.modules.billing.entity.Subscription.SubscriptionStatus;
import com.example.zhanfinancebackend.modules.billing.repository.SubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SubscriptionServiceTest {

    private SubscriptionService subscriptionService;
    private SubscriptionRepository subscriptionRepository;

    @BeforeEach
    void setUp() {
        subscriptionRepository = mock(SubscriptionRepository.class);
        subscriptionService = new SubscriptionService(subscriptionRepository);
    }

    @Test
    void testCreateSubscription_Success() {
        User user = new User();
        user.setId(1L);

        SubscriptionDto request = new SubscriptionDto(null, "Pro", BigDecimal.TEN, SubscriptionStatus.ACTIVE, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 31));

        when(subscriptionRepository.findAllByUser(user)).thenReturn(List.of());
        when(subscriptionRepository.save(any())).thenAnswer(inv -> {
            Subscription s = inv.getArgument(0);
            s.setId(100L);
            return s;
        });

        SubscriptionDto result = subscriptionService.create(user, request);

        assertNotNull(result);
        assertEquals(100L, result.id());
        verify(subscriptionRepository).save(any());
    }

    @Test
    void testCreateSubscription_OverlapGuard() {
        User user = new User();
        user.setId(1L);

        Subscription existing = new Subscription(user, "Basic", BigDecimal.ONE, LocalDate.of(2026, 1, 15), LocalDate.of(2026, 2, 15));
        existing.setId(10L);
        existing.setStatus(SubscriptionStatus.ACTIVE);

        when(subscriptionRepository.findAllByUser(user)).thenReturn(List.of(existing));

        SubscriptionDto request = new SubscriptionDto(null, "Pro", BigDecimal.TEN, SubscriptionStatus.ACTIVE, LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 28));

        ApiException ex = assertThrows(ApiException.class, () -> subscriptionService.create(user, request));
        assertEquals("Subscription dates overlap with an existing subscription", ex.getMessage());
    }

    @Test
    void testUpdateSubscription_StatusActivationDeactivation() {
        User user = new User();
        user.setId(1L);

        Subscription existing = new Subscription(user, "Basic", BigDecimal.ONE, LocalDate.of(2026, 1, 15), LocalDate.of(2026, 2, 15));
        existing.setId(10L);
        existing.setStatus(SubscriptionStatus.ACTIVE);

        when(subscriptionRepository.findByIdAndUser(10L, user)).thenReturn(Optional.of(existing));
        when(subscriptionRepository.findAllByUser(user)).thenReturn(List.of(existing)); // self overlap ignored

        SubscriptionDto request = new SubscriptionDto(10L, "Basic", BigDecimal.ONE, SubscriptionStatus.CANCELED, LocalDate.of(2026, 1, 15), LocalDate.of(2026, 2, 15));

        SubscriptionDto result = subscriptionService.update(user, 10L, request);

        assertEquals(SubscriptionStatus.CANCELED, result.status());
        assertEquals(SubscriptionStatus.CANCELED, existing.getStatus()); // mutating existing object directly
    }
}
