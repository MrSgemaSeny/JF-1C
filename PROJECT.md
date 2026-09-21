# Project: ZhanFinance Telegram Bot Microservice and JF-1C Backend Integration

## Architecture
The ZhanFinance Telegram integration consists of two decoupled components communicating over an authenticated internal HTTP interface:

1. **JF-1C Monolithic Backend (`zhan-finance-backend`)**:
   - Spring Boot 3 / Java 17 modular monolith running with `server.servlet.context-path=/api`.
   - Flyway database migrations managing PostgreSQL tables:
     - `telegram_links`: Maps `app_users(id)` to Telegram `chat_id` and username.
     - `telegram_link_tokens`: 15-minute temporary one-time linking tokens.
     - `telegram_notifications`: Outbox queue for reliable push notification delivery.
   - Security:
     - `Role.INTERNAL_BOT` machine service role.
     - `InternalTokenFilter`: Pre-authentication filter for `/v1/internal/**` enforcing constant-time `MessageDigest.isEqual` comparison of `X-Internal-Token`.
     - `ApiRateLimitFilter`: Whitelists `/v1/internal/**` from Bucket4j throttling.
   - Endpoints:
     - User endpoints under `/api/v1/telegram/link/**` (generate, status, unlink).
     - Internal bot endpoints under `/api/v1/internal/**` (bind, chat client, tasks, docs, pending outbox, ack).
   - Event Hooking:
     - CRM lifecycle hooks in `NotificationService.createNotification(...)` / `TaskService` / `DocumentService` enqueuing outbox records transactionally.
   - Schedulers:
     - `TelegramCleanupScheduler`: Cleans expired link tokens and archived sent/failed outbox records.

2. **Standalone Telegram Bot Microservice (`zhan-finance-tgbot`)**:
   - Standalone Spring Boot 3.3.4 + Java 17 headless service (`spring.main.web-application-type=none`).
   - TelegramBots 7.2.1 Long Polling receiver (`SpringLongPollingBot` and `TelegramClient`).
   - Interactive command handlers:
     - `/start [token]`: Deeplink account binding.
     - `/tasks`: Active CRM tasks.
     - `/docs`: Recent client documents.
     - `/status`: Account and company overview.
     - `/unlink`: Unlink Telegram chat.
     - `/help`: Command summary.
   - `HtmlMessageFormatter`: Escapes `&`, `<`, `>` to prevent MarkdownV2 400 Bad Request parse errors.
   - `OutboxNotificationPoller`: `@Scheduled` poller fetching `/api/v1/internal/telegram/pending`, rate-limiting dispatch at 40ms/message (25 msg/s safe cap), and acknowledging batches with error status capture.

3. **Data Flow**:
   - Account Linking: User clicks Generate in CRM -> gets deeplink `https://t.me/bot?start=TOKEN` -> opens Telegram -> bot receives `/start TOKEN` -> calls `POST /api/v1/internal/telegram/bind` -> backend validates token and creates link -> bot sends confirmation message.
   - Notification Push: CRM event occurs -> `TelegramOutboxService.enqueue(...)` writes `PENDING` record in `telegram_notifications` -> Bot poller queries `GET /api/v1/internal/telegram/pending` -> Bot transmits message via `TelegramClient` -> Bot calls `POST /api/v1/internal/telegram/ack` with `SENT` or `FAILED`.
   - Client Self-Service: Client sends `/tasks` in Telegram -> Bot calls `GET /api/v1/internal/clients/{clientId}/tasks` -> Backend returns JSON -> Bot formats HTML -> Bot replies to chat.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | V124 Flyway Migration | DDL for telegram_links and telegram_link_tokens tables referencing app_users(id) | M1 | ORIGINAL_REQUEST §R1 |
