# Project State & Context -- ZhanFinance (JF-1C)

## Current Phase & Global Goals
- **Active Phase**: Production Quality & Full Test Coverage (Phase 2 & Phase 3 준비)
- **Main Goal**: Transition to Billing & Payments (WebKassa / Kaspi Pay), custom domain (zhanfinance.kz), and Epic-21 (1C Data Gateway).
- **Audit status**: 28 findings total (6 CRITICAL, 9 WARNING, 5 INFO) — 100% resolved and verified.
- **Global Rule**: ALL architectural decisions and context updates must be synchronized with `Brain's Protocol` at `C:\Users\murat\IdeaProjects\new_world\Brain's protocol - second brain`.

## Infrastructure & Test State
- **Backend (Spring Boot 3 / Java 17)**: 100% test pass rate (`./gradlew test`) across all modules (Auth, Admin, CRM, Billing, LMS, Documents, Chat, Notifications, Search, WebSocket ACL). JaCoCo configured for coverage tracking.
- **Frontend (React 19 / Vite / Tailwind v4)**: 100% Vitest test pass rate (19 test files, 169 tests), strict TypeScript verification (`tsc --noEmit`), and clean ESLint 9 flat config (`eslint.config.js`, 0 errors, 0 warnings).
- **CI/CD (.github/workflows/ci.yml)**: Continuous quality gate enforcing backend test execution, frontend linting, typechecking, Vitest execution, and GitHub Pages deployment.
- **Storage (Cloudflare R2)**: Provisioned bucket `jf1c-documents` for Epic-15/Epic-21 ($0 egress).
- **Auth & Security**: JWT Bearer, refresh token rotation, TOTP 2FA, Bucket4j rate limiting, row-level CRM access controls.
- **Roles (6)**: ADMIN, EMPLOYEE, CLIENT, LEARNER, CURATOR, ADVISOR.

## Key Completed Features & Milestones
1. **Full Automated Test Coverage Across Backend, Frontend & CI/CD**:
   - Comprehensive MockMvc, JUnit 5, Mockito, and Spring Security ACL test coverage for all controllers and domain services.
   - 169 unit and integration tests across frontend entities, widgets, features, contexts, and pages.
   - ESLint 9 flat config with zero warnings and strict TypeScript mode enabled.
   - Dual-track E2E test inventory (`TEST_READY.md`, 202 test specs across 4 tiers) and test infrastructure (`TEST_INFRA.md`).

2. **Branding, Landing & Team Redesign (ЖАН FINANCE)**:
   - Текстовый брендинг «ЖАН FINANCE» на шрифте `a_Simpler`, сквозная замена во всех компонентах и 4 языках.
   - Квадратный векторный SVG и высококачественный растровый PNG (512x512) ассет логотипа (`zhan-finance-logo-new.svg`, `logo.png`, `logo.svg`), вариант `variant="square"` в `BrandLogo` и отображение в свёрнутом сайдбаре.
   - Команда: 1 руководитель + 8 проверенных специалистов, переключатель «Сетка» / «Карусель» и модальное окно деталей.
   - Услуги (Разовые / Аутсорс с SLA), 4 тарифа, FAQ, WhatsApp QR-флоу, выбор роли на странице авторизации.

2. **100% 4-Language i18n & Dictionary Parity (`ru`, `kk`, `en`, `zh`)**:
   - Complete key parity across all 4 locales in `src/shared/i18n/locales/` (96/96 automated parity tests).
   - 100% localized coverage across all authenticated portals, internal dashboards, admin tools, CRM boards, templates, and modals.
   - Zero hardcoded UI strings, strict absence of Cyrillic characters in Chinese locale.
   - Centralized date and currency formatting utilities (`dateFormat.ts`).

3. **1C Client Hub & Report Stubs (`/client/1c`) [ТЕСТОВЫЙ / FRONTEND-ONLY]**:
   - Раздел `/client/1c` и вложенные маршруты (`/osv`, `/saldo`, `/reconciliation`, `/account-card`, `/cash-book`, `/stock`) — исключительно тестовый фронтенд-интерфейс без данных.
   - Бекенд-интеграции и реальных финансовых данных на текущий момент нет.
   - Моковые/фейковые финансовые данные строго запрещены: отображается чистый Empty State в ожидании OData-шлюза.
   - Полноценный запуск двусторонней синхронизации запланирован в Фазе 3 в рамках Epic-21 (1C Data Gateway).

4. **Epic-21 Roadmap (1C Data Gateway & Fiscal Hub)**:
   - Полная архитектурная спецификация и дорожная карта интеграции в `Epics/Plan/Epic-21-1c-data-gateway/epic.md`.

