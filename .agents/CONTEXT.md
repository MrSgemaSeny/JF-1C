# Project State & Context -- ZhanFinance (JF-1C)

## Current Phase & Global Goals
- **Active Phase**: Production Release v1.0.0 (Tag v1.0.0 published on GitHub)
- **Main Goal**: Transition to Billing & Payments (WebKassa / Kaspi Pay) and custom domain (zhanfinance.kz)
- **Audit status**: 28 findings total (6 CRITICAL, 9 WARNING, 5 INFO) — 100% resolved and verified.
- **Global Rule**: ALL architectural decisions and context updates must be synchronized with `Brain's Protocol` at `C:\Users\murat\IdeaProjects\new_world\Brain's protocol - second brain`.

## Infrastructure State
- **Backend (Fly.io)**: Deployed, migrations up to V120 applied. PostgreSQL connected. Secrets in Fly Secrets.
- **Frontend (GitHub Pages)**: CI/CD configured (deploy-backend.yml + ci.yml). All API paths on /api/v1/**. Release v1.0.0 published.
- **Auth**: JWT Bearer tokens, refresh token rotation, 2FA (TOTP) fully working.
- **Roles**: 6 roles -- ADMIN, EMPLOYEE, CLIENT, LEARNER, CURATOR, ADVISOR.

## Recently Completed
1. **2FA (Epic-09)**: Fully implemented -- QR setup, TOTP verification, disable, scheduled cleanup. 6 unit tests.
2. **Documents Redesign (Epic-03)**: Employee + Client pages redesigned with metrics cards, folder pills, source filters, ZIP download.
3. **ADVISOR Role (Epic-19)**: Full role with Overview, Workload, access to all clients/tasks/documents, sidebar navigation.
4. **Task Pool Logic (Epic-02)**: Auto-reopen LOST tasks to first OPEN stage when assigned from pool.
5. **Landing Pages (Epic-18)**: Public pages working -- Home, Services, About, Solution Picker, Contact, Leads.
6. **API Versioning**: All paths migrated to /api/v1/** (Phase 4 complete).
7. **GitHub Actions**: Configured DB backups (flyctl) and deploy notifications via Telegram.
8. **Observability (Epic-10)**: Configured OTLP push metrics. (Sentry backend paused due to Spring Boot 4.1 incompat). UptimeRobot configured.
9. **Business Alerts (Epic-06)**: Async Telegram notifications for admins (leads/tasks) using RestClient.
10. **Security & Audit**: Fixed DocumentService file upload vulnerability (MIME spoofing). Audit logs secured with `@AuditedEntity` and PostgreSQL triggers (UPDATE/DELETE/TRUNCATE blocked).
11. **In-Memory Bearer Auth & Dynamic Base**: Fixed SPA cross-domain 401s by adding in-memory `accessToken` in `Authorization: Bearer` headers (no `localStorage`). Fixed 404 routing on custom domains by dynamically evaluating `base: process.env.VITE_BASE_URL || '/'` and removing `localhost` fallbacks.
12. **Auth Security & Fixes**: Fixed infinite `/login` redirect loop on frontend. Added 2FA brute-force protection (`TwoFactorPreAuth` attempts counter + V109 migration) and scheduled database purge for expired refresh tokens (`RefreshTokenService.purgeExpiredTokens`).
13. **Frontend Cache Control**: Added `Cache-Control` meta tags to `index.html` to prevent GitHub Pages from aggressively caching stale SPA chunks (which caused old redirect loops to persist).
14. **React Router State Preservation**: Fixed silent 2FA failure during Google/local login by removing `setIsLoading(true)` from `AuthContext` auth methods. This prevents the `RouterProvider` from being temporarily unmounted and wiping out `location.state` (which is used for `preAuthToken` tracking) and component local states.
15. **Chat Interface Avatar**: Fixed chat UI to display user's avatar dynamically instead of a static default icon in `ChatDrawer`. Updated DTOs (`UserDto`, `ClientInfoDto`) to support `avatarUrl` natively.
16. **Employee Registration Status Flow**: Fixed edge case where newly registered employees (who are PENDING) were redirected to the dashboard without tokens, causing crashes. Added dedicated "Ваша заявка в работе" full-page status screen on the Login page for pending/rejected accounts.
17. **Mobile OAuth Fix (Safari ITP Bypass)**: Fixed mobile OAuth login (iOS Safari/Chrome) by reverting `@JsonIgnore` from `accessToken` in `AuthResponse`. This bypasses Apple's Intelligent Tracking Prevention (ITP) which blocks cross-domain HttpOnly cookies, allowing the frontend to capture the token in JSON and use `Authorization: Bearer` memory fallback.

## Known Issues & Warnings
- **CF-Connecting-IP**: Trusted before Cloudflare is connected (auto-resolves with Epic-11)
- **Refresh token race condition**: Known, not critical at current scale
- **Caffeine cache**: recordStats() not enabled, WARN in logs, no impact

## Pre-Release Audit Findings [CRITICAL — Phase 2 Remediation Required]
Full report: `.agents/audit_report.md` on `audit/pre-release` branch.
- **C1** [CRITICAL] Avatar 404: `FileDownloadController.java:48` prefix `"avatars/"` + storageKey, but DB stores key WITHOUT prefix → 404 on all avatar loads
- **C2** [CRITICAL] N+1 queries: Course catalog (1+N+NM), Curators (1+N), Documents (1+3N), Chat contacts (1+2N) → OOM risk under load
- **C3** [CRITICAL] Unbounded queries: AuditLog, Notifications, Invoices, Subscriptions — no pagination. `TaskSpecification.java:36` fetch join → Hibernate in-memory pagination (loads ALL rows)
- **C4** [CRITICAL] V107 migration: inserts NULL into `courses.created_by` (NOT NULL) → clean DB from scratch fails. Fix: new migration V111
- **C5** [CRITICAL] Missing @Transactional: `TaskService.requestTask()` + 5 methods in `AdminService` (demote/toggle/approve/reject/createLearner) → audit events lost on partial failure
- **C6** [CRITICAL] `OfficialDocumentTemplateSeeder` deletes all templates on EVERY app start → prod customized templates wiped on every deploy


## Next Steps
- Epic-07 / Epic-12: Billing & Payments (WebKassa / Kaspi Pay integration)
- Epic-11: Domain zhanfinance.kz + Cloudflare
- Dashboard, Staging, Notifications postponed until billing/domain MVP is complete.

## Epic Status Summary
- Done: 01-auth, 02-crm, 03-documents, 04-lms, 05-chat, 06-notifications, 08-dashboard, 09-2fa, 10-monitoring, 18-landing, 19-advisor (11)
- Partial: 07-billing (1)
- Planned: 11-domain-cdn, 12-payments, 13-1c-integration, 15-storage-r2, 16-lms-quizzes, 17-staging (6)

## Technical Backlog
- Check `sentry-spring-boot-starter-jakarta` version compatibility with Spring Boot 4.1.0 to restore backend Sentry error tracking (crashed on 8.51.0 due to `RestClientCustomizer`).
8. **Testing & Security**: Implemented Registration Status (PENDING, APPROVED, REJECTED) logic for strict security check and fail-closed anti-enumeration. Fully implemented frontend and backend test suites (Vitest & JUnit/Mockito).
- Security vulnerabilities (Path Traversal, IP Spoofing, IDOR, CSV Injection, DoS uploads, Token Race Condition) identified in verification audit have been fixed and pushed to main [DONE]
- Security vulnerabilities Phase 2 (JWT URL leak, DoS file uploads, Actuator port leak, Content-Disposition Header Injection, MIME Spoofing) fixed and pushed to main [DONE]