| F2 | V125 Flyway Migration | DDL for telegram_notifications outbox table with status, attempts, max_attempts, last_error, indexes | M1 | ORIGINAL_REQUEST §R1 |
| F3 | INTERNAL_BOT Security Role | Add INTERNAL_BOT to Role.java for machine authorization | M1 | ORIGINAL_REQUEST §R1 |
| F4 | InternalTokenFilter | Constant-time token comparison via MessageDigest.isEqual for /v1/internal/** endpoints | M1 | ORIGINAL_REQUEST §R1 |
| F5 | Rate Limit Whitelisting | Whitelist /v1/internal/** and /api/v1/internal/** in ApiRateLimitFilter | M1 | survey_explorer_1 / 3 |
| F6 | Telegram Link Entities & Repos | TelegramLink, TelegramLinkToken JPA entities and Spring Data repositories | M1 | ORIGINAL_REQUEST §R1 |
| F7 | Telegram Outbox Entity & Repo | TelegramNotification JPA entity and query repository for pending queue and cleanup | M1 | ORIGINAL_REQUEST §R1 |
| F8 | User Link Endpoints | POST /generate, GET /status, DELETE /link under /api/v1/telegram/link | M1 | ORIGINAL_REQUEST §R1 |
| F9 | Internal Bot Endpoints | POST /bind, GET /chat/{chatId}/client, GET /clients/{clientId}/tasks, GET /clients/{clientId}/documents, GET /pending, POST /ack | M1 | ORIGINAL_REQUEST §R1 |
| F10 | CRM Event Outbox Hooking | Transactional enqueue of Telegram notifications on task stage changes and document uploads | M1 | ORIGINAL_REQUEST §R1 |
| F11 | Telegram Cleanup Scheduler | Periodic purge of expired link tokens (15m) and archived outbox notifications | M1 | ORIGINAL_REQUEST §R1 |
| F12 | Backend Unit & Integration Tests | Comprehensive MockMvc, filter, service, and scheduler tests in JF-1C backend | M1 | ORIGINAL_REQUEST §R3 |
| F13 | Bot Project Scaffolding | Gradle build, settings, wrapper, and application.yml configuration with headless mode | M2 | ORIGINAL_REQUEST §R2 |
| F14 | Telegram Long Polling Setup | SpringLongPollingBot and TelegramClient configuration using TelegramBots 7.2.1 | M2 | ORIGINAL_REQUEST §R2 |
| F15 | Backend REST Client | Configured RestClient with X-Internal-Token header, timeouts, and error handling | M2 | ORIGINAL_REQUEST §R2 |
| F16 | HtmlMessageFormatter | Safe HTML message builder escaping &, <, > | M2 | ORIGINAL_REQUEST §R2 |
| F17 | /start Deeplink Command | Handles /start [token], calls backend bind API, confirms account linking | M2 | ORIGINAL_REQUEST §R2 |
| F18 | Client Query Commands | /tasks, /docs, /status fetching client data and formatting HTML responses | M2 | ORIGINAL_REQUEST §R2 |
| F19 | /unlink and /help Commands | Handles /unlink and /help commands | M2 | ORIGINAL_REQUEST §R2 |
| F20 | Outbox Poller & Rate Limiter | @Scheduled polling of /pending, 40ms inter-message sleep, error capture, and batch ACK | M2 | ORIGINAL_REQUEST §R2 |
| F21 | Bot Unit & Integration Tests | Comprehensive tests for command routing, HTML formatter, poller, and REST client | M2 | ORIGINAL_REQUEST §R2 |
| F22 | E2E Integration Test Suite | Opaque-box test harness validating end-to-end linking, push notifications, commands, and security gates | M3 | ORIGINAL_REQUEST §R3 |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Backend Outbox & Linking Foundation | Features F1-F12: Flyway V124/V125, Security filter & role, JPA models, services, schedulers, user & internal controllers, CRM event hooks, backend test suite (281 tests passing) | none | DONE |
| M2 | Standalone Telegram Bot Microservice | Features F13-F21: Bot Gradle project, Long Polling receiver, REST client, HtmlMessageFormatter, command handlers (/start, /tasks, /docs, /status, /unlink, /help), outbox poller, bot test suite (89 tests passing) | M1 | DONE |
| M3 | End-to-End Integration & Quality Verification | Feature F22: Dual-track E2E verification, 100% test pass on both backend (281 tests) and bot (89 tests), adversarial coverage check, final handoff | M1, M2 | DONE |

---

## Interface Contracts

### 1. User Endpoints (`JF-1C` Backend)
Base URL: `/api/v1/telegram/link`
Auth: Standard User JWT Bearer Token

- `POST /api/v1/telegram/link/generate`
  - Response:
    ```json
    {
      "token": "32-char-uuid-string",
      "deepLink": "https://t.me/zhan_finance_bot?start=32-char-uuid-string",
      "expiresAt": "2026-09-21T10:30:00Z"
    }
    ```
- `GET /api/v1/telegram/link/status`
  - Response:
    ```json
    {
      "linked": true,
      "chatId": 123456789,
      "telegramUsername": "client_tg",
      "linkedAt": "2026-09-21T09:00:00Z"
    }
    ```
- `DELETE /api/v1/telegram/link`
  - Response:
    ```json
    {
      "success": true
    }
    ```

### 2. Internal Bot Endpoints (`JF-1C` Backend)
Base URL: `/api/v1/internal`
Auth: Header `X-Internal-Token: <INTERNAL_BOT_TOKEN>` (Constant-time validation, grants `ROLE_INTERNAL_BOT`)

- `POST /api/v1/internal/telegram/bind`
  - Request:
    ```json
    {
      "token": "32-char-uuid-string",
      "chatId": 123456789,
      "telegramUsername": "client_tg",
      "firstName": "Murat"
    }
    ```
  - Response (200 OK):
    ```json
    {
      "success": true,
      "userId": 42,
      "fullName": "Murat Orynbasar"
    }
    ```
  - Response (400 Bad Request):
    ```json
    {
      "status": 400,
      "error": "BAD_REQUEST",
      "message": "Token is invalid or expired"
    }
    ```

- `GET /api/v1/internal/telegram/chat/{chatId}/client`
  - Response (200 OK):
    ```json
    {
      "userId": 42,
      "fullName": "Murat Orynbasar",
      "email": "client@example.com",
      "companyName": "ТОО Береке",
      "phone": "+77011234567",
      "role": "CLIENT"
    }
    ```
  - Response (404 Not Found): If chat ID is not linked.

- `GET /api/v1/internal/clients/{clientId}/tasks`
  - Response (200 OK):
    ```json
    [
      {
        "id": 101,
        "title": "Сдача налоговой отчетности (ФНО 300.00)",
        "stageName": "В работе",
        "stageType": "IN_PROGRESS",
        "dueDate": "2026-09-30"
      }
    ]
    ```

- `GET /api/v1/internal/clients/{clientId}/documents`
  - Response (200 OK):
    ```json
    [
      {
        "id": 201,
        "fileName": "Акт_сверки_сентябрь_2026.pdf",
        "status": "UPLOADED",
        "createdAt": "2026-09-20T14:30:00Z"
      }
    ]
    ```

- `DELETE /api/v1/internal/telegram/chat/{chatId}`
  - Response (200 OK):
    ```json
    {
      "success": true
    }
    ```

- `GET /api/v1/internal/telegram/pending?limit=50`
  - Response (200 OK):
    ```json
    [
      {
        "id": 1001,
        "chatId": 123456789,
        "message": "<b>Обновление по задаче:</b> Сдача налоговой отчетности\n<b>Новый статус:</b> В работе",
        "attempts": 0,
        "createdAt": "2026-09-21T10:00:00Z"
      }
    ]
    ```

- `POST /api/v1/internal/telegram/ack`
  - Request:
    ```json
    {
      "processed": [
        { "id": 1001, "status": "SENT" },
        { "id": 1002, "status": "FAILED", "error": "Forbidden: bot was blocked by the user" }
      ]
    }
    ```
  - Response (200 OK):
    ```json
    {
      "acknowledgedCount": 2
    }
    ```

---

## Code Layout

### JF-1C Backend (`c:\Users\murat\IdeaProjects\JF-1C\zhan-finance-backend`)
```
src/main/resources/db/migration/
  V124__Telegram_Link_Schema.sql
  V125__Telegram_Outbox.sql

src/main/java/com/example/zhanfinancebackend/
  modules/auth/entity/
    Role.java (append INTERNAL_BOT)
  modules/auth/security/
    InternalTokenFilter.java
    ApiRateLimitFilter.java (whitelist /v1/internal/**)
  common/config/
    SecurityConfig.java (permit /v1/internal/** to ROLE_INTERNAL_BOT)
  modules/telegram/
    entity/
      TelegramLink.java
      TelegramLinkToken.java
      TelegramNotification.java
    repository/
      TelegramLinkRepository.java
      TelegramLinkTokenRepository.java
      TelegramNotificationRepository.java
    dto/
      TelegramLinkTokenResponse.java
      TelegramLinkStatusResponse.java
      TelegramBindRequest.java
      TelegramBindResponse.java
      TelegramClientSummaryDto.java
      TelegramClientTaskDto.java
      TelegramClientDocumentDto.java
      TelegramNotificationDto.java
      TelegramAckRequest.java
      TelegramAckResponse.java
    service/
      TelegramLinkService.java
      TelegramOutboxService.java
    scheduler/
      TelegramCleanupScheduler.java
    controller/
      TelegramLinkController.java
      InternalTelegramController.java

src/test/java/com/example/zhanfinancebackend/modules/telegram/
  InternalTokenFilterTest.java
  TelegramLinkServiceTest.java
  TelegramOutboxServiceTest.java
  TelegramLinkControllerIntegrationTest.java
  InternalTelegramControllerIntegrationTest.java
  TelegramCleanupSchedulerTest.java
```

### ZhanFinance Telegram Bot (`c:\Users\murat\IdeaProjects\zhan-finance-tgbot`)
```
build.gradle
settings.gradle
gradlew
gradlew.bat
gradle/wrapper/gradle-wrapper.properties
src/main/resources/
  application.yml

src/main/java/com/example/zhanfinancetgbot/
  ZhanFinanceTgBotApplication.java
  config/
    TelegramBotConfig.java
    BackendClientConfig.java
  client/
    BackendClient.java
    dto/
      BindRequest.java
      BindResponse.java
      ClientSummary.java
      ClientTask.java
      ClientDocument.java
      PendingNotification.java
      AckRequest.java
      AckResponse.java
  bot/
    ZhanFinanceLongPollingBot.java
    TelegramMessageSender.java
  formatter/
    HtmlMessageFormatter.java
  handler/
    CommandHandler.java
    StartCommandHandler.java
    TasksCommandHandler.java
    DocsCommandHandler.java
    StatusCommandHandler.java
    UnlinkCommandHandler.java
    HelpCommandHandler.java
  poller/
    OutboxNotificationPoller.java

src/test/java/com/example/zhanfinancetgbot/
  formatter/HtmlMessageFormatterTest.java
  handler/CommandHandlerTest.java
  poller/OutboxNotificationPollerTest.java
  client/BackendClientTest.java
```