5. **ZhanFinance Telegram Bot & Outbox Integration (Microservice + Backend) [DONE]**:
   - Flyway миграции V124 (`telegram_links`, `telegram_link_tokens`) и V125 (`telegram_notifications`) со связями к `app_users(id)`.
   - Машинная авторизация `Role.INTERNAL_BOT` и фильтр постоянного времени `InternalTokenFilter` (`MessageDigest.isEqual`) для `/v1/internal/**`.
   - Пользовательские эндпоинты `/api/v1/telegram/link/**` и внутренние эндпоинты бота `/api/v1/internal/**` с вайтлистом в `ApiRateLimitFilter` и `CsrfHeaderFilter`.
   - Изолированная очередь Outbox с `Propagation.REQUIRES_NEW`, автоматически привязанная к `NotificationService.createNotification(...)` на изменения задач и загрузку документов.
   - Микросервис `zhan-finance-tgbot` (Java 17, Spring Boot 3.3.4, TelegramBots 7.2.1, headless `web-application-type=none`).
   - Безопасное экранирование HTML (`HtmlMessageFormatter`), обработчики команд `/start`, `/tasks`, `/docs`, `/status`, `/unlink`, `/help`, и поллер Outbox с 40ms rate-limiting (25 сообщ/сек) и пакетным подтверждением.
   - 100% покрытие тестами: 281 бекенд-тест, 89 тестов микросервиса бота (всего 370 тестов, 0 ошибок, 0 пропусков, 0 эмодзи).

## NEXT: Hardening Plan (отложен, будет реализован в следующей сессии)

Полный план зафиксирован в `docs/future/future_plan.md`.
Основание: ChatGPT audit части 1 и 2 (`docs/reports/full_audit_chatgpt_1.md`, `full_audit_chatgpt_2.md`).
Цель: стабилизировать и доказать корректность существующего modular monolith. НЕ переписывать архитектуру.

### P0 — Критические (12 задач — 100% ЗАВЕРШЕНО)
| ID | Задача | Статус |
|---|---|---|
| P0-1 | Refresh-token lifecycle audit (reuse detection, token family, session revocation) [V122] | DONE |
| P0-2 | PAID invoice immutability — запретить PUT/PATCH/DELETE на PAID/CANCELED | DONE |
| P0-3 | Invoice state machine — явные allowed transitions | DONE |
| P0-4 | Enum → HTTP 400 (перехват HttpMessageNotReadableException в GlobalExceptionHandler) | DONE |
| P0-5 | PostgreSQL 17 в docker-compose (postgres:17-alpine, удален неиспользуемый redis) | DONE |
| P0-6 | Flyway discipline — CI-шаг: validate checksums и сортировка миграций перед тестами | DONE |
| P0-7 | Backup restore drill — runbook (`docs/RUNBOOK.md`) + CI workflow (`restore-drill.yml`) | DONE |
| P0-8 | SECURITY.md — vulnerability reporting process, SLA и контакты безопасности | DONE |
| P0-9 | Default secrets fail-fast — проверка JWT_SECRET на длину >= 32 байт и запрет change-me в prod | DONE |
| P0-10 | CURRENT_STATE.md — актуальный стек, архитектура, инварианты и роли | DONE |
| P0-11 | Coverage gate в CI — JaCoCo: `jacocoTestCoverageVerification` привязана к `check` | DONE |
| P0-12 | WebSocket ACL — senderId строго из Principal в `ChatController`, строгая проверка подписок в `WebSocketConfig` | DONE |
| HOTFIX | Role Sanitization — санитизация requestedRole в GoogleAuthService и AuthService (запрет эскалации до ADMIN) | DONE |

### P1 — Архитектурный долг (15 задач)
- **P1-01 (Optimistic Locking)**: `@Version` в `BaseEntity`, Flyway миграция `V126__Add_Optimistic_Lock_Version.sql` для 26 таблиц, перехват `OptimisticLockException` в `GlobalExceptionHandler` с HTTP 409 [DONE]
- **P1-02 (Atomic Task Pickup)**: Атомарный native SQL `claimTask` в `TaskRepository`, `TaskService.claimTaskFromPool`, эндпоинт `POST /api/v1/crm/tasks/{id}/claim`, интеграционные тесты `TaskConcurrencyIntegrationTest` [DONE]
- Остальные задачи P1 (Outbox pattern, Cloudflare R2 интеграция, Idempotency для webhooks, ArchUnit, ShedLock, Distributed rate limiting, 2FA mandatory для ADMIN, Task state machine) — в процессе/запланированы.

### P2 — Долгосрочный roadmap (20 задач, ~150+ч)
Staging, Cursor pagination, Audit partitioning, SBOM, Dependabot, Trivy, ADR, Semver, Document versioning, Soft delete, PII inventory, Log sanitization, Backward-compatible migrations, Preview envs, DR plan, Invoice line model, File upload hardening, PDF limits, CORS audit, Observability stack.
