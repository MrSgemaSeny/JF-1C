# JF-1C Test Infrastructure Specification

## 1. Architecture Overview & Dual Track Strategy

The JF-1C testing framework is organized as a Dual Track verification architecture:
1. **Implementation Track**: Unit, controller slice, and component tests running in isolation (Spring Boot MockMvc, Mockito, Vitest, React Testing Library).
2. **E2E Testing Track**: Opaque-box, requirement-driven integration and live lifecycle suites verifying contracts, cross-module workflows, security policies, and user journeys against running application environments.

```
+-----------------------------------------------------------------------------------+
|                              QUALITY GATES MATRIX                                 |
+------------------------------------+----------------------------------------------+
| Implementation Track (Isolated)    | E2E Testing Track (Opaque-Box & Integration) |
+------------------------------------+----------------------------------------------+
| Backend: MockMvc + JUnit 5         | Live API Suites: Node.js ESM Test Harness    |
| Backend Coverage: JaCoCo >= 70%    | Browser Journeys: Playwright Chromium Headless|
| Frontend: Vitest + RTL             | Security Audit: RBAC & IDOR Verification     |
| Frontend Coverage: V8 >= 70%       | Concurrency & Limits: Bucket4j Rate Limiting |
| Static: ESLint 9 (0 warnings)      | Cross-Module: CRM -> Billing -> LMS -> Chat  |
| Types: TypeScript Strict (0 errors)| Load & SLA: Artillery p95 < 1s, err < 1%     |
+------------------------------------+----------------------------------------------+
```

---

## 2. Test Execution Environments

The testing infrastructure supports three distinct execution profiles:

### 2.1 Local In-Memory Environment (Fast Iteration)
- **Backend Database**: In-memory H2 database (`jdbc:h2:mem:zhan_finance_test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH`).
- **Flyway Status**: `spring.flyway.enabled=false`, schema synthesized via Hibernate `ddl-auto=update` to maximize developer execution speed (<90s for entire backend suite).
- **Frontend Environment**: Vitest with `jsdom` v29.1, mocking `@/shared/api/http` and WebSocket STOMP transport.
- **Scope**: Tier 1 and Tier 2 unit and controller slice tests.

### 2.2 CI Service Container Environment (Pre-Merge Quality Gate)
- **Backend Database**: Dedicated PostgreSQL 16 service container in GitHub Actions (`postgres:16`).
- **Flyway Status**: `spring.flyway.enabled=true`, validating all 61 migrations (V1 to V121) against real PostgreSQL syntax, triggers, and PL/pgSQL procedures.
- **Coverage Enforcement**: JaCoCo verification task halting CI if instruction coverage falls below 70.00%.
- **Frontend Verification**: Sequential execution: ESLint 9 (`--max-warnings 0`), `tsc --noEmit`, Vitest V8 coverage (`>=70%`), and production asset bundling.

### 2.3 Live & Staging Environment (Full Integration & Browser E2E)
- **Backend Target**: `https://zhanfinance.fly.dev/api` (or local `http://localhost:8080/api`).
- **Frontend Target**: `https://mrsgemaseny.github.io/JF-1C` (or local `http://localhost:5173`).
- **Scope**: Tier 3 Cross-Feature combinations, Tier 4 Real-World scenarios, Playwright browser flows, and Artillery load profiles.

---

## 3. The 4-Tier Test Methodology

The test inventory is organized into four hierarchical tiers:

### Tier 1: Feature Coverage (>=5 tests per feature)
- **Objective**: Verify isolated happy-path functionality for all endpoints, services, and UI components.
- **Scope**: Every feature in PROJECT.md must have at least 5 dedicated positive test cases verifying inputs, business calculations, database persistence, and standard responses (200 OK / 201 Created).

### Tier 2: Boundary, Corner & Adversarial Cases (>=5 tests per feature)
- **Objective**: Stress-test error paths, edge conditions, invalid inputs, and security constraints.
- **Scope**:
  - Null, empty, whitespace-only, and excessively large payloads.
  - Boundary dates (past dates, expired deadlines, overlapping subscription ranges).
  - Special characters, Cyrillic UTF-8 encoding, and HTML/script injection attempts.
  - Cross-tenant IDOR attacks: verifying that non-admin actors receive 403 Forbidden or 404 Not Found when accessing resources belonging to other tenants.
  - Role-Based Access Control (RBAC): verifying `@PreAuthorize` enforcement (e.g. ADVISOR read-only status, CLIENT restricted to self).
  - Rate limiting: exhausting Bucket4j token buckets and verifying HTTP 429 Too Many Requests responses.

