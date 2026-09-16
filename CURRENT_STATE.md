# Current State Architecture & Engineering Baseline (JF-1C / ZhanFinance)

_Last Updated: 2026-09-16_

## 1. Executive Summary

**ZhanFinance (JF-1C)** is a production-grade SaaS CRM, Document Flow, and Accounting Platform tailored for Kazakhstani bookkeeping and outsourced financial management.

---

## 2. Technology Stack & Infrastructure

### Backend
- **Framework**: Spring Boot 3 (Java 17), Spring Security 6, Spring Data JPA
- **Database**: PostgreSQL 17, Flyway Migration Chain (`V1` – `V122` immutable)
- **Authentication**: JWT Bearer + Refresh Token Family Rotation & Reuse Detection (RFC 6749 BCP) + TOTP 2FA
- **Rate Limiting**: `Bucket4j` + `Caffeine Cache` (100% In-Memory JVM, Zero Redis dependency)
- **Document & PDF Engine**: `openhtmltopdf` (with embedded Cyrillic font support) + Apache POI (`poi-tl`)
- **Real-Time Layer**: Spring WebSocket + STOMP / SockJS (strict Principal-based ACL)
- **Monitoring & Metrics**: Prometheus Micrometer, OpenTelemetry, Health Actuators

### Frontend
- **Framework**: React 19, TypeScript (Strict Mode), Vite 8
- **Architecture**: Feature-Sliced Design (FSD: `app` -> `pages` -> `widgets` -> `features` -> `entities` -> `shared`)
- **Styling**: Tailwind CSS v4, custom token system, responsive light/dark themes
- **State & Networking**: `@tanstack/react-query`, Axios/Fetch wrapper with singleton refresh mutex
- **Quality Gates**: Vitest (169 tests), ESLint 9 (Flat Config, 0 warnings), Strict `tsc --noEmit`
- **Internationalization (i18n)**: 100% dictionary parity across 4 locales: Kazakh (`kk`), Russian (`ru`), English (`en`), Chinese (`zh`)

### Hosting & DevOps
- **Backend Hosting**: Fly.io (`https://zhanfinance.fly.dev`)
- **Frontend Hosting**: GitHub Pages (`https://mrsgemaseny.github.io/JF-1C`)
- **Object Storage**: Cloudflare R2 (`jf1c-documents` bucket)
- **CI/CD**: GitHub Actions (Backend Tests, JaCoCo Coverage Gate, Frontend Lint & Typecheck, Auto-Deploy, Weekly DB Restore Drills)

---

## 3. System Roles & Access Matrix

| Role | Scope & Permissions |
|---|---|
| `ADMIN` | Full administrative control, employee approvals, system settings, global billing audit |
| `EMPLOYEE` | CRM pipeline management, task execution, client document preparation, time tracking |
| `CLIENT` | Personal cabinet, company document viewing, invoice payments, chat with accountant |
| `LEARNER` | LMS course student, homework submission, progress tracking |
| `CURATOR` | LMS course instructor, student homework review, certificate issuance |
| `ADVISOR` | Financial advisor, client analytics, workload reporting |

---

## 4. Key Security & Architectural Invariants

1. **Token Family Reuse Detection (`V122`)**: Refresh tokens are rotated inside unique `family_id` chains. If an already rotated token is reused, all active tokens for that family/user are immediately invalidated.
2. **PAID & CANCELED Invoice Immutability**: Any modification (`update` of title/amount/due date) or `delete` operation on a `PAID` or `CANCELED` invoice is strictly blocked (`UnprocessableEntityException`).
3. **Invoice State Machine**: State transitions follow `DRAFT` -> `ISSUED` -> `PAID`/`OVERDUE`/`CANCELED`. `PAID` and `CANCELED` are immutable terminal states.
4. **Row-Level Tenant Isolation**: IDOR protection via `CrmAccessService`, `InvoiceAccessService`, and `DocumentAccessService`.
5. **Fail-Fast Secrets**: Startup validation prevents launching production with default or weak `JWT_SECRET`.
6. **Zero Redis Monolith**: In-memory rate limiting and caching eliminate unnecessary external network hops and cloud infrastructure costs.

---

## 5. Next Milestones (P1 & Epic-21)

- **P1-1 & P1-2**: Task State Machine & Optimistic Locking (`@Version`).
- **P1-3**: Task Pool atomic pickup query.
- **P1-5**: Cloudflare R2 direct document integration.
- **P1-6**: Two-Tier Webhook Idempotency for payment gateways (Kaspi Pay / WebKassa).
- **Epic-21**: 1C Data Gateway OData bidirectional synchronization hub.
