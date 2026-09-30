package com.example.zhanfinancebackend.common.idempotency;

import com.example.zhanfinancebackend.common.exception.ConflictException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class IdempotencyServiceTest {

    private IdempotencyService idempotencyService;

    @BeforeEach
    void setUp() {
        idempotencyService = new IdempotencyService();
    }

    @Test
    @DisplayName("execute() без ключа выполняет операцию без кэширования")
    void execute_NullOrBlankKey_ExecutesDirectly() {
        AtomicInteger counter = new AtomicInteger(0);

        String res1 = idempotencyService.execute(null, String.class, () -> "val-" + counter.incrementAndGet());
        String res2 = idempotencyService.execute("  ", String.class, () -> "val-" + counter.incrementAndGet());

        assertThat(res1).isEqualTo("val-1");
        assertThat(res2).isEqualTo("val-2");
        assertThat(counter.get()).isEqualTo(2);
    }

    @Test
    @DisplayName("execute() с ключом кэширует успешный результат и возвращает его при повторе без повторного вызова")
    void execute_WithKey_CachesResultOnSuccess() {
        AtomicInteger counter = new AtomicInteger(0);
        String key = "test-key-123";

        String first = idempotencyService.execute(key, String.class, () -> "result-" + counter.incrementAndGet());
        String second = idempotencyService.execute(key, String.class, () -> "result-" + counter.incrementAndGet());

        assertThat(first).isEqualTo("result-1");
        assertThat(second).isEqualTo("result-1");
        assertThat(counter.get()).isEqualTo(1); // Supplier called only once!
    }

    @Test
    @DisplayName("execute() при сбое очищает ключ и разрешает последующий повтор")
    void execute_OnError_EvictsKeyAndAllowsRetry() {
        AtomicInteger counter = new AtomicInteger(0);
        String key = "failed-retry-key";

        assertThatThrownBy(() -> idempotencyService.execute(key, String.class, () -> {
            counter.incrementAndGet();
            throw new IllegalStateException("Database temporary down");
        })).isInstanceOf(IllegalStateException.class);

        // Next call with same key should be allowed to run
        String success = idempotencyService.execute(key, String.class, () -> "recovered-" + counter.incrementAndGet());
        assertThat(success).isEqualTo("recovered-2");
        assertThat(counter.get()).isEqualTo(2);
    }

    @Test
    @DisplayName("validateOrRegister() бросает ConflictException при параллельном или повторном ключе")
    void validateOrRegister_DuplicateKey_ThrowsConflict() {
        String key = "op-key-456";

        idempotencyService.validateOrRegister(key, "POST /receipts");

        assertThatThrownBy(() -> idempotencyService.validateOrRegister(key, "POST /receipts"))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    @DisplayName("evict() удаляет ключ из кэша")
    void evict_RemovesKey() {
        String key = "evict-key";
        idempotencyService.execute(key, String.class, () -> "data");
        assertThat(idempotencyService.isPresent(key)).isTrue();

        idempotencyService.evict(key);
        assertThat(idempotencyService.isPresent(key)).isFalse();
    }
}
