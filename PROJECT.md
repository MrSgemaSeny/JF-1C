# Project: JF-1C Security Hardening & Platform Features

## Architecture
- **Backend**: Spring Boot 3, Java 17, Spring Security 6, WebSocket STOMP, Bucket4j, PostgreSQL, Flyway.
- **Frontend**: React 19, TypeScript, Tailwind v4, Vite, FSD architecture.
- **Context Path**: `/api`, controllers on `/v1/**` -> `/api/v1/**`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Security Headers Middleware | CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy | M1 | User Request R1 |
| 2 | Automated Header Tests | MockMvc test verifying all 5 security headers on responses | M1 | User Request R1 |
| 3 | Business Rate Limiting | Bucket4j filter with userId & IP fallback, endpoint-specific limits | M2 | User Request R2 |
| 4 | Rate Limit Isolation Tests | Integration tests for per-user limits, IP fallback, and bypass | M2 | User Request R2 |
| 5 | WebSocket Auth Interceptor | ChannelInterceptor.preSend checking SUBSCRIBE & SEND permissions | M3 | User Request R3 |
| 6 | WebSocket ACL Tests | Tests verifying cross-user subscription & senderId spoofing rejection | M3 | User Request R3 |
| 7 | Kaspi QR Generation Service | QR payload, data, SVG/PNG code, and invoice payment deep link | M4 | User Request R4 |
| 8 | Kaspi Payment Provider Architecture | Modular provider interface with MockKaspiPaymentProvider | M4 | User Request R4 |
| 9 | Kaspi Webhook Callback | /api/v1/billing/kaspi/callback with signature verification & idempotency | M4 | User Request R4 |
| 10| Invoice & CRM Task Transition | Automatically mark invoice PAID and advance CRM task stage | M4 | User Request R4 |
| 11| Kaspi Unit & Integration Tests | Tests for QR generation, webhook security, idempotency, PAID transitions | M4 | User Request R4 |
| 12| E2E Verification & Journal | Full suite test pass, Second Brain journal update, git commit/push | M5 | Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Security Headers (R1) | Security headers in SecurityConfig/filter, automated MockMvc tests | None | DONE |
| 2 | Rate Limiting (R2) | Granular Bucket4j filter with userId & IP fallback, endpoint tiers, tests | M1 | IN_PROGRESS |
| 3 | WebSocket ACL (R3) | ChannelInterceptor STOMP ACL validation, tests | M1 | PLANNED |
| 4 | Kaspi QR & Webhooks (R4) | QR service, payment provider, webhook callback, stage update, tests | M1, M2 | PLANNED |
| 5 | E2E & Second Brain (M5) | All backend and frontend tests passing, journal update, git push | M1, M2, M3, M4 | PLANNED |

## Code Layout
- Security Configuration: `src/main/java/com/example/zhanfinancebackend/common/config/SecurityConfig.java`
- Rate Limiting: `src/main/java/com/example/zhanfinancebackend/common/security/` or `kz/zhan/crm/security/filter/`
- WebSocket: `src/main/java/com/example/zhanfinancebackend/modules/chat/`
- Billing & Kaspi: `src/main/java/com/example/zhanfinancebackend/modules/billing/`
- Tests: `src/test/java/com/example/zhanfinancebackend/`
