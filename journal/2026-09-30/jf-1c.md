# JF-1C — Journal 2026-09-30

## Сессия: Исчерпывающий аудит проекта

### Что сделано

Проведён полный трёхуровневый аудит проекта (backend security, frontend architecture, DevOps/infra) параллельно тремя специализированными субагентами + ручной анализ ключевых файлов.

**Объём кодовой базы на дату аудита:**
- 376 Java-файлов (backend)
- 222 TypeScript/TSX-файлов (frontend)
- 72 тест-файла backend, 25 frontend
- 130 Flyway-миграций (V1–V130)
- ~642 теста суммарно (355+ backend + 198 frontend + 89 tgbot)

---

### Незакоммиченные изменения (предыдущая сессия)

Обнаружены изменения от предыдущей сессии, не попавшие в git:

1. **`IdempotencyService.java`** — существенный рефактор:
   - Добавлен dual-state cache (`IN_PROGRESS` / `COMPLETED`) вместо единого флага
   - Новый метод `execute(key, resultClass, Supplier)` — идемпотентное выполнение с кешированием результата
   - Атомарный `putIfAbsent` вместо `getIfPresent` → устранён race condition
   - Метод `complete(key, result)` для ручного завершения
   - Logger добавлен
   - Новый тест `IdempotencyServiceTest.java`

2. **`AdminPaymentReceiptController.java`** — мелкие правки

3. **`PaymentReceiptController.java`** — мелкие правки

4. **`application.properties`** — `leak-detection-threshold` изменён с `3000` → `10000` (устранение ложных срабатываний при PDF-генерации)

---

### Результаты аудита

Полный отчёт: `C:\Users\murat\.gemini\antigravity\brain\6eba8894-ec07-4a91-a59e-d880d2900906\audit_report.md`

**Итог: 8 CRITICAL, 13 WARNING, 12 INFO**

#### CRITICAL — требуют немедленного устранения

| ID | Файл | Проблема |
|----|------|---------|
| F-01 | `application.properties` | `/actuator/prometheus` без auth на том же порту 8080 |
| F-02 | `deploy-backend.yml` | Deploy не зависит от CI — может уйти при упавших тестах |
| F-21 | `db-backup.yml` | Silent failure: цикл завершается `exit 0` при всех неудачах → ложный `[OK]` в Telegram |
| F-22 | `fly.toml` | Нет `[[http_service.checks]]` → 502 при каждом деплое пока Spring стартует |
| F-23 | `fly.toml` vs `Dockerfile` | `JAVA_TOOL_OPTIONS` в fly.toml перезаписывает Dockerfile → потеря `-Xmx384m -Xms256m` → OOMKilled риск |
| F-26 | `SubscriptionController.java` | Нет `@PreAuthorize` — любой CLIENT может создать подписку с произвольным статусом ACTIVE и ценой |
| F-27 | `AuthService.java` | OTP верификация только для `@gmail.com` — все остальные домены регистрируются без подтверждения |
| F-28 | `EmailOtpService.java` | `devOtpCode` возвращается в HTTP-ответе при незаполненном SMTP — bypass 2FA в prod |

#### WARNING (топ по приоритету)

- `application.properties`: `INTERNAL_BOT_TOKEN` имеет dev-дефолт в коде
- `User.java`: `totpSecret` хранится plaintext в БД (нужен AES-256 JPA Converter)
- `TwoFactorController.java`: deadlock — ADMIN не может disable 2FA (403 + BadRequest одновременно)
- `JwtAuthenticationFilter.java`: stub user с `setEnabled(true)` — заблокированный пользователь продолжает работать до истечения access token
- `flyway.ignore-migration-patterns=*:missing` отключает checksum валидацию в production
- H2 вместо Testcontainers — PostgreSQL-специфичный SQL не тестируется реальной базой
- JaCoCo threshold 50% — слишком низко для финансовой системы
- 105 вхождений `any` в TypeScript, отключены ключевые ESLint правила
- `cleartext: true` в `capacitor.config.ts` — HTTP для финтех-мобильного приложения
- FSD нарушения: `shared` слой импортирует `entities` и `features`
- `generated-schema.d.ts` отсутствует в репозитории, codegen не в CI

#### Сильные стороны проекта

- Refresh token family (RFC 6819) с grace period 15 сек
- Timing-safe сравнение токенов (MessageDigest.isEqual)
- Transactional Outbox с AFTER_COMMIT listener
- Task State Machine с role-based матрицами переходов
- Atomic task pickup через native SQL CAS
- Adversarial тесты на атаки
- Pessimistic locking на PaymentReceipt
- ShedLock на всех 7 шедулерах
- ArchUnit граница billing/CRM

---

### Следующие шаги (приоритет)

1. `SubscriptionController` — добавить `@PreAuthorize("hasRole('ADMIN')")` на мутирующие методы
2. `AuthService` — убрать ограничение `endsWith("@gmail.com")`, OTP для всех доменов
3. `EmailOtpService` — devOtpCode только при `@Profile("dev")`
4. `fly.toml` — добавить healthcheck + исправить JAVA_TOOL_OPTIONS
5. `db-backup.yml` — исправить silent failure в цикле
6. `totpSecret` — JPA AttributeConverter с AES-256-GCM
7. `TwoFactorController.disable` — исправить deadlock, открыть для `isAuthenticated()`
