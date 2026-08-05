# Project State & Context -- ZhanFinance (JF-1C)

## Current Phase & Global Goals
- **Active Phase**: Phase 6 -- Feature completion, documentation sync, production stabilization
- **Main Goal**: Complete all Partial epics, prepare for domain (zhanfinance.kz) and monitoring setup

## Infrastructure State
- **Backend (Fly.io)**: Deployed, migrations up to V110 applied. PostgreSQL connected. Secrets in Fly Secrets.
- **Frontend (GitHub Pages)**: CI/CD configured (deploy-backend.yml + ci.yml). All API paths on /api/v1/**.
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

## Known Issues & Warnings
- **CF-Connecting-IP**: Trusted before Cloudflare is connected (auto-resolves with Epic-11)
- **Refresh token race condition**: Known, not critical at current scale
- **Caffeine cache**: recordStats() not enabled, WARN in logs, no impact

## Next Steps
- Epic-11: Domain zhanfinance.kz + Cloudflare
- Epic-17: Staging environment
- Epic-06: Push/Telegram notifications
- Epic-07: PDF invoices, payment reminders
- Epic-08: Dashboard analytics (charts, conversion funnel)

## Epic Status Summary
- Done: 01-auth, 02-crm, 03-documents, 04-lms, 05-chat, 09-2fa, 10-monitoring, 18-landing, 19-advisor (9)
- Partial: 06-notifications, 07-billing, 08-dashboard (3)
- Planned: 11-domain-cdn, 12-payments, 13-1c-integration, 15-storage-r2, 16-lms-quizzes, 17-staging (6)

## Technical Backlog
- Check `sentry-spring-boot-starter-jakarta` version compatibility with Spring Boot 4.1.0 to restore backend Sentry error tracking (crashed on 8.51.0 due to `RestClientCustomizer`).
8. **Testing & Security**: Implemented Registration Status (PENDING, APPROVED, REJECTED) logic for strict security check and fail-closed anti-enumeration. Fully implemented frontend and backend test suites (Vitest & JUnit/Mockito).
