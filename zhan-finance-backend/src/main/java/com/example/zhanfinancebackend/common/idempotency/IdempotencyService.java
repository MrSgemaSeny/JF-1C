package com.example.zhanfinancebackend.common.idempotency;

import com.example.zhanfinancebackend.common.exception.ConflictException;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
public class IdempotencyService {

    private final Cache<String, String> keyCache = Caffeine.newBuilder()
            .expireAfterWrite(24, TimeUnit.HOURS)
            .maximumSize(50000)
            .build();

    public void validateOrRegister(String idempotencyKey, String operation) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return; // Idempotency check optional if header not supplied
        }

        String existing = keyCache.getIfPresent(idempotencyKey);
        if (existing != null) {
            throw new ConflictException("Дублирующий запрос: операция с Idempotency-Key '" + idempotencyKey + "' уже обработана или выполняется");
        }

        keyCache.put(idempotencyKey, operation);
    }

    public boolean isPresent(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return false;
        }
        return keyCache.getIfPresent(idempotencyKey) != null;
    }

    public void evict(String idempotencyKey) {
        if (idempotencyKey != null) {
            keyCache.invalidate(idempotencyKey);
        }
    }
}
