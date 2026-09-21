# ZhanFinance Telegram Bot Microservice & JF-1C Backend Test Infrastructure Specification

## 1. Architecture Overview & Dual Track Strategy

The verification strategy for the ZhanFinance Telegram Bot Microservice (`zhan-finance-tgbot`) and the JF-1C Monolithic Backend (`zhan-finance-backend`) follows a Dual Track Quality Architecture:

1. **Implementation Track**: Fast, isolated unit and slice tests executing within each service boundary:
   - Backend: Spring Boot 4.1.0/3.4 MockMvc slice tests, Mockito component mocks, JPA repository tests on in-memory H2 (PostgreSQL dialect mode), and JaCoCo coverage metrics.
   - Telegram Bot: Headless Spring Boot 3.3.4 unit tests, MockRestServiceServer REST client tests, and mock `TelegramClient` execution verifications.
2. **E2E Testing Track**: Opaque-box, requirement-driven integration and live lifecycle suites validating cross-service HTTP communication, security boundaries, asynchronous Outbox transactional guarantees, rate-limiting constraints, and real-world failure recovery.

```
+---------------------------------------------------------------------------------------------------+
|                                  DUAL TRACK QUALITY MATRIX                                        |
+-------------------------------------------------+-------------------------------------------------+
| Implementation Track (Isolated Component Level) | E2E Testing Track (Cross-Service & Opaque-Box)   |
+-------------------------------------------------+-------------------------------------------------+
| Backend: Spring MockMvc + JUnit 5 + Mockito     | Live Cross-Service Contract Harness (HTTP/JSON) |
| Backend Coverage Gate: JaCoCo >= 70% on modules | Outbox Lifecycle: Enqueue -> Poll -> ACK -> State|
| Bot Microservice: SpringBootTest (headless)     | Security Gate: X-Internal-Token constant-time   |
| Bot Mocks: MockRestServiceServer & TelegramClient| Throttling Gate: 40ms sleep & RateLimit whitelist|
| Static Verification: Java 17 strict compiler    | Error Recovery: 403 Forbidden, 429, Network Drop|
+-------------------------------------------------+-------------------------------------------------+
```

---

## 2. Test Execution Environments

The testing infrastructure defines three deterministic execution environments:

### 2.1 Local In-Memory Fast Suite (Fast Iteration & Local Development)
- **Backend Setup**:
  - Database: In-memory H2 database with PostgreSQL compatibility (`jdbc:h2:mem:zhan_finance_test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH`).
  - Flyway: Disabled in local slice tests (`spring.flyway.enabled=false`), JPA Hibernate `ddl-auto=update` for rapid schema synthesis.
  - Runtime: Sub-90 second execution across the entire test suite.
- **Bot Microservice Setup**:
  - Headless profile: `spring.main.web-application-type=none`.
  - Mocked Telegram Client: In-memory mock capturing outgoing `SendMessage` calls without connecting to Telegram servers.
  - Mocked REST Server: `MockRestServiceServer` validating request payloads and `X-Internal-Token` headers.
- **Scope**: Tier 1 and Tier 2 isolated feature and boundary cases.

### 2.2 CI Service Container Environment (Pre-Merge Quality Gate)
- **Database**: Real PostgreSQL 17 container in GitHub Actions (`postgres:17-alpine`).
- **Flyway Verification**: `spring.flyway.enabled=true`, validating migration chain strictly through `V124__Telegram_Link_Schema.sql` and `V125__Telegram_Outbox.sql`.
- **Quality Gate Enforcements**:
  - Compile-time check on Java 17 for both projects.
  - JaCoCo line and instruction coverage gate (`jacocoTestCoverageVerification`) bound to `check`.
  - Checksum validation for all historical Flyway migrations.
- **Scope**: Migration integrity, full Spring Security filter chain execution, and end-to-end repository queries.

