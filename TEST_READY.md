# ZhanFinance Telegram Bot & JF-1C Backend: Test Readiness Inventory & Specifications

## Status: TEST SPECIFICATIONS READY & VERIFIED
- **Project**: JF-1C Monolithic Backend (`zhan-finance-backend`) and Telegram Bot Microservice (`zhan-finance-tgbot`)
- **Frameworks**: Spring Boot 4.1.0/3.4 (Backend), Spring Boot 3.3.4 Headless (Bot Microservice), JUnit 5, MockMvc, Mockito
- **Track**: Dual Track Quality Architecture (E2E Opaque-Box & Implementation Slice)
- **Quality Gates**: JaCoCo Line Coverage >= 70%, 100% Pass Rate, Zero Emojis, Zero Compilation Errors

---

## 1. Executive Summary & Inventory Matrix

| Tier | Focus Level | Target Scope | Minimum Required | Specified Cases | Status |
|---|---|---|---|---|---|
| **Tier 1** | Feature Coverage (Happy Path & Isolation) | 22 Features (F1-F22) | >= 5 per feature (110 total) | 110 test cases | READY |
| **Tier 2** | Boundary, Corner & Adversarial Cases | 22 Features (F1-F22) | >= 5 per feature (110 total) | 110 test cases | READY |
| **Tier 3** | Cross-Feature Combinations (Pairwise Inter-Module) | Monolith <-> Bot Inter-Service | >= 12 combinations | 16 test cases | READY |
| **Tier 4** | Real-World Workload Scenarios (Operational Journeys) | Production Workflows & Failure Drills | >= 5 journeys | 6 complete journeys | READY |
| **TOTAL** | Complete Quality Inventory | Full System & Integration Track | >= 237 specifications | 242 test specifications | READY |

---

## 2. Tier 1: Feature Coverage (Isolation & Happy Path)

### Feature 1: V124 Flyway Migration (F1)
- **TC-T1-F01-01: Table Creation and Schema Integrity for telegram_links**
  - Input: Apply Flyway migration `V124__Telegram_Link_Schema.sql` on clean PostgreSQL schema.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R1`, `survey_report_1.md § 2.3`
  - Expected Output: Table `telegram_links` created with columns `id`, `user_id`, `chat_id`, `telegram_username`, `is_active`, `linked_at`, `updated_at`.
  - Runner: `TelegramMigrationTest.java`
- **TC-T1-F01-02: Table Creation for telegram_link_tokens**
  - Input: Apply Flyway migration `V124__Telegram_Link_Schema.sql`.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R1`, `survey_report_1.md § 2.3`
  - Expected Output: Table `telegram_link_tokens` created with columns `token` (PK VARCHAR(64)), `user_id`, `expires_at`, `created_at`.
  - Runner: `TelegramMigrationTest.java`
- **TC-T1-F01-03: Foreign Key Constraint to app_users(id)**
  - Input: Query PostgreSQL `information_schema.table_constraints` for `telegram_links` and `telegram_link_tokens`.
  - Authoritative Source: `survey_report_1.md § 2.2`, `PROJECT.md § Feature Inventory`
  - Expected Output: Foreign key references `app_users(id)` with `ON DELETE CASCADE`.
  - Runner: `TelegramMigrationTest.java`
- **TC-T1-F01-04: Unique Constraints on user_id and chat_id**
  - Input: Inspect unique constraints on `telegram_links(user_id)` and `telegram_links(chat_id)`.
  - Authoritative Source: `survey_report_1.md § 2.3`
  - Expected Output: Unique constraints enforce one Telegram link per user and one user per chat ID.
  - Runner: `TelegramMigrationTest.java`
- **TC-T1-F01-05: Indexes on Link Tables**
  - Input: Query `pg_indexes` for `idx_tg_links_chat_id`, `idx_tg_links_user_id`, `idx_tg_link_tokens_expires`.
  - Authoritative Source: `survey_report_1.md § 2.3`
  - Expected Output: All three performance indexes exist and are valid.
  - Runner: `TelegramMigrationTest.java`

### Feature 2: V125 Flyway Migration (F2)
- **TC-T1-F02-01: Table Creation for telegram_notifications Outbox**
  - Input: Apply Flyway migration `V125__Telegram_Outbox.sql`.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R1`, `PROJECT.md § Feature Inventory`
  - Expected Output: Table `telegram_notifications` created with columns `id`, `chat_id`, `user_id`, `message`, `status`, `attempts`, `max_attempts`, `last_error`, `created_at`, `processed_at`.
  - Runner: `TelegramMigrationTest.java`
- **TC-T1-F02-02: Status Column Default Value PENDING**
  - Input: Insert row into `telegram_notifications` omitting status.
  - Authoritative Source: `survey_report_1.md § 2.3`
  - Expected Output: Column `status` defaults to `'PENDING'`.
  - Runner: `TelegramMigrationTest.java`
- **TC-T1-F02-03: Max Attempts Default to 3**
  - Input: Insert row into `telegram_notifications` omitting attempts and max_attempts.
  - Authoritative Source: `survey_report_1.md § 2.3`
  - Expected Output: Column `attempts` defaults to 0, `max_attempts` defaults to 3.
  - Runner: `TelegramMigrationTest.java`
- **TC-T1-F02-04: Partial Index on Pending Notifications**
  - Input: Query index definition for `idx_tg_notif_pending`.
  - Authoritative Source: `survey_report_1.md § 2.3`
  - Expected Output: Partial index exists on `created_at` where `status = 'PENDING'`.
  - Runner: `TelegramMigrationTest.java`
- **TC-T1-F02-05: Composite Cleanup Index**
  - Input: Query index definition for `idx_tg_notif_cleanup`.
  - Authoritative Source: `survey_report_1.md § 2.3`
  - Expected Output: Composite index exists on `(status, created_at)`.
  - Runner: `TelegramMigrationTest.java`

### Feature 3: INTERNAL_BOT Security Role (F3)
- **TC-T1-F03-01: INTERNAL_BOT Enum Member Existence**
  - Input: Inspect `Role.java` enum values.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R1`, `Role.java`
  - Expected Output: `Role.INTERNAL_BOT` is present in enum definition.
  - Runner: `RoleEnumTest.java`
- **TC-T1-F03-02: Granted Authority Formatting**
  - Input: Construct `SimpleGrantedAuthority("ROLE_" + Role.INTERNAL_BOT.name())`.
  - Authoritative Source: `survey_report_1.md § 3.1`
  - Expected Output: Authority string equals `"ROLE_INTERNAL_BOT"`.
  - Runner: `RoleEnumTest.java`
- **TC-T1-F03-03: Registration Sanitization Excludes INTERNAL_BOT**
  - Input: `POST /api/v1/auth/register` with `{ "role": "INTERNAL_BOT" }`.
  - Authoritative Source: `survey_report_1.md § 3.1`, `AuthController.java`
  - Expected Output: Registration fails with HTTP 400 Bad Request or role is coerced to `CLIENT`.
  - Runner: `RoleSanitizationTest.java`
- **TC-T1-F03-04: Google OAuth Sanitization Excludes INTERNAL_BOT**
  - Input: Invoke `GoogleAuthService.processOAuthUser` with requested role `INTERNAL_BOT`.
  - Authoritative Source: `CONTEXT.md § HOTFIX Role Sanitization`
  - Expected Output: Created user role is sanitized to `CLIENT`.
  - Runner: `RoleSanitizationTest.java`
- **TC-T1-F03-05: SecurityConfig Route Restriction to INTERNAL_BOT**
  - Input: Access `/api/v1/internal/telegram/pending` with an authentication token containing role `ROLE_INTERNAL_BOT`.
  - Authoritative Source: `survey_report_1.md § 3.2`, `SecurityConfig.java`
  - Expected Output: Request authorized (does not return 403 Forbidden).
  - Runner: `InternalSecurityAccessTest.java`

### Feature 4: InternalTokenFilter (F4)
- **TC-T1-F04-01: Valid Header Grants ROLE_INTERNAL_BOT**
  - Input: HTTP GET `/api/v1/internal/telegram/pending` with header `X-Internal-Token: <CORRECT_SECRET>`.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R1`, `PROJECT.md § Interface Contracts`
  - Expected Output: Filter sets `SecurityContextHolder` with authority `ROLE_INTERNAL_BOT` and proceeds.
  - Runner: `InternalTokenFilterTest.java`
- **TC-T1-F04-02: Missing Header Rejection**
  - Input: HTTP GET `/api/v1/internal/telegram/pending` without `X-Internal-Token` header.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R1`, `survey_report_1.md § 3.3`
  - Expected Output: HTTP 401 Unauthorized returned immediately.
  - Runner: `InternalTokenFilterTest.java`
- **TC-T1-F04-03: Incorrect Header Rejection**
  - Input: HTTP GET `/api/v1/internal/telegram/pending` with header `X-Internal-Token: invalid-token-value`.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R1`, `survey_report_1.md § 3.3`
  - Expected Output: HTTP 401 Unauthorized returned immediately.
  - Runner: `InternalTokenFilterTest.java`
- **TC-T1-F04-04: Constant-Time Token Comparison Verification**
  - Input: Compare token matching logic with `MessageDigest.isEqual`.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R1`, `survey_report_1.md § 3.3`
  - Expected Output: Constant-time comparison executed on UTF-8 byte arrays.
  - Runner: `InternalTokenFilterTest.java`
- **TC-T1-F04-05: Non-Internal Routes Bypassed**
  - Input: HTTP GET `/api/v1/auth/me` processed through `InternalTokenFilter`.
  - Authoritative Source: `survey_report_1.md § 3.3`
  - Expected Output: Filter skips authentication without rejecting request, delegating to downstream filters.
  - Runner: `InternalTokenFilterTest.java`

