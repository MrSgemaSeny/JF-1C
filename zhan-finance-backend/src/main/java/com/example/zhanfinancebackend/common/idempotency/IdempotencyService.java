package com.example.zhanfinancebackend.common.idempotency;

import com.example.zhanfinancebackend.common.exception.ConflictException;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

@Service
public class IdempotencyService {

    private static final Logger log = LoggerFactory.getLogger(IdempotencyService.class);

    private static final String STATE_IN_PROGRESS = "IN_PROGRESS";
    private static final String STATE_COMPLETED = "COMPLETED";

    private final Cache<String, String> keyCache = Caffeine.newBuilder()
            .expireAfterWrite(24, TimeUnit.HOURS)
            .maximumSize(50000)
            .build();

    private final Cache<String, Object> resultCache = Caffeine.newBuilder()
            .expireAfterWrite(24, TimeUnit.HOURS)
            .maximumSize(50000)
            .build();

    /**
     * Выполняет операцию идемпотентно.
     * При повторном запросе с тем же ключом после успешного завершения возвращает ранее сохранённый результат.
     * При одновременном параллельном запросе блокирует второй поток ошибкой 409 Conflict.
     * При ошибке выполнения операции ключ очищается, разрешая клиенту повторить запрос.
     */
    public <T> T execute(String idempotencyKey, Class<T> resultClass, Supplier<T> action) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return action.get();
        }

        String existing = keyCache.asMap().putIfAbsent(idempotencyKey, STATE_IN_PROGRESS);
        if (existing != null) {
            if (STATE_COMPLETED.equals(existing)) {
                Object cached = resultCache.getIfPresent(idempotencyKey);
                if (cached != null && resultClass.isInstance(cached)) {
                    log.info("Idempotent retry for key {}. Returning cached result.", idempotencyKey);
                    return resultClass.cast(cached);
                }
                throw new ConflictException("Дублирующий запрос: операция с Idempotency-Key '" + idempotencyKey + "' уже была успешно выполнена");
            }
            throw new ConflictException("Параллельный дублирующий запрос: операция с Idempotency-Key '" + idempotencyKey + "' уже выполняется");
        }

        try {
            T result = action.get();
            keyCache.put(idempotencyKey, STATE_COMPLETED);
            if (result != null) {
                resultCache.put(idempotencyKey, result);
            }
            return result;
        } catch (RuntimeException e) {
            keyCache.invalidate(idempotencyKey);
            resultCache.invalidate(idempotencyKey);
            throw e;
        }
    }

    /**
     * Атомарная регистрация ключа для ручной валидации в контроллерах.
     */
    public void validateOrRegister(String idempotencyKey, String operation) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return;
        }

        String existing = keyCache.asMap().putIfAbsent(idempotencyKey, STATE_IN_PROGRESS);
        if (existing != null) {
            if (STATE_COMPLETED.equals(existing)) {
                throw new ConflictException("Дублирующий запрос: операция с Idempotency-Key '" + idempotencyKey + "' уже обработана");
            }
            throw new ConflictException("Параллельный дублирующий запрос: операция с Idempotency-Key '" + idempotencyKey + "' уже выполняется");
        }
    }

    public void complete(String idempotencyKey, Object result) {
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            keyCache.put(idempotencyKey, STATE_COMPLETED);
            if (result != null) {
                resultCache.put(idempotencyKey, result);
            }
        }
    }

    public boolean isPresent(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return false;
        }
        return keyCache.getIfPresent(idempotencyKey) != null;
    }

    public void evict(String idempotencyKey) {
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            keyCache.invalidate(idempotencyKey);
            resultCache.invalidate(idempotencyKey);
        }
    }
}