### 2.3 Staging / Live Dual-Process Mesh Environment (Full E2E Verification)
- **Networking**: Fly.io 6PN private IPv6 internal mesh.
- **Backend Host**: `http://zhanfinance.internal:8080/api` (Context-path `/api`).
- **Bot Host**: Headless standalone daemon running within the same 6PN network.
- **Isolation**: Zero public internet ingress to `/api/v1/internal/**`. All traffic restricted to internal token authentication.
- **Scope**: Tier 3 pairwise integration, Tier 4 real-world operational workflows, burst outbox delivery, and failover drills.

---

## 3. The 4-Tier Test Methodology

Every feature from the Feature Inventory (F1 to F22) is verified through four structured test tiers:

### Tier 1: Feature Coverage (Isolation & Happy Path, >=5 Tests Per Feature)
- **Objective**: Validate the primary functional contract for each feature in isolation.
- **Requirement**: At least 5 distinct positive test cases per feature (110 test specifications total across F1 to F22).
- **Scope**:
  - Entity field persistence, table constraints, and foreign key integrity.
  - Filter authentication and security context establishment.
  - REST endpoint request/response JSON schema matching.
  - Bot command parsing and appropriate reply dispatch.
  - Scheduled worker polling and cleanup invocations.

### Tier 2: Boundary, Corner & Adversarial Cases (>=5 Tests Per Feature)
- **Objective**: Stress-test edge conditions, negative inputs, security barriers, and resource limits.
- **Requirement**: At least 5 distinct negative/adversarial test cases per feature (110 test specifications total across F1 to F22).
- **Scope**:
  - Timing attack resilience via constant-time token comparison.
  - Expired tokens (TTL > 15 minutes), malformed UUIDs, and replay attempts.
  - Unlinked chat queries, empty data responses, and non-client roles.
  - Dangerous HTML payload characters (`&`, `<`, `>`, combined scripts) escaping.
  - Rate limiting boundaries (40ms inter-message spacing, whitelisting verification).
  - Outbox max retry limits (`max_attempts = 3`), dead-letter transitions, and user blocking (403 Forbidden).

### Tier 3: Pairwise Combinations (Cross-Feature & Inter-Module Interaction)
- **Objective**: Validate cross-system data flows spanning the monolithic backend, CRM state changes, database outbox, internal REST interfaces, and bot dispatching.
- **Requirement**: Comprehensive integration scenarios combining at least two distinct features.
- **Scope**:
  - Account Linking Flow: Generate Token (F8) -> Bot /start Token (F17) -> REST Client (F15) -> Internal Bind (F9) -> Link Entity (F6) -> Status Verification (F8).
  - Task Status Notification Flow: Task Stage Transition in CRM (F10) -> Outbox Enqueue (F7) -> Poller Fetch (F20) -> Safe HTML Format (F16) -> Telegram Client Dispatch (F14) -> Batch ACK (F9) -> Status Update (F7).
  - Document Upload Flow: Document Upload (F10) -> Outbox Enqueue (F7) -> Bot Notification Dispatch (F20) -> ACK Processing (F9).
  - Unlink Flow: Client /unlink (F19) -> Bot Internal DELETE (F9) -> Database Deactivation (F6) -> Subsequent CRM Event Outbox Suppression (F10).
  - Rate Limit Whitelisting: Internal Bot Poller High Frequency (F20) -> ApiRateLimitFilter (F5) -> Zero HTTP 429 Throttle.

### Tier 4: Real-World Workload Scenarios (Operational Multi-Persona Journeys)
- **Objective**: Validate end-to-end business operations under realistic production conditions.
- **Requirement**: Full lifecycle scenarios simulating real-world workloads, concurrent clients, and environmental disruptions.
- **Scope**:
  - Multi-Tenant Client Onboarding & Task Lifecycle Journey.
  - High-Volume Burst Notification Outbox Processing with 40ms Rate Limiter.
  - Bot Failure, Crash & Restart Resilience with In-Flight Outbox Queue.
  - Telegram User Blockage (HTTP 403 Forbidden) and Dead-Letter Escalation.
  - Concurrent Interactive Client Query Workload (/tasks, /docs, /status).
  - Network Partition & Backend Recovery Drill during Scheduled Polling.