### Tier 3: Cross-Feature Combinations
- **Objective**: Validate pairwise interactions across disparate modules.
- **Scope**:
  - CRM Task Stage Transition -> Billing Invoice Auto-Generation -> In-App Notification.
  - Course Completion -> Certificate Generation -> Public Verification Link -> Learner Profile Badge.
  - Document Upload -> Storage Service Binary Persistence -> Task Association -> Client Signature Confirmation.
  - Chat Message Delivery -> STOMP Topic Dispatch -> Unread Count Increment -> Notification Bell Update.
  - Admin Employee Approval -> Credential Activation -> Task Pool Access -> Task Claiming.

### Tier 4: Real-World Application Scenarios
- **Objective**: Complete end-to-end multi-persona operational workflows representing real business journeys.
- **Scope**:
  - Multi-tenant client onboarding and billing cycle.
  - Employee recruitment, approval, and task dispute resolution.
  - Complete LMS education path from enrollment to public certificate verification.
  - Security audit walk verifying zero privilege escalation across all 6 roles (ADMIN, EMPLOYEE, CLIENT, LEARNER, CURATOR, ADVISOR).

---

## 4. Concrete Verification Runners & Commands

### 4.1 Backend Test Runner (Gradle / JUnit 5 / JaCoCo)
- **Working Directory**: `./zhan-finance-backend`
- **Execute Full Test Suite**:
  ```powershell
  ./gradlew test
  ```
- **Execute Single Test Class**:
  ```powershell
  ./gradlew test --tests "com.example.zhanfinancebackend.modules.crm.controller.TaskControllerTest"
  ```
- **Generate JaCoCo Coverage Report**:
  ```powershell
  ./gradlew test jacocoTestReport
  ```
- **Enforce JaCoCo Coverage Gate (>=70% instruction threshold)**:
  ```powershell
  ./gradlew jacocoTestCoverageVerification
  ```
- **Clean Stale Result Cache (Windows EOF/Buffer Underflow fix)**:
  ```powershell
  ./gradlew cleanTest
  ```

### 4.2 Frontend Quality & Vitest Runner
- **Working Directory**: `./zhan-finance-frontend`
- **Install Dependencies**:
  ```powershell
  npm ci
  ```
- **Static Analysis (ESLint 9 Flat Config - 0 warnings enforced)**:
  ```powershell
  npm run lint
  ```
- **TypeScript Standalone Strict Typecheck (0 errors enforced)**:
  ```powershell
  npm run typecheck
  ```
- **Execute All Vitest Suites**:
  ```powershell
  npm test
  ```
- **Execute Vitest with V8 Coverage Thresholds (>=70%)**:
  ```powershell
  npm run test:coverage
  ```
- **Production Asset Build Verification**:
  ```powershell
  npm run build
  ```

### 4.3 Integration & Live E2E Harness (Node.js ESM)
- **Working Directory**: `./tests`
- **Run Master Live E2E Suite**:
  ```powershell
  node run-all-e2e.mjs
  ```
- **Run Targeted E2E Lifecycles**:
  ```powershell
  node e2e/api-live.mjs                        # API security headers & public endpoints
  node e2e/crm-lifecycle-live.mjs              # CRM tasks, pipelines & reassignments
  node e2e/billing-invoices-live.mjs           # Invoices, subscriptions & PDF generation
  node e2e/lms-lifecycle-live.mjs              # LMS courses, lessons & certificates
  node e2e/chat-notifications-live.mjs         # Chat messaging & notification lifecycle
  node e2e/documents-search-live.mjs           # Document uploads & global search
  node e2e/idor-live.mjs                       # RBAC & IDOR cross-tenant penetration
  node e2e/rate-limit-lifecycle.mjs            # Bucket4j 429 rate limit enforcement
  node e2e/advisor-readonly-lifecycle.mjs      # Advisor read-only boundary enforcement
  node e2e/2fa-lifecycle.mjs                   # TOTP 2FA setup, verify & disable
  node e2e/search-lifecycle.mjs                # Global search Cyrillic & role isolation
  ```
