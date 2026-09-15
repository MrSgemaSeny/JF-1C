# Project State & Context -- ZhanFinance (JF-1C)

## Current Phase & Global Goals
- **Active Phase**: Production Quality & Full Test Coverage (Phase 2 & Phase 3 준비)
- **Main Goal**: Transition to Billing & Payments (WebKassa / Kaspi Pay), custom domain (zhanfinance.kz), and Epic-21 (1C Data Gateway).
- **Audit status**: 28 findings total (6 CRITICAL, 9 WARNING, 5 INFO) — 100% resolved and verified.
- **Global Rule**: ALL architectural decisions and context updates must be synchronized with `Brain's Protocol` at `C:\Users\murat\IdeaProjects\new_world\Brain's protocol - second brain`.

## Infrastructure & Test State
- **Backend (Spring Boot 3 / Java 17)**: 100% test pass rate (`./gradlew test`) across all modules (Auth, Admin, CRM, Billing, LMS, Documents, Chat, Notifications, Search, WebSocket ACL). JaCoCo configured for coverage tracking.
- **Frontend (React 19 / Vite / Tailwind v4)**: 100% Vitest test pass rate (19 test files, 168 tests), strict TypeScript verification (`tsc --noEmit`), and clean ESLint 9 flat config (`eslint.config.js`, 0 errors, 0 warnings).
- **CI/CD (.github/workflows/ci.yml)**: Continuous quality gate enforcing backend test execution, frontend linting, typechecking, Vitest execution, and GitHub Pages deployment.
- **Storage (Cloudflare R2)**: Provisioned bucket `jf1c-documents` for Epic-15/Epic-21 ($0 egress).
- **Auth & Security**: JWT Bearer, refresh token rotation, TOTP 2FA, Bucket4j rate limiting, row-level CRM access controls.
- **Roles (6)**: ADMIN, EMPLOYEE, CLIENT, LEARNER, CURATOR, ADVISOR.

## Key Completed Features & Milestones
1. **Full Automated Test Coverage Across Backend, Frontend & CI/CD**:
   - Comprehensive MockMvc, JUnit 5, Mockito, and Spring Security ACL test coverage for all controllers and domain services.
   - 168 unit and integration tests across frontend entities, widgets, features, contexts, and pages.
   - ESLint 9 flat config with zero warnings and strict TypeScript mode enabled.
   - Dual-track E2E test inventory (`TEST_READY.md`, 202 test specs across 4 tiers) and test infrastructure (`TEST_INFRA.md`).

2. **100% 4-Language i18n & Dictionary Parity (`ru`, `kk`, `en`, `zh`)**:
   - Complete key parity across all 4 locales in `src/shared/i18n/locales/`.
   - Created missing Chinese dictionaries (`zh/crm.json`, `zh/modals.json`, `zh/tasks.json`) and synchronized Kazakh schemes.
   - Automated parity test suite `i18nParity.test.ts` (96 tests) verifying bidirectional key alignment.
   - Centralized date and currency formatting utilities (`dateFormat.ts`).

3. **1C Client Hub & Report Stubs (`/client/1c`) [ТЕСТОВЫЙ / FRONTEND-ONLY]**:
   - Раздел `/client/1c` и вложенные маршруты (`/osv`, `/saldo`, `/reconciliation`, `/account-card`, `/cash-book`, `/stock`) — исключительно тестовый фронтенд-интерфейс без данных.
   - Бекенд-интеграции и реальных финансовых данных на текущий момент нет.
   - Моковые/фейковые финансовые данные строго запрещены: отображается чистый Empty State в ожидании OData-шлюза.
   - Полноценный запуск двусторонней синхронизации запланирован в Фазе 3 в рамках Epic-21 (1C Data Gateway).

4. **Epic-21 Roadmap (1C Data Gateway & Fiscal Hub)**:
   - Полная архитектурная спецификация и дорожная карта интеграции в `Epics/Plan/Epic-21-1c-data-gateway/epic.md`.