---

## 4. Feature Inventory Mapping

| Feature ID | Feature Name | Component | Scope & Interface |
|---|---|---|---|
| F1 | V124 Flyway Migration | Backend | `V124__Telegram_Link_Schema.sql`: `telegram_links`, `telegram_link_tokens` |
| F2 | V125 Flyway Migration | Backend | `V125__Telegram_Outbox.sql`: `telegram_notifications`, partial & composite indexes |
| F3 | INTERNAL_BOT Security Role | Backend | `Role.java`: Enum value `INTERNAL_BOT`, registration sanitization checks |
| F4 | InternalTokenFilter | Backend | `InternalTokenFilter.java`: Constant-time token verification on `/v1/internal/**` |
| F5 | Rate Limit Whitelisting | Backend | `ApiRateLimitFilter.java`: Exemption for `/v1/internal/**` and `/api/v1/internal/**` |
| F6 | Telegram Link Entities & Repos | Backend | `TelegramLink`, `TelegramLinkToken` JPA models and Spring Data repositories |
| F7 | Telegram Outbox Entity & Repo | Backend | `TelegramNotification` entity, pending query, cleanup methods |
| F8 | User Link Endpoints | Backend | `TelegramLinkController`: POST `/generate`, GET `/status`, DELETE `/link` |
| F9 | Internal Bot Endpoints | Backend | `InternalTelegramController`: POST `/bind`, GET `/chat/{id}/client`, GET `/tasks`, GET `/docs`, GET `/pending`, POST `/ack` |
| F10 | CRM Event Outbox Hooking | Backend | `NotificationService` / `TaskService` / `DocumentService` transactional enqueue |
| F11 | Telegram Cleanup Scheduler | Backend | `TelegramCleanupScheduler`: Expired link tokens (15m) & archived notifications |
| F12 | Backend Unit & Integration Tests | Backend | Comprehensive JUnit 5, MockMvc, and Spring test suites |
| F13 | Bot Project Scaffolding | Bot | Headless Spring Boot 3.3.4, Gradle build, YAML configuration |
| F14 | Telegram Long Polling Setup | Bot | `SpringLongPollingBot`, `TelegramClient`, `LongPollingSingleThreadUpdateConsumer` |
| F15 | Backend REST Client | Bot | `RestClient` with `X-Internal-Token`, timeouts, and DTO mappings |
| F16 | HtmlMessageFormatter | Bot | Safe HTML escaping for `&`, `<`, `>`, and financial notification builders |
| F17 | /start Deeplink Command | Bot | `StartCommandHandler`: Deeplink parsing, token validation, backend binding |
| F18 | Client Query Commands | Bot | `TasksCommandHandler`, `DocsCommandHandler`, `StatusCommandHandler` |
| F19 | /unlink and /help Commands | Bot | `UnlinkCommandHandler`, `HelpCommandHandler` with WhatsApp SLA contact |
| F20 | Outbox Poller & Rate Limiter | Bot | `@Scheduled` poller, 40ms inter-message throttling, batch ACK dispatch |
| F21 | Bot Unit & Integration Tests | Bot | Bot command, formatter, REST client, and poller unit tests |
| F22 | E2E Integration Test Suite | Cross-Service | Opaque-box cross-service test harness across all workflows |

---

## 5. Concrete Verification Runners & Commands

### 5.1 JF-1C Backend Verification Commands
Working Directory: `c:\Users\murat\IdeaProjects\JF-1C\zhan-finance-backend`

1. **Execute Complete Backend Test Suite**:
   ```powershell
   ./gradlew test
   ```
2. **Execute Telegram Backend Module Tests Only**:
   ```powershell
   ./gradlew test --tests "com.example.zhanfinancebackend.modules.telegram.*"
   ```