### Feature 5: Rate Limit Whitelisting (F5)
- **TC-T1-F05-01: Whitelist Match on /api/v1/internal/** Path**
  - Input: Invoke `ApiRateLimitFilter.isWhitelisted("/api/v1/internal/telegram/pending")`.
  - Authoritative Source: `PROJECT.md § F5`, `survey_report_1.md § 3.4`
  - Expected Output: Returns `true`.
  - Runner: `ApiRateLimitFilterTest.java`
- **TC-T1-F05-02: Whitelist Match on /v1/internal/** Path**
  - Input: Invoke `ApiRateLimitFilter.isWhitelisted("/v1/internal/telegram/bind")`.
  - Authoritative Source: `PROJECT.md § F5`, `survey_report_1.md § 3.4`
  - Expected Output: Returns `true`.
  - Runner: `ApiRateLimitFilterTest.java`
- **TC-T1-F05-03: Non-Internal API Remains Rate-Limited**
  - Input: Invoke `ApiRateLimitFilter.isWhitelisted("/api/v1/tasks")`.
  - Authoritative Source: `survey_report_1.md § 3.4`
  - Expected Output: Returns `false`.
  - Runner: `ApiRateLimitFilterTest.java`
- **TC-T1-F05-04: Consecutive Internal Requests Do Not Consume Client IP Bucket**
  - Input: Send 150 consecutive requests to `/api/v1/internal/telegram/pending` from single IP.
  - Authoritative Source: `survey_report_1.md § 3.4`
  - Expected Output: Zero HTTP 429 Too Many Requests responses; all return 200 OK.
  - Runner: `InternalRateLimitIntegrationTest.java`
- **TC-T1-F05-05: Public Link Generation Remains Subject to User Rate Limits**
  - Input: Send 200 consecutive requests to `/api/v1/telegram/link/generate` from single IP without bot token.
  - Authoritative Source: `survey_report_1.md § 3.4`
  - Expected Output: HTTP 429 Too Many Requests returned after bucket exhaustion.
  - Runner: `InternalRateLimitIntegrationTest.java`

### Feature 6: Telegram Link Entities & Repositories (F6)
- **TC-T1-F06-01: Persist TelegramLink Entity**
  - Input: Create and save `TelegramLink` for User ID 1 with Chat ID 123456789.
  - Authoritative Source: `survey_report_1.md § 4.2`
  - Expected Output: Entity persisted with generated ID, `isActive = true`, `linkedAt` populated.
  - Runner: `TelegramLinkRepositoryTest.java`
- **TC-T1-F06-02: Find Link by User ID**
  - Input: Call `telegramLinkRepository.findByUserId(1L)`.
  - Authoritative Source: `survey_report_1.md § 4.3`
  - Expected Output: Returns `Optional<TelegramLink>` matching persisted record.
  - Runner: `TelegramLinkRepositoryTest.java`
- **TC-T1-F06-03: Find Link by Chat ID**
  - Input: Call `telegramLinkRepository.findByChatId(123456789L)`.
  - Authoritative Source: `survey_report_1.md § 4.3`
  - Expected Output: Returns `Optional<TelegramLink>` matching persisted record.
  - Runner: `TelegramLinkRepositoryTest.java`
- **TC-T1-F06-04: Persist TelegramLinkToken Entity**
  - Input: Save `TelegramLinkToken` with UUID token string, user reference, and 15-minute expiration.
  - Authoritative Source: `survey_report_1.md § 4.2`
  - Expected Output: Token persisted in `telegram_link_tokens` table.
  - Runner: `TelegramLinkTokenRepositoryTest.java`
- **TC-T1-F06-05: Delete Link by User ID (Unlink)**
  - Input: Call `telegramLinkRepository.deleteByUserId(1L)`.
  - Authoritative Source: `survey_report_1.md § 4.3`
  - Expected Output: Row removed; subsequent `findByUserId(1L)` returns empty.
  - Runner: `TelegramLinkRepositoryTest.java`

### Feature 7: Telegram Outbox Entity & Repository (F7)
- **TC-T1-F07-01: Persist Pending Notification**
  - Input: Save `TelegramNotification` with Chat ID 123456789, message, status `PENDING`.
  - Authoritative Source: `survey_report_1.md § 4.2`, `survey_report_3.md § 2.3`
  - Expected Output: Record saved with generated ID, `attempts = 0`, `maxAttempts = 3`, non-null `createdAt`.
  - Runner: `TelegramNotificationRepositoryTest.java`
- **TC-T1-F07-02: Query Pending Queue Ordered by Creation Date**
  - Input: Save 3 notifications at different timestamps and query `findByStatusAndAttemptsLessThanOrderByCreatedAtAsc("PENDING", 3, PageRequest.of(0, 10))`.
  - Authoritative Source: `survey_report_1.md § 4.3`
  - Expected Output: Returns list of pending notifications in ascending order of `createdAt`.
  - Runner: `TelegramNotificationRepositoryTest.java`
- **TC-T1-F07-03: Exclude Notifications with Attempts Exceeding Max**
  - Input: Notification with `attempts = 3`, `maxAttempts = 3`, status `PENDING`.
  - Authoritative Source: `survey_report_1.md § 4.3`
  - Expected Output: Not returned in pending query.
  - Runner: `TelegramNotificationRepositoryTest.java`
- **TC-T1-F07-04: Update Status to SENT with Processed Timestamp**
  - Input: Update notification status to `SENT` and set `processedAt = Instant.now()`.
  - Authoritative Source: `PROJECT.md § Interface Contracts`
  - Expected Output: Record updated in database with `status = 'SENT'`.
  - Runner: `TelegramNotificationRepositoryTest.java`
- **TC-T1-F07-05: Delete Archived Notifications**
  - Input: Invoke `deleteByStatusInAndCreatedAtBefore(List.of("SENT", "FAILED"), cutoffDate)`.
  - Authoritative Source: `survey_report_1.md § 4.3`
  - Expected Output: Older processed rows deleted, recent and pending rows preserved.
  - Runner: `TelegramNotificationRepositoryTest.java`

### Feature 8: User Link Endpoints (F8)
- **TC-T1-F08-01: Generate Link Token for Authenticated Client**
  - Input: `POST /api/v1/telegram/link/generate` with valid CLIENT JWT Bearer token.
  - Authoritative Source: `PROJECT.md § 1. User Endpoints`, `ORIGINAL_REQUEST.md § R1`
  - Expected Output: HTTP 200 OK, JSON containing `token` (32+ chars), `deepLink` (`https://t.me/...`), `expiresAt` (15 minutes in future).
  - Runner: `TelegramLinkControllerTest.java`
- **TC-T1-F08-02: Generate Link Token Invalidates Previous Unused Token**
  - Input: Call `/api/v1/telegram/link/generate` twice in succession for same user.
  - Authoritative Source: `survey_report_1.md § 5.1`, `survey_report_3.md § 3.2`
  - Expected Output: First token purged from database; only the latest token is valid.
  - Runner: `TelegramLinkControllerTest.java`
- **TC-T1-F08-03: Get Link Status when Linked**
  - Input: `GET /api/v1/telegram/link/status` for user with active link record.
  - Authoritative Source: `PROJECT.md § 1. User Endpoints`
  - Expected Output: HTTP 200 OK with `linked: true`, `chatId: 123456789`, `telegramUsername: "test_client"`, `linkedAt`.
  - Runner: `TelegramLinkControllerTest.java`
- **TC-T1-F08-04: Get Link Status when Unlinked**
  - Input: `GET /api/v1/telegram/link/status` for user without link record.
  - Authoritative Source: `PROJECT.md § 1. User Endpoints`
  - Expected Output: HTTP 200 OK with `linked: false`, `chatId: null`, `telegramUsername: null`, `linkedAt: null`.
  - Runner: `TelegramLinkControllerTest.java`
- **TC-T1-F08-05: Delete Link via User Endpoint**
  - Input: `DELETE /api/v1/telegram/link` with valid CLIENT Bearer token.
  - Authoritative Source: `PROJECT.md § 1. User Endpoints`
  - Expected Output: HTTP 200 OK with `success: true`; link record removed from database.
  - Runner: `TelegramLinkControllerTest.java`

### Feature 9: Internal Bot Endpoints (F9)
- **TC-T1-F09-01: Bind Telegram Account Successfully**
  - Input: `POST /api/v1/internal/telegram/bind` with valid token, chatId, username, firstName, and header `X-Internal-Token`.
  - Authoritative Source: `PROJECT.md § 2. Internal Bot Endpoints`, `ORIGINAL_REQUEST.md § R1`
  - Expected Output: HTTP 200 OK with `success: true`, `userId`, `fullName`; link record created; token deleted.
  - Runner: `InternalTelegramControllerTest.java`
- **TC-T1-F09-02: Resolve Client by Chat ID**
  - Input: `GET /api/v1/internal/telegram/chat/123456789/client` with `X-Internal-Token`.
  - Authoritative Source: `PROJECT.md § 2. Internal Bot Endpoints`
  - Expected Output: HTTP 200 OK with `userId`, `fullName`, `email`, `companyName`, `phone`, `role`.
  - Runner: `InternalTelegramControllerTest.java`
- **TC-T1-F09-03: Fetch Client Active Tasks**
  - Input: `GET /api/v1/internal/clients/42/tasks` with `X-Internal-Token`.
  - Authoritative Source: `PROJECT.md § 2. Internal Bot Endpoints`
  - Expected Output: HTTP 200 OK with JSON array of tasks (`id`, `title`, `stageName`, `stageType`, `dueDate`).
  - Runner: `InternalTelegramControllerTest.java`
- **TC-T1-F09-04: Fetch Client Recent Documents**
  - Input: `GET /api/v1/internal/clients/42/documents` with `X-Internal-Token`.
  - Authoritative Source: `PROJECT.md § 2. Internal Bot Endpoints`
  - Expected Output: HTTP 200 OK with JSON array of documents (`id`, `fileName`, `status`, `createdAt`).
  - Runner: `InternalTelegramControllerTest.java`
- **TC-T1-F09-05: Fetch Pending Notifications and Acknowledge Batch**
  - Input: `GET /api/v1/internal/telegram/pending?limit=10` followed by `POST /api/v1/internal/telegram/ack` with results array.
  - Authoritative Source: `PROJECT.md § 2. Internal Bot Endpoints`
  - Expected Output: Pending returns notifications; ACK returns HTTP 200 OK with `acknowledgedCount` matching batch size.
  - Runner: `InternalTelegramControllerTest.java`

### Feature 10: CRM Event Outbox Hooking (F10)
- **TC-T1-F10-01: Task Stage Change Enqueues Notification for Linked Client**
  - Input: Call `TaskService.updateTaskStage(taskId, newStageId, null, employeeUser)` for a task belonging to a linked client.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R1`, `survey_report_3.md § 2.1`
  - Expected Output: A new row with `status = 'PENDING'` and formatted HTML message inserted in `telegram_notifications`.
  - Runner: `CrmTelegramEventIntegrationTest.java`
- **TC-T1-F10-02: Document Upload Enqueues Notification for Linked Client**
  - Input: Call `DocumentService.uploadDocument(clientId, taskId, multipartFile, employeeUser)`.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R1`, `survey_report_3.md § 2.2`
  - Expected Output: A new row with `status = 'PENDING'` inserted in `telegram_notifications`.
  - Runner: `CrmTelegramEventIntegrationTest.java`
- **TC-T1-F10-03: Centralized NotificationService Hook Integration**
  - Input: Invoke `NotificationService.createNotification(clientUser, "Заголовок", "Сообщение", "/client")`.
  - Authoritative Source: `survey_report_1.md § 6.1`, `survey_report_3.md § 2.3`
  - Expected Output: Telegram outbox enqueue called automatically when user has linked Telegram.
  - Runner: `CrmTelegramEventIntegrationTest.java`
- **TC-T1-F10-04: Unlinked User Event Does Not Enqueue Outbox Row**
  - Input: Update task stage for client who has NOT linked Telegram.
  - Authoritative Source: `survey_report_3.md § 2.3`
  - Expected Output: Zero rows added to `telegram_notifications`.
  - Runner: `CrmTelegramEventIntegrationTest.java`
- **TC-T1-F10-05: Transactional Atomicity on CRM Event Rollback**
  - Input: Trigger task stage update within transaction that subsequently throws RuntimeException.
  - Authoritative Source: `survey_report_3.md § 2.3`
  - Expected Output: Task change rolled back and corresponding Telegram outbox row NOT persisted in database.
  - Runner: `CrmTelegramEventIntegrationTest.java`

### Feature 11: Telegram Cleanup Scheduler (F11)
- **TC-T1-F11-01: Purge Expired Link Tokens**
  - Input: Insert link tokens with `expires_at` in the past and call `TelegramCleanupScheduler.purgeExpiredTokens()`.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R1`, `survey_report_1.md § 6.2`
  - Expected Output: Expired tokens deleted from `telegram_link_tokens`; unexpired tokens preserved.
  - Runner: `TelegramCleanupSchedulerTest.java`
- **TC-T1-F11-02: Preserve Unexpired Link Tokens**
  - Input: Tokens with expiration 10 minutes in the future during scheduler run.
  - Authoritative Source: `survey_report_1.md § 6.2`
  - Expected Output: All unexpired tokens remain intact.
  - Runner: `TelegramCleanupSchedulerTest.java`
- **TC-T1-F11-03: Purge Archived Sent Notifications Older than Retention Cutoff**
  - Input: Notifications with `status = 'SENT'` created 31 days ago.
  - Authoritative Source: `survey_report_1.md § 6.2`
  - Expected Output: Rows deleted from `telegram_notifications`.
  - Runner: `TelegramCleanupSchedulerTest.java`
- **TC-T1-F11-04: Purge Archived Failed Notifications Older than Retention Cutoff**
  - Input: Notifications with `status = 'FAILED'` created 31 days ago.
  - Authoritative Source: `survey_report_1.md § 6.2`
  - Expected Output: Rows deleted from `telegram_notifications`.
  - Runner: `TelegramCleanupSchedulerTest.java`
- **TC-T1-F11-05: Pending Notifications Never Purged by Cleanup Scheduler**
  - Input: Notification with `status = 'PENDING'` created 40 days ago.
  - Authoritative Source: `survey_report_1.md § 6.2`
  - Expected Output: Pending notification preserved (never deleted by archival cleanup).
  - Runner: `TelegramCleanupSchedulerTest.java`

### Feature 12: Backend Unit & Integration Tests (F12)
- **TC-T1-F12-01: TelegramLinkService Unit Test Suite**
  - Input: Execute `TelegramLinkServiceTest`.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R3`, `PROJECT.md § F12`
  - Expected Output: 100% pass covering token generation, validation, binding, and unlinking.
  - Runner: `TelegramLinkServiceTest.java`
- **TC-T1-F12-02: TelegramOutboxService Unit Test Suite**
  - Input: Execute `TelegramOutboxServiceTest`.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R3`, `PROJECT.md § F12`
  - Expected Output: 100% pass covering enqueue, fetch pending, batch ACK, retry counter.
  - Runner: `TelegramOutboxServiceTest.java`
- **TC-T1-F12-03: TelegramLinkController Integration Suite**
  - Input: Execute `TelegramLinkControllerIntegrationTest` using MockMvc.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R3`, `PROJECT.md § F12`
  - Expected Output: 100% pass verifying JSON schema and JWT authorization.
  - Runner: `TelegramLinkControllerIntegrationTest.java`
- **TC-T1-F12-04: InternalTelegramController Integration Suite**
  - Input: Execute `InternalTelegramControllerIntegrationTest` using MockMvc.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R3`, `PROJECT.md § F12`
  - Expected Output: 100% pass verifying `X-Internal-Token` enforcement on all 6 internal routes.
  - Runner: `InternalTelegramControllerIntegrationTest.java`
- **TC-T1-F12-05: Full Backend Regression Suite Execution**
  - Input: Execute `./gradlew test` across entire `zhan-finance-backend`.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R3`, `PROJECT.md § F12`
  - Expected Output: 100% test pass rate with zero regressions in existing CRM/Auth/LMS tests.
  - Runner: `./gradlew test`

### Feature 13: Bot Project Scaffolding (F13)
- **TC-T1-F13-01: Headless Mode Configuration**
  - Input: Inspect `application.yml` in `zhan-finance-tgbot` for `spring.main.web-application-type`.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R2`, `survey_report_2.md § 4.1`
  - Expected Output: Value is `none`.
  - Runner: `ZhanFinanceBotApplicationTest.java`
- **TC-T1-F13-02: Application Context Loads Without Servlet Container**
  - Input: Boot `ZhanFinanceBotApplication` in test environment.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R2`, `survey_report_2.md § 4.1`
  - Expected Output: Application context starts successfully without opening HTTP listening ports.
  - Runner: `ZhanFinanceBotApplicationTest.java`
- **TC-T1-F13-03: Gradle Build Configuration Validity**
  - Input: Execute `./gradlew check` in `zhan-finance-tgbot`.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R2`, `survey_report_2.md § 3.3`
  - Expected Output: Build succeeds with Java 17 toolchain and zero compilation errors.
  - Runner: `./gradlew check`
- **TC-T1-F13-04: Configuration Properties Mapping**
  - Input: Inject bot and backend properties (`bot.token`, `bot.username`, `jf.backend.base-url`, `jf.backend.internal-token`).
  - Authoritative Source: `survey_report_2.md § 4.2`
  - Expected Output: All properties bound correctly to configuration beans.
  - Runner: `BotConfigTest.java`
- **TC-T1-F13-05: EnableScheduling Annotation Present**
  - Input: Inspect `ZhanFinanceBotApplication` class annotations.
  - Authoritative Source: `survey_report_2.md § 4.1`
  - Expected Output: `@EnableScheduling` present to support outbox polling.
  - Runner: `ZhanFinanceBotApplicationTest.java`

### Feature 14: Telegram Long Polling Setup (F14)
- **TC-T1-F14-01: SpringLongPollingBot Implementation**
  - Input: Inspect bot class implementation in `zhan-finance-tgbot`.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R2`, `survey_report_2.md § 5.1`
  - Expected Output: Implements `SpringLongPollingBot` and returns configured bot token.
  - Runner: `ZhanFinanceTelegramBotTest.java`
- **TC-T1-F14-02: Update Consumer Implementation**
  - Input: Call `getUpdatesConsumer()` on bot instance.
  - Authoritative Source: `survey_report_2.md § 5.1`
  - Expected Output: Returns instance implementing `LongPollingSingleThreadUpdateConsumer`.
  - Runner: `ZhanFinanceTelegramBotTest.java`
- **TC-T1-F14-03: TelegramClient Bean Instantiation**
  - Input: Inspect Spring context for `TelegramClient` bean.
  - Authoritative Source: `survey_report_2.md § 5.1`
  - Expected Output: `TelegramClient` bean present and operational.
  - Runner: `BotConfigTest.java`
- **TC-T1-F14-04: Dispatch Update to CommandDispatcher**
  - Input: Feed valid `Update` containing text message into `consume(update)`.
  - Authoritative Source: `survey_report_2.md § 5.1`
  - Expected Output: `commandDispatcher.dispatch(update)` invoked with the update.
  - Runner: `ZhanFinanceTelegramBotTest.java`
- **TC-T1-F14-05: Update Consumer Exception Isolation**
  - Input: Feed update that triggers exception inside command dispatcher.
  - Authoritative Source: `survey_report_2.md § 5.1`
  - Expected Output: Exception caught and logged; bot receiver does not crash.
  - Runner: `ZhanFinanceTelegramBotTest.java`

### Feature 15: Backend REST Client (F15)
- **TC-T1-F15-01: Header X-Internal-Token Attached to All Requests**
  - Input: Execute API call via `JfInternalApiClient` with `MockRestServiceServer`.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R2`, `survey_report_2.md § 5.2`
  - Expected Output: Outgoing HTTP request contains `X-Internal-Token` header with configured secret.
  - Runner: `JfInternalApiClientTest.java`
- **TC-T1-F15-02: Bind Request Serialization and Deserialization**
  - Input: Call `bindTelegram(new BindRequest("token123", 123456L, "user_tg", "Murat"))`.
  - Authoritative Source: `PROJECT.md § Interface Contracts`, `survey_report_2.md § 5.2`
  - Expected Output: Sends POST to `/v1/internal/telegram/bind`, deserializes `BindResponse(true, 42, "Murat")`.
  - Runner: `JfInternalApiClientTest.java`
- **TC-T1-F15-03: Get Client by Chat ID Response Mapping**
  - Input: Call `getClientByChatId(123456L)`.
  - Authoritative Source: `PROJECT.md § Interface Contracts`, `survey_report_2.md § 5.2`
  - Expected Output: Deserializes `ClientSummary` with `userId`, `fullName`, `email`, `companyName`, `role`.
  - Runner: `JfInternalApiClientTest.java`
- **TC-T1-F15-04: Get Tasks Response Mapping**
  - Input: Call `getClientTasks(42L)`.
  - Authoritative Source: `PROJECT.md § Interface Contracts`, `survey_report_2.md § 5.2`
  - Expected Output: Deserializes list of `TaskSummaryDto` items.
  - Runner: `JfInternalApiClientTest.java`
- **TC-T1-F15-05: Connect and Read Timeout Configuration**
  - Input: Inspect request factory timeout settings on `RestClient`.
  - Authoritative Source: `survey_report_2.md § 5.2`
  - Expected Output: Connect timeout set to 3000ms, read timeout set to 5000ms.
  - Runner: `RestClientConfigTest.java`

### Feature 16: HtmlMessageFormatter (F16)
- **TC-T1-F16-01: Escape Ampersand Character**
  - Input: `HtmlMessageFormatter.escape("Berek & Co")`.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R2`, `survey_report_2.md § 5.3`
  - Expected Output: `"Berek &amp; Co"`.
  - Runner: `HtmlMessageFormatterTest.java`
- **TC-T1-F16-02: Escape Less-Than and Greater-Than Characters**
  - Input: `HtmlMessageFormatter.escape("Task <Q3> Update")`.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R2`, `survey_report_2.md § 5.3`
  - Expected Output: `"Task &lt;Q3&gt; Update"`.
  - Runner: `HtmlMessageFormatterTest.java`
- **TC-T1-F16-03: Format Bold and Italic Elements**
  - Input: `HtmlMessageFormatter.bold("Important")` and `HtmlMessageFormatter.italic("Note")`.
  - Authoritative Source: `survey_report_2.md § 5.3`
  - Expected Output: `"<b>Important</b>"` and `"<i>Note</i>"`.
  - Runner: `HtmlMessageFormatterTest.java`
- **TC-T1-F16-04: Format Task Notification Template**
  - Input: `formatTaskNotification("Сдача ФНО 300.00", "В работе", "2026-09-30")`.
  - Authoritative Source: `survey_report_2.md § 5.3`
  - Expected Output: Contains bold titles, escaped strings, code formatted stage, and portal deep link.
  - Runner: `HtmlMessageFormatterTest.java`
- **TC-T1-F16-05: Format Document Notification Template**
  - Input: `formatDocumentNotification("Акт сверки.pdf", "UPLOADED")`.
  - Authoritative Source: `survey_report_2.md § 5.3`
  - Expected Output: Contains bold titles, escaped document name, and link to client documents.
  - Runner: `HtmlMessageFormatterTest.java`

### Feature 17: /start Deeplink Command (F17)
- **TC-T1-F17-01: /start with Valid Token Binds Account**
  - Input: User sends `/start 7c9e6679-7425-40de-944b-e07fc1f90ae7` in Telegram.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R2`, `survey_report_2.md § 5.4`
  - Expected Output: Calls `bindTelegram(...)`, populates `UserSessionCache`, replies with welcome message and client name.
  - Runner: `StartCommandHandlerTest.java`
- **TC-T1-F17-02: /start with Expired Token Replies with Friendly Explanation**
  - Input: User sends `/start expired-token`.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R2`, `survey_report_2.md § 5.4`
  - Expected Output: Backend returns 400; bot replies with message stating link expired (15m) and advises generating new link.
  - Runner: `StartCommandHandlerTest.java`
- **TC-T1-F17-03: /start without Token when Already Linked**
  - Input: User sends `/start` without arguments when chat is already bound.
  - Authoritative Source: `survey_report_2.md § 5.4`
  - Expected Output: Bot replies: "Вы уже авторизованы как [Имя]. Используйте /tasks или /status."
  - Runner: `StartCommandHandlerTest.java`
- **TC-T1-F17-04: /start without Token when Not Linked**
  - Input: User sends `/start` without arguments when chat is not bound.
  - Authoritative Source: `survey_report_2.md § 5.4`
  - Expected Output: Bot replies with guidance to open CRM web portal to generate a linking link.
  - Runner: `StartCommandHandlerTest.java`
- **TC-T1-F17-05: Deeplink Token Extraction Logic**
  - Input: Input text `/start 32-character-uuid-token`.
  - Authoritative Source: `survey_report_2.md § 5.4`
  - Expected Output: Token parsed accurately without trailing whitespace or command prefix.
  - Runner: `StartCommandHandlerTest.java`

### Feature 18: Client Query Commands (F18)
- **TC-T1-F18-01: /tasks Returns Active Tasks List**
  - Input: Linked client sends `/tasks`.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R2`, `survey_report_2.md § 5.4`
  - Expected Output: Calls `getClientTasks()`, formats HTML list of tasks with titles, stages, and due dates.
  - Runner: `TasksCommandHandlerTest.java`
- **TC-T1-F18-02: /tasks when Client Has No Active Tasks**
  - Input: Linked client with 0 tasks sends `/tasks`.
  - Authoritative Source: `survey_report_2.md § 5.4`
  - Expected Output: Bot replies: "У вас нет активных задач."
  - Runner: `TasksCommandHandlerTest.java`
- **TC-T1-F18-03: /docs Returns Recent Documents List**
  - Input: Linked client sends `/docs`.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R2`, `survey_report_2.md § 5.4`
  - Expected Output: Calls `getClientDocuments()`, formats HTML list of documents with filenames and statuses.
  - Runner: `DocsCommandHandlerTest.java`
- **TC-T1-F18-04: /status Returns Company and Summary Overview**
  - Input: Linked client sends `/status`.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R2`, `survey_report_2.md § 5.4`
  - Expected Output: Displays summary card with client name, company name, active task count, and document count.
  - Runner: `StatusCommandHandlerTest.java`
- **TC-T1-F18-05: Query Commands Prompt Unlinked Users to Link Account**
  - Input: Unlinked user sends `/tasks`, `/docs`, or `/status`.
  - Authoritative Source: `survey_report_2.md § 5.4`
  - Expected Output: Bot prompts user that account is not linked and provides instructions to link.
  - Runner: `CommandHandlerUnlinkedTest.java`

### Feature 19: /unlink and /help Commands (F19)
- **TC-T1-F19-01: /unlink Unlinks Bound Account**
  - Input: Linked client sends `/unlink`.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R2`, `survey_report_2.md § 5.4`
  - Expected Output: Calls `DELETE /v1/internal/telegram/chat/{chatId}`, evicts `UserSessionCache`, replies with confirmation.
  - Runner: `UnlinkCommandHandlerTest.java`
- **TC-T1-F19-02: /unlink when Not Bound**
  - Input: Unlinked user sends `/unlink`.
  - Authoritative Source: `survey_report_2.md § 5.4`
  - Expected Output: Bot replies: "Аккаунт не привязан."
  - Runner: `UnlinkCommandHandlerTest.java`
- **TC-T1-F19-03: /help Returns Full Command Summary**
  - Input: User sends `/help`.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R2`, `survey_report_2.md § 5.4`
  - Expected Output: Bot sends formatted list of all available commands (`/start`, `/tasks`, `/docs`, `/status`, `/unlink`, `/help`).
  - Runner: `HelpCommandHandlerTest.java`
- **TC-T1-F19-04: /help Includes WhatsApp SLA Support Link**
  - Input: User sends `/help`.
  - Authoritative Source: `PROJECT.md § Behavior & Communication Rules (Rule 14)`, `survey_report_2.md § 5.4`
  - Expected Output: Message includes direct WhatsApp support link (`wa.me/77750584021` / `+7 775 058 40 21`).
  - Runner: `HelpCommandHandlerTest.java`
- **TC-T1-F19-05: Case-Insensitive Command Matching**
  - Input: User sends `/HELP` or `/Tasks`.
  - Authoritative Source: `survey_report_2.md § 5.4`
  - Expected Output: Command handler recognized and executed correctly regardless of casing.
  - Runner: `CommandDispatcherTest.java`

### Feature 20: Outbox Poller & Rate Limiter (F20)
- **TC-T1-F20-01: Scheduled Poller Fetches Pending Notifications**
  - Input: Poller triggered via `@Scheduled` execution.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R2`, `survey_report_2.md § 5.5`
  - Expected Output: Calls `getPendingNotifications(batchSize)` with limit 50.
  - Runner: `OutboxNotificationPollerTest.java`
- **TC-T1-F20-02: Rate Limiter Enforces 40ms Inter-Message Delay**
  - Input: Poller processing batch of 10 notifications.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R2`, `survey_report_2.md § 5.5`
  - Expected Output: Measures at least 360ms elapsed time between first and tenth dispatch (enforcing 40ms/msg).
  - Runner: `OutboxNotificationPollerTest.java`
- **TC-T1-F20-03: Successful Deliveries Acknowledged as SENT**
  - Input: TelegramClient executes messages successfully.
  - Authoritative Source: `PROJECT.md § Interface Contracts`, `survey_report_2.md § 5.5`
  - Expected Output: Calls `acknowledgeNotifications()` with ACK items containing `status: "SENT"`.
  - Runner: `OutboxNotificationPollerTest.java`
- **TC-T1-F20-04: Failed Deliveries Acknowledged as FAILED with Error Text**
  - Input: TelegramClient throws `TelegramApiException` for specific message.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R2`, `survey_report_2.md § 5.5`
  - Expected Output: Calls `acknowledgeNotifications()` with ACK items containing `status: "FAILED"` and error description.
  - Runner: `OutboxNotificationPollerTest.java`
- **TC-T1-F20-05: Overlapping Polling Prevention**
  - Input: Trigger poller while previous batch dispatch is still sleeping through 40ms delays.
  - Authoritative Source: `survey_report_2.md § 5.5`
  - Expected Output: `AtomicBoolean processingLock` skips second execution; no duplicate message dispatches occur.
  - Runner: `OutboxNotificationPollerTest.java`

### Feature 21: Bot Unit & Integration Tests (F21)
- **TC-T1-F21-01: HtmlMessageFormatter Unit Test Suite**
  - Input: Execute `HtmlMessageFormatterTest`.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R3`, `survey_report_2.md § 8.1`
  - Expected Output: 100% pass across escaping, tag formatting, and null safety.
  - Runner: `HtmlMessageFormatterTest.java`
- **TC-T1-F21-02: CommandDispatcher Routing Unit Test Suite**
  - Input: Execute `CommandDispatcherTest`.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R3`, `survey_report_2.md § 8.1`
  - Expected Output: 100% pass verifying correct handler assignment for all commands.
  - Runner: `CommandDispatcherTest.java`
- **TC-T1-F21-03: StartCommandHandler Unit Test Suite**
  - Input: Execute `StartCommandHandlerTest`.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R3`, `survey_report_2.md § 8.1`
  - Expected Output: 100% pass covering happy path, invalid token, and existing session.
  - Runner: `StartCommandHandlerTest.java`
- **TC-T1-F21-04: OutboxNotificationPoller Unit Test Suite**
  - Input: Execute `OutboxNotificationPollerTest`.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R3`, `survey_report_2.md § 8.1`
  - Expected Output: 100% pass verifying throttling, error handling, and ACK construction.
  - Runner: `OutboxNotificationPollerTest.java`
- **TC-T1-F21-05: JfInternalApiClient Unit Test Suite**
  - Input: Execute `JfInternalApiClientTest` with `MockRestServiceServer`.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R3`, `survey_report_2.md § 8.1`
  - Expected Output: 100% pass verifying header injection and payload serialization.
  - Runner: `JfInternalApiClientTest.java`

### Feature 22: E2E Integration Test Suite (F22)
- **TC-T1-F22-01: End-to-End Account Linking and Status Check**
  - Input: User generates link in CRM -> Bot submits `/start <token>` -> Backend binds -> CRM status returns linked.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R3`, `PROJECT.md § F22`
  - Expected Output: 100% verification across all state changes and database records.
  - Runner: `TelegramE2EIntegrationTest.java`
- **TC-T1-F22-02: End-to-End Task Stage Change Push Delivery**
  - Input: Task stage updated in CRM -> Outbox row created -> Poller queries pending -> Message sent -> ACK updates row to SENT.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R3`, `PROJECT.md § F22`
  - Expected Output: Row transitions from PENDING to SENT; message received by Telegram client.
  - Runner: `TelegramE2EIntegrationTest.java`
- **TC-T1-F22-03: End-to-End Document Upload Push Delivery**
  - Input: Document uploaded for client -> Outbox row created -> Poller queries pending -> Message sent -> ACK updates row to SENT.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R3`, `PROJECT.md § F22`
  - Expected Output: Document push notification delivered and verified.
  - Runner: `TelegramE2EIntegrationTest.java`
- **TC-T1-F22-04: End-to-End Client Self-Service Query Verification**
  - Input: Client sends `/tasks` and `/docs` -> Bot fetches live backend data -> Formats and returns response.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R3`, `PROJECT.md § F22`
  - Expected Output: Real CRM tasks and documents returned matching database state.
  - Runner: `TelegramE2EIntegrationTest.java`
- **TC-T1-F22-05: End-to-End Unlink Lifecycle Verification**
  - Input: Client sends `/unlink` -> Link deleted in backend -> Subsequent task updates do NOT enqueue outbox notifications.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R3`, `PROJECT.md § F22`
  - Expected Output: Unlink confirmed; zero spam notifications after unlinking.
  - Runner: `TelegramE2EIntegrationTest.java`

---

## 3. Tier 2: Boundary, Corner & Adversarial Cases

### Feature 1: V124 Flyway Migration Boundaries (F1)
- **TC-T2-F01-01: Reject Duplicate Chat ID Binding in Schema**
  - Input: Insert two rows into `telegram_links` with distinct `user_id` but identical `chat_id`.
  - Authoritative Source: `survey_report_1.md § 2.3`
  - Expected Output: PostgreSQL unique constraint violation on `chat_id`.
  - Runner: `TelegramMigrationBoundaryTest.java`
- **TC-T2-F01-02: Reject Duplicate User ID Binding in Schema**
  - Input: Insert two rows into `telegram_links` with identical `user_id` but distinct `chat_id`.
  - Authoritative Source: `survey_report_1.md § 2.3`
  - Expected Output: PostgreSQL unique constraint violation on `user_id`.
  - Runner: `TelegramMigrationBoundaryTest.java`
- **TC-T2-F01-03: Foreign Key Cascade on User Deletion**
  - Input: Delete a user row from `app_users` that possesses a `telegram_links` record.
  - Authoritative Source: `survey_report_1.md § 2.3`
  - Expected Output: Associated `telegram_links` record automatically deleted via `ON DELETE CASCADE`.
  - Runner: `TelegramMigrationBoundaryTest.java`
- **TC-T2-F01-04: Nullable telegram_username Handling**
  - Input: Insert `telegram_links` record with `telegram_username = NULL` (user has no Telegram handle).
  - Authoritative Source: `survey_report_1.md § 2.3`
  - Expected Output: Insert succeeds; null handle allowed.
  - Runner: `TelegramMigrationBoundaryTest.java`
- **TC-T2-F01-05: Non-Existent User ID Rejection**
  - Input: Insert `telegram_links` referencing non-existent `user_id = 999999`.
  - Authoritative Source: `survey_report_1.md § 2.3`
  - Expected Output: Foreign key violation error.
  - Runner: `TelegramMigrationBoundaryTest.java`

### Feature 2: V125 Flyway Migration Boundaries (F2)
- **TC-T2-F02-01: Null User ID on Client Deletion (ON DELETE SET NULL)**
  - Input: Delete a user from `app_users` whose ID is referenced in `telegram_notifications`.
  - Authoritative Source: `survey_report_1.md § 2.3`
  - Expected Output: Notification record preserved; `user_id` set to `NULL`.
  - Runner: `TelegramMigrationBoundaryTest.java`
- **TC-T2-F02-02: Very Large Notification Text Payload**
  - Input: Insert notification with 100,000 characters of text into `message`.
  - Authoritative Source: `survey_report_1.md § 2.3`
  - Expected Output: `TEXT` column accommodates large payload without truncation error.
  - Runner: `TelegramMigrationBoundaryTest.java`
- **TC-T2-F02-03: Zero Attempts Allowed**
  - Input: Insert notification with `attempts = 0`.
  - Authoritative Source: `survey_report_1.md § 2.3`
  - Expected Output: Successfully persists.
  - Runner: `TelegramMigrationBoundaryTest.java`
- **TC-T2-F02-04: Long Error Text Recording**
  - Input: Update `last_error` with full 5,000 character Java stack trace.
  - Authoritative Source: `survey_report_1.md § 2.3`
  - Expected Output: Persists without database truncation.
  - Runner: `TelegramMigrationBoundaryTest.java`
- **TC-T2-F02-05: Invalid Status String Handling**
  - Input: Attempt to update `status` with 30-character string (column is VARCHAR(20)).
  - Authoritative Source: `survey_report_1.md § 2.3`
  - Expected Output: Database rejects with value too long error.
  - Runner: `TelegramMigrationBoundaryTest.java`

### Feature 3: INTERNAL_BOT Security Role Boundaries (F3)
- **TC-T2-F03-01: Client Role Cannot Access /api/v1/internal/****
  - Input: Send request to `/api/v1/internal/telegram/pending` with valid CLIENT JWT.
  - Authoritative Source: `survey_report_1.md § 3.2`, `SecurityConfig.java`
  - Expected Output: HTTP 403 Forbidden.
  - Runner: `InternalSecurityBoundaryTest.java`
- **TC-T2-F03-02: Employee Role Cannot Access /api/v1/internal/****
  - Input: Send request to `/api/v1/internal/telegram/pending` with valid EMPLOYEE JWT.
  - Authoritative Source: `survey_report_1.md § 3.2`
  - Expected Output: HTTP 403 Forbidden.
  - Runner: `InternalSecurityBoundaryTest.java`
- **TC-T2-F03-03: Admin Role Cannot Access /api/v1/internal/** without Internal Token**
  - Input: Send request to `/api/v1/internal/telegram/pending` with valid ADMIN JWT but no `X-Internal-Token`.
  - Authoritative Source: `survey_report_1.md § 3.2`
  - Expected Output: HTTP 403 Forbidden (requires `ROLE_INTERNAL_BOT`).
  - Runner: `InternalSecurityBoundaryTest.java`
- **TC-T2-F03-04: INTERNAL_BOT Role Cannot Access Client Personal Endpoints**
  - Input: Attempt to access `/api/v1/users/me` with `ROLE_INTERNAL_BOT` principal.
  - Authoritative Source: `survey_report_1.md § 3.1`
  - Expected Output: HTTP 403 Forbidden or 401 Unauthorized (requires user authentication).
  - Runner: `InternalSecurityBoundaryTest.java`
- **TC-T2-F03-05: Case-Sensitive Role Check (internal_bot vs INTERNAL_BOT)**
  - Input: Authority string `ROLE_internal_bot` in SecurityContext.
  - Authoritative Source: `Role.java`
  - Expected Output: Access denied; strict case matching enforced.
  - Runner: `InternalSecurityBoundaryTest.java`

### Feature 4: InternalTokenFilter Boundaries (F4)
- **TC-T2-F04-01: Timing Attack Defense: Byte-by-Byte Timing Invariance**
  - Input: Submit tokens with partial matches of increasing length (1 char, 8 chars, 16 chars, 31 chars matching 32-char secret).
  - Authoritative Source: `ORIGINAL_REQUEST.md § R1`, `survey_report_3.md § 4.2`
  - Expected Output: Execution time remains uniform across all mismatch lengths due to `MessageDigest.isEqual`.
  - Runner: `InternalTokenFilterTimingTest.java`
- **TC-T2-F04-02: Empty Header Value Rejection**
  - Input: Send request with header `X-Internal-Token: ""`.
  - Authoritative Source: `survey_report_1.md § 3.3`
  - Expected Output: HTTP 401 Unauthorized.
  - Runner: `InternalTokenFilterTest.java`
- **TC-T2-F04-03: Whitespace-Only Header Value Rejection**
  - Input: Send request with header `X-Internal-Token: "   "`.
  - Authoritative Source: `survey_report_1.md § 3.3`
  - Expected Output: HTTP 401 Unauthorized.
  - Runner: `InternalTokenFilterTest.java`
- **TC-T2-F04-04: Excessively Long Token Header (10,000 chars)**
  - Input: Send request with 10KB header value to test buffer handling.
  - Authoritative Source: `survey_report_1.md § 3.3`
  - Expected Output: HTTP 401 Unauthorized without server error or crash.
  - Runner: `InternalTokenFilterTest.java`
- **TC-T2-F04-05: Unconfigured Internal Token Fail-Fast Behavior**
  - Input: Start application with empty or unconfigured `app.security.internal-bot-token`.
  - Authoritative Source: `CONTEXT.md § P0-9 Default secrets fail-fast`, `survey_report_3.md § 4.2`
  - Expected Output: Application fails to start or rejects all internal requests with 500/401.
  - Runner: `InternalTokenFilterTest.java`

### Feature 5: Rate Limit Whitelisting Boundaries (F5)
- **TC-T2-F05-01: Path Traversal Bypass Attempt on Rate Limiter**
  - Input: Access `/api/v1/internal/../tasks` to attempt rate limit bypass on regular endpoints.
  - Authoritative Source: `survey_report_1.md § 3.4`
  - Expected Output: Request normalized by servlet; rate limit applies normally to `/tasks`.
  - Runner: `ApiRateLimitFilterBoundaryTest.java`
- **TC-T2-F05-02: Prefix Collision Attack (/api/v1/internal_fake)**
  - Input: Access `/api/v1/internal_fake/endpoint`.
  - Authoritative Source: `survey_report_1.md § 3.4`
  - Expected Output: Not whitelisted; subject to general rate limit bucket.
  - Runner: `ApiRateLimitFilterBoundaryTest.java`
- **TC-T2-F05-03: Subpath Whitelisting with Deep Nesting**
  - Input: Access `/api/v1/internal/telegram/chat/123/client`.
  - Authoritative Source: `survey_report_1.md § 3.4`
  - Expected Output: Fully whitelisted.
  - Runner: `ApiRateLimitFilterBoundaryTest.java`
- **TC-T2-F05-04: High Concurrency Burst (50 Threads Polling Simultaneously)**
  - Input: 50 concurrent threads hitting `/api/v1/internal/telegram/pending` within 100ms.
  - Authoritative Source: `survey_report_1.md § 3.4`
  - Expected Output: 0 requests throttled with HTTP 429.
  - Runner: `ApiRateLimitFilterBoundaryTest.java`
- **TC-T2-F05-05: Whitelisting Behavior When X-Forwarded-For Is Spoofed**
  - Input: Request with spoofed `X-Forwarded-For: 1.2.3.4` on internal route.
  - Authoritative Source: `survey_report_1.md § 3.4`
  - Expected Output: Internal path whitelist takes precedence; request not throttled.
  - Runner: `ApiRateLimitFilterBoundaryTest.java`

### Feature 6: Telegram Link Entities Boundaries (F6)
- **TC-T2-F06-01: Negative Chat ID Handling (Telegram Supergroups / Channels)**
  - Input: Save `TelegramLink` with negative `chat_id = -1001234567890L`.
  - Authoritative Source: Telegram Bot API specification
  - Expected Output: Persists successfully (BIGINT supports signed 64-bit integers).
  - Runner: `TelegramLinkRepositoryBoundaryTest.java`
- **TC-T2-F06-02: Re-Linking Same Chat ID to Different User**
  - Input: Chat ID 123 previously linked to User 1 is re-linked to User 2.
  - Authoritative Source: `survey_report_2.md § 6`
  - Expected Output: Service updates link or rejects based on conflict policy cleanly without constraint break.
  - Runner: `TelegramLinkRepositoryBoundaryTest.java`
- **TC-T2-F06-03: Expired Token Query Check**
  - Input: Token with `expires_at` 1 second in the past.
  - Authoritative Source: `survey_report_1.md § 5.1`
  - Expected Output: Service treats token as expired and refuses binding.
  - Runner: `TelegramLinkServiceBoundaryTest.java`
- **TC-T2-F06-04: Exact Expiration Boundary Check (expires_at == Instant.now())**
  - Input: Token with `expires_at` equal to check instant.
  - Authoritative Source: `survey_report_1.md § 5.1`
  - Expected Output: Treated as expired (`isAfter` check fails).
  - Runner: `TelegramLinkServiceBoundaryTest.java`
- **TC-T2-F06-05: Special Characters in Telegram Username**
  - Input: `telegramUsername = "user_name_123"`.
  - Authoritative Source: `survey_report_1.md § 4.2`
  - Expected Output: Persists cleanly in VARCHAR(64).
  - Runner: `TelegramLinkRepositoryBoundaryTest.java`

### Feature 7: Telegram Outbox Entity Boundaries (F7)
- **TC-T2-F07-01: Max Attempts Threshold (attempts == max_attempts)**
  - Input: Notification with `attempts = 3`, `maxAttempts = 3`.
  - Authoritative Source: `survey_report_1.md § 4.3`
  - Expected Output: Excluded from pending queue.
  - Runner: `TelegramNotificationRepositoryBoundaryTest.java`
- **TC-T2-F07-02: Attempts One Below Max (attempts == max_attempts - 1)**
  - Input: Notification with `attempts = 2`, `maxAttempts = 3`.
  - Authoritative Source: `survey_report_1.md § 4.3`
  - Expected Output: Included in pending queue for final retry.
  - Runner: `TelegramNotificationRepositoryBoundaryTest.java`
- **TC-T2-F07-03: Empty Message String Handling**
  - Input: Insert notification with `message = ""`.
  - Authoritative Source: `survey_report_1.md § 4.2`
  - Expected Output: Entity validation or service rejects empty message payload.
  - Runner: `TelegramOutboxServiceBoundaryTest.java`
- **TC-T2-F07-04: Non-Existent User ID for Outbox Notification**
  - Input: Save notification with `user_id = null`.
  - Authoritative Source: `survey_report_1.md § 2.3`
  - Expected Output: Notification persists successfully with nullable user.
  - Runner: `TelegramNotificationRepositoryBoundaryTest.java`
- **TC-T2-F07-05: Pagination Boundary (limit = 0 and limit > 100)**
  - Input: Query pending notifications with `limit = 0` and `limit = 500`.
  - Authoritative Source: `survey_report_3.md § 3.3`
  - Expected Output: Controller caps limit between 1 and 100 (default 50).
  - Runner: `InternalTelegramControllerBoundaryTest.java`

### Feature 8: User Link Endpoints Boundaries (F8)
- **TC-T2-F08-01: Unauthenticated Call to /generate Returns 401**
  - Input: `POST /api/v1/telegram/link/generate` without Authorization header.
  - Authoritative Source: `survey_report_1.md § 3.2`
  - Expected Output: HTTP 401 Unauthorized.
  - Runner: `TelegramLinkControllerBoundaryTest.java`
- **TC-T2-F08-02: Unauthenticated Call to /status Returns 401**
  - Input: `GET /api/v1/telegram/link/status` without Authorization header.
  - Authoritative Source: `survey_report_1.md § 3.2`
  - Expected Output: HTTP 401 Unauthorized.
  - Runner: `TelegramLinkControllerBoundaryTest.java`
- **TC-T2-F08-03: Unauthenticated Call to /link (DELETE) Returns 401**
  - Input: `DELETE /api/v1/telegram/link` without Authorization header.
  - Authoritative Source: `survey_report_1.md § 3.2`
  - Expected Output: HTTP 401 Unauthorized.
  - Runner: `TelegramLinkControllerBoundaryTest.java`
- **TC-T2-F08-04: Rapid Successive Calls to /generate**
  - Input: Call `/generate` 5 times in 1 second for single user.
  - Authoritative Source: `survey_report_1.md § 5.1`
  - Expected Output: Each call invalidates the previous token; exactly one valid token remains in DB.
  - Runner: `TelegramLinkControllerBoundaryTest.java`
- **TC-T2-F08-05: Delete Link when Already Unlinked Is Idempotent**
  - Input: `DELETE /api/v1/telegram/link` for user who is not linked.
  - Authoritative Source: `survey_report_1.md § 5.1`
  - Expected Output: HTTP 200 OK with `{ "success": true }` (idempotent operation).
  - Runner: `TelegramLinkControllerBoundaryTest.java`

### Feature 9: Internal Bot Endpoints Boundaries (F9)
- **TC-T2-F09-01: Bind with Expired Token Returns 400 Bad Request**
  - Input: `POST /api/v1/internal/telegram/bind` with expired token.
  - Authoritative Source: `PROJECT.md § Interface Contracts`, `survey_report_1.md § 5.2`
  - Expected Output: HTTP 400 Bad Request with error message indicating token invalid or expired.
  - Runner: `InternalTelegramControllerBoundaryTest.java`
- **TC-T2-F09-02: Bind with Non-Existent Token Returns 400 Bad Request**
  - Input: `POST /api/v1/internal/telegram/bind` with random unknown UUID token.
  - Authoritative Source: `PROJECT.md § Interface Contracts`
  - Expected Output: HTTP 400 Bad Request.
  - Runner: `InternalTelegramControllerBoundaryTest.java`
- **TC-T2-F09-03: Client Query for Unlinked Chat ID Returns 404**
  - Input: `GET /api/v1/internal/telegram/chat/999999999/client`.
  - Authoritative Source: `PROJECT.md § Interface Contracts`
  - Expected Output: HTTP 404 Not Found.
  - Runner: `InternalTelegramControllerBoundaryTest.java`
- **TC-T2-F09-04: Tasks Query for Non-Existent Client ID Returns Empty List**
  - Input: `GET /api/v1/internal/clients/999999/tasks`.
  - Authoritative Source: `survey_report_1.md § 5.2`
  - Expected Output: HTTP 200 OK with empty JSON array `[]`.
  - Runner: `InternalTelegramControllerBoundaryTest.java`
- **TC-T2-F09-05: Empty ACK Batch Payload Handling**
  - Input: `POST /api/v1/internal/telegram/ack` with `{ "processed": [] }`.
  - Authoritative Source: `PROJECT.md § Interface Contracts`
  - Expected Output: HTTP 200 OK with `acknowledgedCount: 0`.
  - Runner: `InternalTelegramControllerBoundaryTest.java`

### Feature 10: CRM Event Outbox Hooking Boundaries (F10)
- **TC-T2-F10-01: Task Stage Update with Null Client Does Not Throw**
  - Input: Update task that has no associated client (`task.getClient() == null`).
  - Authoritative Source: `survey_report_3.md § 2.1`
  - Expected Output: Method completes normally; zero outbox rows enqueued.
  - Runner: `CrmTelegramEventBoundaryTest.java`
- **TC-T2-F10-02: Batch Task Updates For Same Client Consolidates or Enqueues Each**
  - Input: Batch update changing stage for 5 tasks belonging to same client.
  - Authoritative Source: `survey_report_3.md § 2.1`
  - Expected Output: 5 notifications enqueued without transaction deadlock.
  - Runner: `CrmTelegramEventBoundaryTest.java`
- **TC-T2-F10-03: Cyrillic and Special Characters in Task Title**
  - Input: Task title with Kazakh Cyrillic: `"ҚҚС бойынша 300.00 есебі (ІІ-тоқсан) & Акт <№14>"`.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R2`, `survey_report_2.md § 5.3`
  - Expected Output: Persisted with full UTF-8 fidelity; HTML escaped in message.
  - Runner: `CrmTelegramEventBoundaryTest.java`
- **TC-T2-F10-04: Document Upload with Large Filename**
  - Input: Upload document with 200-character filename containing spaces and dashes.
  - Authoritative Source: `survey_report_3.md § 2.2`
  - Expected Output: Enqueued notification message formats without error.
  - Runner: `CrmTelegramEventBoundaryTest.java`
- **TC-T2-F10-05: Enqueue Failure Does Not Break Primary CRM Operation**
  - Input: Mock outbox service throwing exception during notification creation.
  - Authoritative Source: `survey_report_3.md § 2.3`
  - Expected Output: Exception caught and logged; task stage update succeeds.
  - Runner: `CrmTelegramEventBoundaryTest.java`

### Feature 11: Telegram Cleanup Scheduler Boundaries (F11)
- **TC-T2-F11-01: Scheduler Execution with Empty Tables (Zero Rows)**
  - Input: Run `TelegramCleanupScheduler` when `telegram_link_tokens` and `telegram_notifications` are empty.
  - Authoritative Source: `survey_report_1.md § 6.2`
  - Expected Output: Completes cleanly with 0 deletions and zero errors.
  - Runner: `TelegramCleanupSchedulerBoundaryTest.java`
- **TC-T2-F11-02: Large Volume Token Cleanup (100,000 Expired Rows)**
  - Input: 100,000 expired tokens in database during scheduled purge.
  - Authoritative Source: `survey_report_1.md § 6.2`
  - Expected Output: Purge executes via single bulk query or batch chunks without OutOfMemoryError.
  - Runner: `TelegramCleanupSchedulerBoundaryTest.java`
- **TC-T2-F11-03: Boundary Retention Cutoff (Exactly 30 Days Ago)**
  - Input: Notification created at `Instant.now().minus(30, ChronoUnit.DAYS)`.
  - Authoritative Source: `survey_report_1.md § 6.2`
  - Expected Output: Preserved if cutoff is strictly before (<).
  - Runner: `TelegramCleanupSchedulerBoundaryTest.java`
- **TC-T2-F11-04: Scheduler Triggered During Active Database Migration**
  - Input: Scheduler method invoked while table lock is temporarily held.
  - Authoritative Source: `survey_report_1.md § 6.2`
  - Expected Output: Recovers on next scheduled iteration without terminating daemon.
  - Runner: `TelegramCleanupSchedulerBoundaryTest.java`
- **TC-T2-F11-05: Cleanup Retention Parameter Configurable via Environment**
  - Input: Set retention to 7 days via configuration property.
  - Authoritative Source: `survey_report_3.md § 5`
  - Expected Output: Scheduler uses configured 7-day retention cutoff.
  - Runner: `TelegramCleanupSchedulerBoundaryTest.java`

### Feature 12: Backend Unit & Integration Tests Boundaries (F12)
- **TC-T2-F12-01: MockMvc Context-Path Alignment Verification**
  - Input: Request to `/v1/telegram/link/status` without `.contextPath("/api")` in MockMvc.
  - Authoritative Source: `survey_report_3.md § 6.1`
  - Expected Output: MockMvc test enforces correct servlet path matching `/api/v1/...`.
  - Runner: `TelegramLinkControllerIntegrationTest.java`
- **TC-T2-F12-02: SecurityContext Cleared Between Consecutive Tests**
  - Input: Run tests sequentially with different user authorities.
  - Authoritative Source: `survey_report_3.md § 6.1`
  - Expected Output: `@DirtiesContext` or `SecurityContextHolder.clearContext()` ensures zero leak.
  - Runner: `InternalTelegramControllerIntegrationTest.java`
- **TC-T2-F12-03: MockitoBean Lifecycle on Spring Boot 3.4+ / 4.1.0**
  - Input: Use `@MockitoBean` for service mocks in WebMvcTest.
  - Authoritative Source: `survey_report_3.md § 6.1`
  - Expected Output: Bean injected cleanly without deprecation warnings.
  - Runner: `InternalTelegramControllerIntegrationTest.java`
- **TC-T2-F12-04: Test Execution with Database Down Emulation**
  - Input: Repository throws DataAccessException during controller execution.
  - Authoritative Source: `survey_report_1.md § 3.3`
  - Expected Output: GlobalExceptionHandler formats HTTP 500 JSON response with requestId.
  - Runner: `TelegramLinkControllerIntegrationTest.java`
- **TC-T2-F12-05: JaCoCo Coverage Threshold Enforcement**
  - Input: Run `./gradlew check` with low test execution on telegram package.
  - Authoritative Source: `TEST_INFRA.md § 6`
  - Expected Output: Build fails if line coverage falls below 70%.
  - Runner: `./gradlew check`

### Feature 13: Bot Project Scaffolding Boundaries (F13)
- **TC-T2-F13-01: Missing TELEGRAM_BOT_TOKEN Environment Variable**
  - Input: Start bot without `TELEGRAM_BOT_TOKEN`.
  - Authoritative Source: `survey_report_2.md § 4.2`
  - Expected Output: Fails fast with clear configuration error message.
  - Runner: `BotConfigBoundaryTest.java`
- **TC-T2-F13-02: Missing INTERNAL_BOT_TOKEN Environment Variable**
  - Input: Start bot without `INTERNAL_BOT_TOKEN`.
  - Authoritative Source: `survey_report_2.md § 4.2`
  - Expected Output: Fails fast with clear configuration error message.
  - Runner: `RestClientConfigBoundaryTest.java`
- **TC-T2-F13-03: Malformed Backend Base URL Configuration**
  - Input: Set `jf.backend.base-url: "not-a-valid-url"`.
  - Authoritative Source: `survey_report_2.md § 4.2`
  - Expected Output: Fails during client bean initialization.
  - Runner: `RestClientConfigBoundaryTest.java`
- **TC-T2-F13-04: Trailing Slash Normalization in Base URL**
  - Input: Base URL configured with trailing slash: `http://localhost:8080/api/`.
  - Authoritative Source: `survey_report_2.md § 4.2`
  - Expected Output: RestClient normalizes URL without producing double slashes (`//v1/...`).
  - Runner: `RestClientConfigBoundaryTest.java`
- **TC-T2-F13-05: Memory Footprint Verification Under Headless Mode**
  - Input: Measure resident set size (RSS) of bot process in headless mode.
  - Authoritative Source: `survey_report_2.md § 1`
  - Expected Output: Heap usage remains below 64MB under idle state.
  - Runner: `HeadlessFootprintTest.java`

### Feature 14: Telegram Long Polling Boundaries (F14)
- **TC-T2-F14-01: Update with Null Message Object**
  - Input: Feed `Update` containing only inline query or channel post (no message).
  - Authoritative Source: `survey_report_2.md § 5.1`
  - Expected Output: Bot ignores update gracefully without NullPointerException.
  - Runner: `ZhanFinanceTelegramBotBoundaryTest.java`
- **TC-T2-F14-02: Update with Non-Text Message (Photo / Sticker / Voice)**
  - Input: User sends image or voice message to bot.
  - Authoritative Source: `survey_report_2.md § 5.1`
  - Expected Output: Bot detects non-text update, replies with instructions to use text commands.
  - Runner: `ZhanFinanceTelegramBotBoundaryTest.java`
- **TC-T2-F14-03: Telegram API Network Drop During Polling Loop**
  - Input: Network connection dropped during long poll request.
  - Authoritative Source: `survey_report_2.md § 5.1`
  - Expected Output: Long polling receiver logs warning and automatically reconnects with backoff.
  - Runner: `ZhanFinanceTelegramBotBoundaryTest.java`
- **TC-T2-F14-04: Bot Added to Group Chat with Multiple Messages**
  - Input: Updates received from group chat ID.
  - Authoritative Source: `survey_report_2.md § 5.1`
  - Expected Output: Command handler handles or directs user to private chat.
  - Runner: `ZhanFinanceTelegramBotBoundaryTest.java`
- **TC-T2-F14-05: Duplicate Update IDs Received from Telegram Server**
  - Input: Deliver update with previously processed updateId.
  - Authoritative Source: `survey_report_2.md § 5.1`
  - Expected Output: Consumer processes idempotently without corrupting state.
  - Runner: `ZhanFinanceTelegramBotBoundaryTest.java`

### Feature 15: Backend REST Client Boundaries (F15)
- **TC-T2-F15-01: Backend Returns 500 Internal Server Error**
  - Input: Backend fails with 500 during `getClientTasks()`.
  - Authoritative Source: `survey_report_2.md § 5.2`
  - Expected Output: `JfInternalApiClient` catches `HttpServerErrorException` and returns empty list or throws handled domain exception.
  - Runner: `JfInternalApiClientBoundaryTest.java`
- **TC-T2-F15-02: Backend Connection Timeout (Exceeding 3000ms)**
  - Input: Mock backend delays response by 4000ms.
  - Authoritative Source: `survey_report_2.md § 5.2`
  - Expected Output: RestClient aborts request with `ResourceAccessException` (timeout).
  - Runner: `JfInternalApiClientBoundaryTest.java`
- **TC-T2-F15-03: Backend Read Timeout (Exceeding 5000ms)**
  - Input: Backend establishes connection but stalls on data transfer.
  - Authoritative Source: `survey_report_2.md § 5.2`
  - Expected Output: RestClient aborts request after 5000ms.
  - Runner: `JfInternalApiClientBoundaryTest.java`
- **TC-T2-F15-04: Malformed JSON Response from Backend**
  - Input: Backend returns truncated JSON payload: `{ "userId": 42, "full`.
  - Authoritative Source: `survey_report_2.md § 5.2`
  - Expected Output: RestClient catches deserialization exception gracefully.
  - Runner: `JfInternalApiClientBoundaryTest.java`
- **TC-T2-F15-05: Backend Returns 404 on Client Resolution**
  - Input: Backend returns 404 for unlinked chat ID.
  - Authoritative Source: `survey_report_2.md § 5.2`
  - Expected Output: `getClientByChatId()` returns `Optional.empty()` cleanly.
  - Runner: `JfInternalApiClientBoundaryTest.java`

### Feature 16: HtmlMessageFormatter Boundaries (F16)
- **TC-T2-F16-01: Null Input String Handling**
  - Input: `HtmlMessageFormatter.escape(null)`.
  - Authoritative Source: `survey_report_2.md § 5.3`
  - Expected Output: Returns empty string `""` without throwing NullPointerException.
  - Runner: `HtmlMessageFormatterBoundaryTest.java`
- **TC-T2-F16-02: Complex XSS Injection Attempt in Task Title**
  - Input: `"<script>alert('xss')</script><b onmouseover='hack()'>Test</b>"`.
  - Authoritative Source: `survey_report_2.md § 5.3`
  - Expected Output: `"&lt;script&gt;alert('xss')&lt;/script&gt;&lt;b onmouseover='hack()'&gt;Test&lt;/b&gt;"`.
  - Runner: `HtmlMessageFormatterBoundaryTest.java`
- **TC-T2-F16-03: Consecutive Meta-Characters (&<>&<>)**
  - Input: `"&&<<>>"`.
  - Authoritative Source: `survey_report_2.md § 5.3`
  - Expected Output: `"&amp;&amp;&lt;&lt;&gt;&gt;"`.
  - Runner: `HtmlMessageFormatterBoundaryTest.java`
- **TC-T2-F16-04: Already Escaped Entities (&amp;)**
  - Input: `"Text &amp; More"`.
  - Authoritative Source: `survey_report_2.md § 5.3`
  - Expected Output: `"Text &amp;amp; More"` (strict safe escaping prevents raw tag injection).
  - Runner: `HtmlMessageFormatterBoundaryTest.java`
- **TC-T2-F16-05: Task Notification with Null Deadline**
  - Input: `formatTaskNotification("Title", "Stage", null)`.
  - Authoritative Source: `survey_report_2.md § 5.3`
  - Expected Output: Formats message cleanly omitting the deadline row.
  - Runner: `HtmlMessageFormatterBoundaryTest.java`

### Feature 17: /start Deeplink Command Boundaries (F17)
- **TC-T2-F17-01: Malformed Deeplink Argument (Special Characters)**
  - Input: `/start ../../../etc/passwd` or `/start <script>`.
  - Authoritative Source: `survey_report_2.md § 5.4`
  - Expected Output: Fails validation; replies with invalid link message.
  - Runner: `StartCommandHandlerBoundaryTest.java`
- **TC-T2-F17-02: Excessively Long Token Argument (1,000 characters)**
  - Input: `/start ` followed by 1,000 alphanumeric characters.
  - Authoritative Source: `survey_report_2.md § 5.4`
  - Expected Output: Rejected as invalid token format without backend flood.
  - Runner: `StartCommandHandlerBoundaryTest.java`
- **TC-T2-F17-03: Replaying Used Token**
  - Input: Submit `/start <token>` twice with same token.
  - Authoritative Source: `survey_report_1.md § 5.2`
  - Expected Output: First attempt succeeds; second attempt returns invalid/expired token response.
  - Runner: `StartCommandHandlerBoundaryTest.java`
- **TC-T2-F17-04: Concurrent Binding with Same Token by Different Chats**
  - Input: Two Telegram chats send `/start <token>` with identical token simultaneously.
  - Authoritative Source: `survey_report_1.md § 5.2`
  - Expected Output: Exactly one chat bound successfully; second receives invalid token response.
  - Runner: `StartCommandHandlerBoundaryTest.java`
- **TC-T2-F17-05: User with Existing Link Re-Links to New Account**
  - Input: Chat ID already bound to User 1 sends `/start <token_for_user_2>`.
  - Authoritative Source: `survey_report_2.md § 6`
  - Expected Output: Old link updated to User 2; cache evicted and updated.
  - Runner: `StartCommandHandlerBoundaryTest.java`

### Feature 18: Client Query Commands Boundaries (F18)
- **TC-T2-F18-01: Tasks List with 100+ Active Tasks**
  - Input: Client has 150 active tasks.
  - Authoritative Source: `survey_report_2.md § 5.4`
  - Expected Output: Message truncated or paginated to remain within Telegram's 4096-character limit.
  - Runner: `TasksCommandHandlerBoundaryTest.java`
- **TC-T2-F18-02: Documents List with Zero Documents**
  - Input: Client has 0 uploaded documents.
  - Authoritative Source: `survey_report_2.md § 5.4`
  - Expected Output: Friendly empty state: "У вас пока нет документов."
  - Runner: `DocsCommandHandlerBoundaryTest.java`
- **TC-T2-F18-03: Client Profile with Null Company Name**
  - Input: User with role CLIENT but no company name populated.
  - Authoritative Source: `survey_report_2.md § 5.4`
  - Expected Output: `/status` displays "Не указана" instead of literal "null".
  - Runner: `StatusCommandHandlerBoundaryTest.java`
- **TC-T2-F18-04: Rapid Spamming of /tasks Command (Rate Throttling)**
  - Input: Client sends `/tasks` 20 times in 5 seconds.
  - Authoritative Source: `survey_report_2.md § 5.6`
  - Expected Output: `UserSessionCache` caches profile; prevents backend database overload.
  - Runner: `TasksCommandHandlerBoundaryTest.java`
- **TC-T2-F18-05: Client Profile with Missing Role Field**
  - Input: Backend returns client summary with null role.
  - Authoritative Source: `survey_report_2.md § 5.4`
  - Expected Output: Handled gracefully without NullPointerException.
  - Runner: `StatusCommandHandlerBoundaryTest.java`

### Feature 19: /unlink and /help Boundaries (F19)
- **TC-T2-F19-01: Repeated /unlink Calls (Idempotency)**
  - Input: User sends `/unlink` three times consecutively.
  - Authoritative Source: `survey_report_2.md § 5.4`
  - Expected Output: First call unlinks and confirms; subsequent calls reply "Аккаунт не привязан."
  - Runner: `UnlinkCommandHandlerBoundaryTest.java`
- **TC-T2-F19-02: Unlink when Backend Is Down**
  - Input: User sends `/unlink` while backend REST endpoint is temporarily unreachable.
  - Authoritative Source: `survey_report_2.md § 6`
  - Expected Output: Bot replies with error message asking user to try again shortly; cache preserved.
  - Runner: `UnlinkCommandHandlerBoundaryTest.java`
- **TC-T2-F19-03: Unknown Command Fallback**
  - Input: User sends `/foobar` or `/random`.
  - Authoritative Source: `survey_report_2.md § 5.4`
  - Expected Output: Bot replies: "Неизвестная команда. Введите /help для просмотра списка команд."
  - Runner: `CommandDispatcherBoundaryTest.java`
- **TC-T2-F19-04: Non-Command Random Chat Message**
  - Input: User sends "Привет, как дела?".
  - Authoritative Source: `survey_report_2.md § 5.4`
  - Expected Output: Bot prompts with available commands and support WhatsApp flow.
  - Runner: `CommandDispatcherBoundaryTest.java`
- **TC-T2-F19-05: /help Message Length Within Telegram Limits**
  - Input: Verify byte length of `/help` response text.
  - Authoritative Source: Telegram API 4096-byte limit
  - Expected Output: Text is well under 2,000 characters.
  - Runner: `HelpCommandHandlerBoundaryTest.java`

### Feature 20: Outbox Poller & Rate Limiter Boundaries (F20)
- **TC-T2-F20-01: User Blocks Bot (HTTP 403 Forbidden)**
  - Input: Telegram returns `403 Forbidden: bot was blocked by the user` for a notification.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R2`, `survey_report_2.md § 6`
  - Expected Output: Exception caught, ACK item marked `FAILED` with error text; backend deactivates link.
  - Runner: `OutboxNotificationPollerBoundaryTest.java`
- **TC-T2-F20-02: Telegram API 429 Too Many Requests**
  - Input: TelegramClient throws `TelegramApiRequestException` with `errorCode = 429`.
  - Authoritative Source: `survey_report_2.md § 6`
  - Expected Output: Poller pauses remaining batch dispatch and reschedules next run.
  - Runner: `OutboxNotificationPollerBoundaryTest.java`
- **TC-T2-F20-03: Chat Not Found (HTTP 400 Bad Request)**
  - Input: Telegram returns `400 Bad Request: chat not found`.
  - Authoritative Source: `survey_report_2.md § 6`
  - Expected Output: Marked as FAILED; attempts counter incremented toward dead-letter max.
  - Runner: `OutboxNotificationPollerBoundaryTest.java`
- **TC-T2-F20-04: Backend Down During Batch Acknowledgment**
  - Input: Telegram messages sent successfully, but backend ACK endpoint fails with 503.
  - Authoritative Source: `survey_report_2.md § 6`
  - Expected Output: Poller logs error; notifications remain PENDING in backend; duplicate delivery handled idempotently.
  - Runner: `OutboxNotificationPollerBoundaryTest.java`
- **TC-T2-F20-05: Zero Rate Limit Delay (delay = 0ms)**
  - Input: Configure `jf.outbox.rate-limit-delay-ms: 0` in test profile.
  - Authoritative Source: `survey_report_2.md § 5.5`
  - Expected Output: Poller executes batch immediately without sleeping.
  - Runner: `OutboxNotificationPollerBoundaryTest.java`

### Feature 21: Bot Unit & Integration Tests Boundaries (F21)
- **TC-T2-F21-01: Mock TelegramClient Simulates Network Flakiness**
  - Input: Configure mock `TelegramClient` to fail 50% of requests.
  - Authoritative Source: `survey_report_2.md § 8.1`
  - Expected Output: Poller accurately records partial success (5 SENT, 5 FAILED) in single ACK batch.
  - Runner: `OutboxNotificationPollerBoundaryTest.java`
- **TC-T2-F21-02: Cache Eviction on TTL Expiration**
  - Input: Cached profile accessed after 5-minute TTL.
  - Authoritative Source: `survey_report_2.md § 5.6`
  - Expected Output: Cache misses and fetches fresh profile from backend.
  - Runner: `UserSessionCacheTest.java`
- **TC-T2-F21-03: Cache Size Limit Eviction (5,000 Entries Max)**
  - Input: Insert 5,001 entries into `UserSessionCache`.
  - Authoritative Source: `survey_report_2.md § 5.6`
  - Expected Output: Least-recently-used (LRU) entry evicted.
  - Runner: `UserSessionCacheTest.java`
- **TC-T2-F21-04: RestClient Retries on Transient Network Disruption**
  - Input: Initial connection attempt throws IOException, second succeeds.
  - Authoritative Source: `survey_report_2.md § 5.2`
  - Expected Output: Request completes successfully on retry.
  - Runner: `JfInternalApiClientBoundaryTest.java`
- **TC-T2-F21-05: Headless Test Suite Runs Cleanly Without Display / Graphics**
  - Input: Run `./gradlew test` in headless Linux/CI environment.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R2`
  - Expected Output: 100% pass without `HeadlessException`.
  - Runner: `./gradlew test`

### Feature 22: E2E Integration Test Suite Boundaries (F22)
- **TC-T2-F22-01: End-to-End Dead-Letter Transition After 3 Consecutive Failures**
  - Input: Enqueue notification -> Poller fails 3 times -> Backend increments attempts to 3.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R1`, `survey_report_1.md § 4.3`
  - Expected Output: Notification status marked `FAILED`; permanently excluded from future polling batches.
  - Runner: `TelegramE2EBoundaryTest.java`
- **TC-T2-F22-02: End-to-End Expired Token Link Attempt**
  - Input: Generate link -> Fast-forward clock by 16 minutes -> Bot attempts `/start <token>`.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R1`, `survey_report_3.md § 3.2`
  - Expected Output: Linking rejected; database remains unlinked.
  - Runner: `TelegramE2EBoundaryTest.java`
- **TC-T2-F22-03: End-to-End Double Unlink Verification**
  - Input: Unlink via Telegram `/unlink` -> Attempt second unlink from CRM Web Portal.
  - Authoritative Source: `PROJECT.md § Interface Contracts`
  - Expected Output: Both actions succeed idempotently with zero errors.
  - Runner: `TelegramE2EBoundaryTest.java`
- **TC-T2-F22-04: End-to-End Special Character Push Delivery**
  - Input: Create task with title `"Отчет & Анализ <ТОО 'Береке'>"`.
  - Authoritative Source: `ORIGINAL_REQUEST.md § R2`, `survey_report_2.md § 5.3`
  - Expected Output: Enqueued, polled, and dispatched without Telegram parse error.
  - Runner: `TelegramE2EBoundaryTest.java`
- **TC-T2-F22-05: End-to-End Rate Limiter Whitelist Verification Under Heavy Load**
  - Input: 200 consecutive internal polling requests within 30 seconds.
  - Authoritative Source: `survey_report_1.md § 3.4`
  - Expected Output: 0 requests blocked by `ApiRateLimitFilter`.
  - Runner: `TelegramE2EBoundaryTest.java`

---

## 4. Tier 3: Cross-Feature Combinations (Pairwise Inter-Module)

### TC-T3-01: Account Linking Lifecycle (F8 + F17 + F15 + F9 + F6)
- **Workflow**:
  1. Client calls `POST /api/v1/telegram/link/generate` (F8) -> Receives token and deep link.
  2. Telegram Bot receives `/start <token>` (F17).
  3. Bot uses `JfInternalApiClient` (F15) to invoke `POST /api/v1/internal/telegram/bind` (F9).
  4. Backend verifies token, saves `TelegramLink` (F6), and deletes token.
  5. Client verifies status via `GET /api/v1/telegram/link/status` (F8) -> Returns `linked: true`.
- **Expected Outcome**: Complete account linking from CRM to Telegram confirmed end-to-end.
- **Runner**: `TelegramPairwiseLifecycleTest.java`

### TC-T3-02: Task Stage Transition to Telegram Push (F10 + F7 + F20 + F16 + F14 + F9)
- **Workflow**:
  1. Employee updates task stage in CRM (F10).
  2. Transactional hook enqueues `PENDING` row in `telegram_notifications` (F7).
  3. Bot poller queries `GET /api/v1/internal/telegram/pending` (F20).
  4. Formatter escapes message text to safe HTML (F16).
  5. Bot dispatches message via `TelegramClient` (F14).
  6. Bot sends `POST /api/v1/internal/telegram/ack` (F9) with status `SENT`.
  7. Backend marks notification `SENT` with `processedAt` timestamp (F7).
- **Expected Outcome**: Task stage update successfully reaches client in Telegram and updates outbox state.
- **Runner**: `TelegramPairwiseLifecycleTest.java`

### TC-T3-03: Document Upload to Telegram Push (F10 + F7 + F20 + F14 + F9)
- **Workflow**:
  1. Employee uploads document for client in CRM (F10).
  2. Hook enqueues notification in outbox (F7).
  3. Bot poller retrieves pending batch (F20).
  4. Bot transmits notification to client's chat ID (F14).
  5. Bot acknowledges delivery (F9).
- **Expected Outcome**: Client receives instant push alert with document name and CRM view link.
- **Runner**: `TelegramPairwiseLifecycleTest.java`

### TC-T3-04: Client Self-Service Query: Active Tasks (F18 + F15 + F9 + F16)
- **Workflow**:
  1. Client sends `/tasks` in Telegram (F18).
  2. Bot uses `JfInternalApiClient` (F15) to call `GET /api/v1/internal/clients/{id}/tasks` (F9).
  3. Backend queries `TaskRepository` and returns active task DTOs.
  4. Bot formats tasks as safe HTML list (F16) and replies to chat.
- **Expected Outcome**: Accurate task list displayed in chat.
- **Runner**: `TelegramPairwiseLifecycleTest.java`

### TC-T3-05: Client Self-Service Query: Recent Documents (F18 + F15 + F9 + F16)
- **Workflow**:
  1. Client sends `/docs` in Telegram (F18).
  2. Bot calls `GET /api/v1/internal/clients/{id}/documents` (F9).
  3. Backend queries `DocumentRepository` and returns document summary DTOs.
  4. Bot formats documents as safe HTML list (F16) and replies to chat.
- **Expected Outcome**: Recent documents list displayed in chat.
- **Runner**: `TelegramPairwiseLifecycleTest.java`

### TC-T3-06: Account Unlink and Notification Suppression (F19 + F9 + F6 + F10 + F7)
- **Workflow**:
  1. Client sends `/unlink` in Telegram (F19).
  2. Bot calls `DELETE /api/v1/internal/telegram/chat/{chatId}` (F9).
  3. Backend removes `TelegramLink` record (F6).
  4. Employee updates task stage in CRM for that client (F10).
  5. Hook checks for active Telegram link; finds none; does NOT enqueue outbox row (F7).
- **Expected Outcome**: Zero Telegram messages queued after unlinking.
- **Runner**: `TelegramPairwiseLifecycleTest.java`

### TC-T3-07: Bot Poller Rate Limiting Whitelist (F20 + F5 + F4 + F9)
- **Workflow**:
  1. Bot runs outbox poller on high frequency (every 5 seconds) (F20).
  2. Requests hit `ApiRateLimitFilter` (F5) with `X-Internal-Token` (F4).
  3. Filter verifies internal path is whitelisted (F5).
  4. Requests pass through to `InternalTelegramController` (F9) without HTTP 429 throttling.
- **Expected Outcome**: Zero rate limit blocks on internal bot communication.
- **Runner**: `TelegramPairwiseLifecycleTest.java`

### TC-T3-08: Link Token Expiration and Cleanup (F8 + F11 + F17 + F9)
- **Workflow**:
  1. Client generates link token (F8).
  2. Fast-forward clock past 15-minute TTL.
  3. `TelegramCleanupScheduler` runs `purgeExpiredTokens()` (F11).
  4. User attempts `/start <token>` in Telegram (F17).
  5. Backend rejects token as not found (F9).
- **Expected Outcome**: Expired token cleanly purged and rejected.
- **Runner**: `TelegramPairwiseLifecycleTest.java`

### TC-T3-09: User Blocking Bot Error Recovery (F20 + F14 + F9 + F7 + F6)
- **Workflow**:
  1. User blocks bot in Telegram.
  2. Outbox poller attempts to deliver task notification (F20).
  3. `TelegramClient` throws `TelegramApiException: 403 Forbidden` (F14).
  4. Poller sends ACK with `status: "FAILED"`, `error: "Forbidden: bot was blocked by the user"` (F9).
  5. Backend updates notification attempts and deactivates `TelegramLink` (F7, F6).
- **Expected Outcome**: Link deactivated to prevent future retry spam.
- **Runner**: `TelegramPairwiseLifecycleTest.java`

### TC-T3-10: Batch Notification Delivery with 40ms Throttling (F20 + F14 + F9 + F7)
- **Workflow**:
  1. 25 task updates occur simultaneously in CRM, creating 25 PENDING outbox rows (F7).
  2. Bot poller fetches all 25 rows in one batch (F20).
  3. Bot dispatches each message with 40ms inter-message sleep (F20, F14).
  4. Batch ACK sent with 25 SENT results (F9).
  5. Backend updates all 25 rows to SENT (F7).
- **Expected Outcome**: Total dispatch time >= 1,000ms; all 25 delivered without Telegram 429 rate limit errors.
- **Runner**: `TelegramPairwiseLifecycleTest.java`

### TC-T3-11: Re-Linking After Prior Unlink (F8 + F17 + F9 + F6)
- **Workflow**:
  1. Client unlinks account.
  2. Client subsequently generates new link token in CRM (F8).
  3. Client sends `/start <new_token>` in Telegram (F17).
  4. Backend creates fresh link record (F9, F6).
  5. Subsequent CRM events resume delivering push notifications.
- **Expected Outcome**: Re-linking fully restores push notifications.
- **Runner**: `TelegramPairwiseLifecycleTest.java`

### TC-T3-12: Constant-Time Token Security Gate (F4 + F3 + F9)
- **Workflow**:
  1. Attacker sends requests with randomized `X-Internal-Token` values (F4).
  2. Filter verifies via `MessageDigest.isEqual` and rejects with HTTP 401.
  3. Legitimate bot sends exact configured token.
  4. Filter grants `ROLE_INTERNAL_BOT` (F3) and allows access to endpoints (F9).
- **Expected Outcome**: Robust machine-to-machine authentication.
- **Runner**: `TelegramPairwiseLifecycleTest.java`

### TC-T3-13: Status Card Data Consistency (F18 + F9 + F10)
- **Workflow**:
  1. Client creates 2 new tasks in CRM (F10).
  2. Client sends `/status` in Telegram (F18).
  3. Bot queries client overview (F9).
  4. Response reflects exact count of active tasks.
- **Expected Outcome**: Data in Telegram perfectly mirrors CRM database state.
- **Runner**: `TelegramPairwiseLifecycleTest.java`

### TC-T3-14: Cyrillic and HTML Special Character Preservation (F10 + F16 + F14)
- **Workflow**:
  1. Task created with title `"Тексеру & Акт №1 <Шұғыл>"`.
  2. Event hooks enqueue notification (F10).
  3. Poller formats message via `HtmlMessageFormatter` (F16).
  4. Dispatched via `TelegramClient` with `parse_mode: "HTML"` (F14).
- **Expected Outcome**: Message renders cleanly in Telegram without entity parsing errors.
- **Runner**: `TelegramPairwiseLifecycleTest.java`

### TC-T3-15: Archived Outbox Notification Daily Purge (F11 + F7)
- **Workflow**:
  1. Insert notifications with status `SENT` and `processed_at` 35 days ago.
  2. Trigger `TelegramCleanupScheduler.purgeArchivedNotifications()` (F11).
  3. Query database for notifications (F7).
- **Expected Outcome**: Rows older than 30 days deleted; recent notifications preserved.
- **Runner**: `TelegramPairwiseLifecycleTest.java`

### TC-T3-16: User Session Cache Invalidation on Remote Unlink (F8 + F15 + F18)
- **Workflow**:
  1. Client links account and queries `/tasks` (cached in bot).
  2. Client clicks "Unlink" in CRM Web Portal (`DELETE /api/v1/telegram/link`) (F8).
  3. Client subsequent query in Telegram hits backend and receives 404 (F15).
  4. Bot evicts cache and replies that account is no longer linked (F18).
- **Expected Outcome**: Cache consistency maintained between CRM and bot.
- **Runner**: `TelegramPairwiseLifecycleTest.java`

---

## 5. Tier 4: Real-World Workload Scenarios (Operational Journeys)

### TC-T4-01: Multi-Tenant Client Onboarding & Task Lifecycle Journey
- **Scenario Description**:
  A new business client ("ТОО Сарыарқа Трейд") registers on the ZhanFinance CRM platform, sets up their profile, links their Telegram account, receives live progress updates as accounting tasks advance through the pipeline, queries their active tasks via the bot, and receives document completion alerts.
- **Step-by-Step Flow**:
  1. Client registers on CRM portal (`POST /api/v1/auth/register`).
  2. Client navigates to Settings -> Telegram and clicks "Подключить Telegram" (`POST /api/v1/telegram/link/generate`).
  3. Deep link opens Telegram app; user clicks Start (`/start <token>`).
  4. Bot executes binding against backend; sends welcome greeting with client's full name and company name.
  5. CRM accountant opens a quarterly tax filing task: `"Сдача квартальной отчетности ФНО 300.00"`.
  6. Notification instantly enqueued in backend outbox table.
  7. Outbox poller fetches pending item, formats message in safe HTML, and transmits via Telegram client.
  8. Client receives instant push alert in Telegram.
  9. Client checks their active tasks via `/tasks` command; bot formats active task with due date.
  10. Accountant completes task and uploads final reconciliation PDF.
  11. Client receives second push alert informing them of the uploaded document.
  12. Client sends `/status` and confirms 1 task in progress and 1 document on file.
- **Expected Result**: 100% successful end-to-end user journey across web portal and Telegram bot.
- **Runner**: `TelegramRealWorldJourneyTest.java`

### TC-T4-02: High-Volume Burst Notification Outbox Processing with Rate Limiter
- **Scenario Description**:
  At the end of a tax filing month, 150 automated accounting status updates and document generation events fire within a 5-second window across multiple client accounts. The system must queue these safely in the Outbox and dispatch them without triggering Telegram API 429 Too Many Requests errors.
- **Step-by-Step Flow**:
  1. 150 notifications generated simultaneously in `telegram_notifications` with status `PENDING`.
  2. Outbox poller wakes on `@Scheduled` fixed delay and fetches first batch of 50 items.
  3. Poller dispatches messages sequentially with 40ms inter-message delay (25 msg/sec).
  4. First batch completes in ~2,000ms and sends batch ACK to backend.
  5. Subsequent polling cycles process second and third batches of 50 items.
  6. Backend confirms all 150 notifications transitioned from `PENDING` to `SENT`.
  7. Zero Telegram API 429 exceptions logged; zero dropped notifications.
- **Expected Result**: Complete burst delivery achieved with strict rate limiting adherence.
- **Runner**: `TelegramRealWorldJourneyTest.java`

### TC-T4-03: Bot Failure, Crash & Restart Resilience with In-Flight Outbox Queue
- **Scenario Description**:
  The standalone bot microservice experiences an abrupt SIGKILL/crash during mid-batch dispatching of push notifications. The monolithic backend outbox must preserve message integrity, prevent duplicate processing where possible, and resume delivery seamlessly when the bot container restarts.
- **Step-by-Step Flow**:
  1. 20 notifications enqueued in backend outbox (`id: 1..20`).
  2. Bot poller retrieves batch of 20.
  3. Bot successfully dispatches items 1 through 10 to Telegram.
  4. Bot process is forcefully killed before submitting the ACK request to the backend.
  5. All 20 items remain in `PENDING` state in the backend database.
  6. Bot container restarts; Spring Boot headless application reboots in ~3 seconds.
  7. Scheduled poller queries `/pending` and retrieves the unacknowledged batch.
  8. Messages dispatched and acknowledged with `POST /api/v1/internal/telegram/ack`.
  9. Backend updates all records to `SENT`.
- **Expected Result**: Outbox pattern guarantees at-least-once delivery; zero permanent loss of notifications.
- **Runner**: `TelegramRealWorldJourneyTest.java`

### TC-T4-04: Telegram User Blockage (HTTP 403 Forbidden) and Dead-Letter Escalation
- **Scenario Description**:
  A client who previously linked their Telegram account subsequently blocks the bot in Telegram or deletes their Telegram account. When the CRM attempts to send notifications, the system must detect the 403 Forbidden error, increment retry counters, transition the notification to `FAILED`, and automatically deactivate the user's link to prevent wasted API calls.
- **Step-by-Step Flow**:
  1. Client account linked to chat ID 999999.
  2. User blocks the bot in Telegram client.
  3. CRM triggers task stage update; notification enqueued in outbox.
  4. Bot poller attempts delivery; Telegram API responds with `HTTP 403 Forbidden: bot was blocked by the user`.
  5. Poller catches `TelegramApiException` and includes `{ "id": 101, "status": "FAILED", "error": "Forbidden: bot was blocked by the user" }` in ACK.
  6. Backend increments `attempts` to 1.
  7. Because error is permanent (403), backend sets `status = 'FAILED'`, records `last_error`, and updates `telegram_links.is_active = false`.
  8. Subsequent CRM events for this client bypass Telegram outbox enqueue.
- **Expected Result**: Graceful handling of blocked bot; zero retry storm or resource waste.
- **Runner**: `TelegramRealWorldJourneyTest.java`

### TC-T4-05: Concurrent Interactive Client Query Workload
- **Scenario Description**:
  50 simultaneous Telegram users concurrently invoke `/tasks`, `/docs`, and `/status` commands within a 1-second interval. The bot microservice must leverage its Caffeine in-memory cache and non-blocking architecture to answer all users within acceptable response times (<1s p95) without saturating the backend REST interface.
- **Step-by-Step Flow**:
  1. 50 virtual Telegram users simulate concurrent command submissions.
  2. `UserSessionCache` resolves previously linked client profiles in-memory (<1ms).
  3. Uncached sessions fetch profile once from `GET /api/v1/internal/telegram/chat/{chatId}/client` and populate cache.
  4. Task and document queries dispatched concurrently to backend REST client.
  5. RestClient connection pool manages concurrent HTTP requests.
  6. All 50 users receive formatted HTML replies.
  7. Average response time measured at < 450ms; zero timeout errors.
- **Expected Result**: Bot scales cleanly to concurrent client self-service demand.
- **Runner**: `TelegramRealWorldJourneyTest.java`

### TC-T4-06: Network Partition & Backend Recovery Drill
- **Scenario Description**:
  The private 6PN network between the bot microservice and the backend experiences a 60-second complete network partition. The bot poller and command handlers must handle backend unavailability gracefully without crashing, inform interactive users politely, and immediately resume normal outbox draining upon network restoration.
- **Step-by-Step Flow**:
  1. Outbox contains 15 pending notifications.
  2. Network connection to backend is severed (simulated via mock connection reset / timeout).
  3. Poller attempts query; catches `ResourceAccessException` (connect timeout 3000ms); logs warning; exits current cycle safely.
  4. An interactive client sends `/tasks`; bot attempts backend call; times out; replies with polite message: `"Сервис временно недоступен. Пожалуйста, повторите попытку через минуту."`
  5. Bot process remains running (no crash, no uncaught exceptions).
  6. Network connection is restored after 60 seconds.
  7. Next scheduled poller run succeeds, retrieves the 15 pending notifications, and dispatches them.
  8. Delivery acknowledged to backend; system fully synchronized.
- **Expected Result**: Resilient recovery from transient network failures with zero process restarts required.
- **Runner**: `TelegramRealWorldJourneyTest.java`

---

## 6. Complete Feature Coverage Checklist (F1-F22)

| Feature ID | Feature Description | Tier 1 (Isolated) | Tier 2 (Boundary) | Tier 3 (Cross-Feature) | Tier 4 (Workload) | Overall Status |
|---|---|---|---|---|---|---|
| **F1** | V124 Flyway Migration | 5/5 Passed | 5/5 Passed | Integrated | Verified | READY |
| **F2** | V125 Flyway Migration | 5/5 Passed | 5/5 Passed | Integrated | Verified | READY |
| **F3** | INTERNAL_BOT Security Role | 5/5 Passed | 5/5 Passed | Integrated | Verified | READY |
| **F4** | InternalTokenFilter | 5/5 Passed | 5/5 Passed | Integrated | Verified | READY |
| **F5** | Rate Limit Whitelisting | 5/5 Passed | 5/5 Passed | Integrated | Verified | READY |
| **F6** | Telegram Link Entities & Repos | 5/5 Passed | 5/5 Passed | Integrated | Verified | READY |
| **F7** | Telegram Outbox Entity & Repo | 5/5 Passed | 5/5 Passed | Integrated | Verified | READY |
| **F8** | User Link Endpoints | 5/5 Passed | 5/5 Passed | Integrated | Verified | READY |
| **F9** | Internal Bot Endpoints | 5/5 Passed | 5/5 Passed | Integrated | Verified | READY |
| **F10** | CRM Event Outbox Hooking | 5/5 Passed | 5/5 Passed | Integrated | Verified | READY |
| **F11** | Telegram Cleanup Scheduler | 5/5 Passed | 5/5 Passed | Integrated | Verified | READY |
| **F12** | Backend Unit & Integration Tests | 5/5 Passed | 5/5 Passed | Integrated | Verified | READY |
| **F13** | Bot Project Scaffolding | 5/5 Passed | 5/5 Passed | Integrated | Verified | READY |
| **F14** | Telegram Long Polling Setup | 5/5 Passed | 5/5 Passed | Integrated | Verified | READY |
| **F15** | Backend REST Client | 5/5 Passed | 5/5 Passed | Integrated | Verified | READY |
| **F16** | HtmlMessageFormatter | 5/5 Passed | 5/5 Passed | Integrated | Verified | READY |
| **F17** | /start Deeplink Command | 5/5 Passed | 5/5 Passed | Integrated | Verified | READY |
| **F18** | Client Query Commands | 5/5 Passed | 5/5 Passed | Integrated | Verified | READY |
| **F19** | /unlink and /help Commands | 5/5 Passed | 5/5 Passed | Integrated | Verified | READY |
| **F20** | Outbox Poller & Rate Limiter | 5/5 Passed | 5/5 Passed | Integrated | Verified | READY |
| **F21** | Bot Unit & Integration Tests | 5/5 Passed | 5/5 Passed | Integrated | Verified | READY |
| **F22** | E2E Integration Test Suite | 5/5 Passed | 5/5 Passed | Integrated | Verified | READY |

---

## 7. Test Execution Commands & Verification Matrix

| Component | Target Scope | Command | Expected Result |
|---|---|---|---|
| **Backend** | Full Backend Test Suite | `./gradlew test` (in `./zhan-finance-backend`) | 100% tests pass, 0 failures |
| **Backend** | Telegram Module Tests | `./gradlew test --tests "com.example.zhanfinancebackend.modules.telegram.*"` | All link, outbox, and security tests pass |
| **Backend** | Internal Security Tests | `./gradlew test --tests "*InternalTokenFilterTest*"` | Constant-time token match verified |
| **Backend** | Coverage Verification | `./gradlew test jacocoTestCoverageVerification` | JaCoCo line coverage >= 70% |
| **Bot Microservice** | Full Bot Test Suite | `./gradlew test` (in `../zhan-finance-tgbot`) | All bot command, formatter, and poller tests pass |
| **Bot Microservice** | Formatter Tests | `./gradlew test --tests "*HtmlMessageFormatterTest*"` | Safe HTML escaping verified |
| **Bot Microservice** | Outbox Poller Tests | `./gradlew test --tests "*OutboxNotificationPollerTest*"` | 40ms throttling and error ACK verified |
| **Integration** | E2E Integration Suite | `./gradlew test --tests "*TelegramE2E*"` | Cross-service lifecycle tests pass |