- **Environment Variables for Custom Target**:
  ```powershell
  $env:API_BASE_URL="http://localhost:8080/api"
  $env:ADMIN_EMAIL="admin@zhanfinance.kz"
  $env:ADMIN_PASSWORD="TestPass123"
  node run-all-e2e.mjs
  ```

### 4.4 Browser E2E Runner (Playwright Chromium Headless)
- **Working Directory**: `./tests`
- **Run Browser Public Pages Suite**:
  ```powershell
  node e2e/frontend-live.mjs
  ```
- **Run Browser Authenticated Journeys (Admin, Employee, Client)**:
  ```powershell
  node e2e/authenticated-journeys-live.mjs
  ```

### 4.5 Performance & Load SLA Runner (Artillery)
- **Working Directory**: `./tests`
- **Execute Authenticated CRM Load Scenario**:
  ```powershell
  npx artillery run artillery/scenarios/authenticated-crm.yml --output artillery-report.json
  ```
- **Validate SLA Thresholds**:
  ```powershell
  npx artillery report artillery-report.json --ensure
  ```

---

## 5. Pass / Fail Semantics & Quality Gate Thresholds

A build, test run, or pull request is deemed **PASSED** if and only if all of the following conditions are met:

| Gate | Tool / Runner | Success Condition | Failure Action |
|------|---------------|-------------------|----------------|
| **Backend Tests** | Gradle / JUnit 5 | 100% test methods pass (0 failures, 0 errors) | CI pipeline halts immediately |
| **Backend Coverage** | JaCoCo | Instruction coverage >= 70.00% (excluding DTOs and Entities) | `jacocoTestCoverageVerification` fails build |
| **Database Migrations** | Flyway on PostgreSQL 16 | All 61 migrations (V1..V121) apply cleanly; 0 checksum alterations | CI pipeline halts |
| **Frontend Static** | ESLint 9 | 0 errors, 0 warnings (`--max-warnings 0`) | Pull request rejected |
| **Frontend Types** | TypeScript `tsc` | 0 type errors under `strict: true` | Build fails |
| **Frontend Tests** | Vitest | 100% test suites pass | Build fails |
| **Frontend Coverage**| Vitest V8 | Statements >= 70%, Lines >= 70%, Branches >= 70%, Functions >= 70% | Build fails |
| **Live Integration** | Node.js E2E | 100% test assertions pass across all 11 lifecycle suites | Release pipeline aborted |
| **Performance SLA** | Artillery | p95 latency < 1000ms, p99 < 2000ms, error rate < 1.0% | Staging gate fails |
| **Emoji Prohibition** | Git Pre-commit / CI grep | Zero Unicode emojis in any file, response, or commit | Hard reject |

---

## 6. Authentication, Data Isolation & Rate-Limiting Protocol

### 6.1 Ephemeral Test Actors
To prevent test cross-contamination:
- Test actors are dynamically provisioned with randomized nonces (e.g. `e2e.client.49281@testmail.com`, `e2e.emp.82914@testmail.com`).
- Admin actor utilizes pre-seeded or provisioned admin credentials (`admin@zhanfinance.kz`).
- Employee accounts are created via `POST /api/v1/auth/register` and programmatically approved by Admin via `POST /api/v1/admin/employees/{id}/approve`.

### 6.2 Token Caching & Automatic Refresh
- The shared helper `tests/e2e/auth-helper.mjs` caches valid JWT tokens in `.auth-cache.json` for up to 30 minutes.
- Before executing requests, the token validity is probed via `GET /api/v1/users/me`.
- If expired or missing, fresh tokens are negotiated and re-cached.

### 6.3 Bucket4j Rate Limit Resilience
- Rate limit buckets (10 req/min for login, 5 req/min for email check) can trigger HTTP 429 during rapid test runs.
- `request()` in `auth-helper.mjs` detects HTTP 429 and performs automatic backoff:
  - Sleeps 8,000ms to allow token replenishment.
  - Automatically retries up to 4 attempts before declaring failure.

### 6.4 Cleanup & Teardown
- Tier 3 and Tier 4 workflows must clean up created resources (invoices, tasks, temporary documents) at the conclusion of test lifecycles to prevent database bloat and query degradation.