3. **Execute Internal Security Filter Suite**:
   ```powershell
   ./gradlew test --tests "com.example.zhanfinancebackend.modules.telegram.InternalTokenFilterTest"
   ```
4. **Execute Flyway Migration & Schema Tests**:
   ```powershell
   ./gradlew test --tests "com.example.zhanfinancebackend.modules.telegram.TelegramMigrationTest"
   ```
5. **Run JaCoCo Coverage Verification Gate**:
   ```powershell
   ./gradlew test jacocoTestCoverageVerification
   ```
6. **Generate HTML JaCoCo Report**:
   ```powershell
   ./gradlew test jacocoTestReport
   # View at: build/reports/jacoco/test/html/index.html
   ```

### 5.2 ZhanFinance Telegram Bot Microservice Verification Commands
Working Directory: `c:\Users\murat\IdeaProjects\zhan-finance-tgbot`

1. **Compile and Verify Build Configuration**:
   ```powershell
   ./gradlew check
   ```
2. **Execute Full Bot Test Suite**:
   ```powershell
   ./gradlew test
   ```
3. **Execute HTML Formatter & Escaping Tests**:
   ```powershell
   ./gradlew test --tests "kz.zhanfinance.bot.formatter.HtmlMessageFormatterTest"
   ```
4. **Execute Command Handler Dispatcher Tests**:
   ```powershell
   ./gradlew test --tests "kz.zhanfinance.bot.handler.*"
   ```
5. **Execute Outbox Poller & Throttling Tests**:
   ```powershell
   ./gradlew test --tests "kz.zhanfinance.bot.poller.OutboxNotificationPollerTest"
   ```
6. **Execute REST Client Contract Tests**:
   ```powershell
   ./gradlew test --tests "kz.zhanfinance.bot.client.JfInternalApiClientTest"
   ```

### 5.3 Cross-Service E2E Integration Runner
Working Directory: `c:\Users\murat\IdeaProjects\JF-1C`

1. **Run Full Opaque-Box E2E Test Suite**:
   ```powershell
   ./gradlew :zhan-finance-backend:test --tests "com.example.zhanfinancebackend.modules.telegram.e2e.*"
   ```
2. **Execute Cross-Service Integration Verification Script**:
   ```powershell
   # Start backend with test profile and run integration runner
   ./gradlew test --tests "*TelegramE2EIntegrationTest*"
   ```

---

## 6. Quality Gates & Thresholds

To guarantee release readiness and zero regression, the following strict criteria are enforced:

1. **Compilation Gate**:
   - Zero compilation errors or warnings on Java 17 for both `zhan-finance-backend` and `zhan-finance-tgbot`.
2. **Pass Rate Gate**:
   - 100% test pass rate across all test suites (0 failures, 0 errors, 0 flaky tests).
3. **Coverage Gates**:
   - JaCoCo Instruction Coverage: >= 70.00% on package `com.example.zhanfinancebackend.modules.telegram.*`.
   - Bot microservice line coverage: >= 75.00% on packages `kz.zhanfinance.bot.formatter`, `kz.zhanfinance.bot.handler`, `kz.zhanfinance.bot.poller`.
4. **Security & Boundary Gates**:
   - Timing Attack Resilience: Constant-time comparison verified via byte array mismatch variance tests.
   - Unauthorized Access: 100% rejection (HTTP 401/403) on `/api/v1/internal/**` without valid `X-Internal-Token`.
   - Rate Limit Exemption: Internal bot endpoints confirmed to never receive HTTP 429 under high polling frequencies.
5. **Formatting & Data Safety Gates**:
   - 100% of special characters (`&`, `<`, `>`) in client-provided titles escaped prior to Telegram transmission.
   - Zero MarkdownV2 parsing breaks.
6. **No Emojis Rule**:
   - Strict absence of emojis in all test files, code, logs, and documentation per project guidelines.
