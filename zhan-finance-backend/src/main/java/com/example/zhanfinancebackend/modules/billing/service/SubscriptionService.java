package com.example.zhanfinancebackend.modules.billing.service;

import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.common.exception.ErrorCode;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.billing.dto.SubscriptionDto;
import com.example.zhanfinancebackend.modules.billing.entity.Subscription;
import com.example.zhanfinancebackend.modules.billing.repository.SubscriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import com.example.zhanfinancebackend.common.exception.ResourceNotFoundException;

@Service
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;

    public SubscriptionService(SubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    @Transactional(readOnly = true)
    public List<SubscriptionDto> findAll(User user) {
        return subscriptionRepository.findAllByUser(user).stream().map(this::toDto).toList();
    }

    @Transactional
    public SubscriptionDto create(User user, SubscriptionDto request) {
        Subscription subscription = new Subscription(
                user,
                request.planName(),
                request.monthlyPrice(),
                request.startsAt(),
                request.endsAt()
        );
        if (request.status() != null) {
            subscription.setStatus(request.status());
        }
        return toDto(subscriptionRepository.save(subscription));
    }

    @Transactional
    public SubscriptionDto update(User user, Long id, SubscriptionDto request) {
        Subscription subscription = get(user, id);
        subscription.setPlanName(request.planName());
        subscription.setMonthlyPrice(request.monthlyPrice());
        subscription.setStartsAt(request.startsAt());
        subscription.setEndsAt(request.endsAt());
        if (request.status() != null) {
            subscription.setStatus(request.status());
        }
        return toDto(subscription);
    }

    @Transactional
    public void delete(User user, Long id) {
        subscriptionRepository.delete(get(user, id));
    }

    private Subscription get(User user, Long id) {
        return subscriptionRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found"));
    }

    private SubscriptionDto toDto(Subscription subscription) {
        return new SubscriptionDto(
                subscription.getId(),
                subscription.getPlanName(),
                subscription.getMonthlyPrice(),
                subscription.getStatus(),
                subscription.getStartsAt(),
                subscription.getEndsAt()
        );
    }
}

