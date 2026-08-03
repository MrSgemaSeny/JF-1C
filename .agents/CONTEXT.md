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
6. **LeadsPage UX**: Unified page scrolling (no inner overflow-auto).
7. **API Versioning**: All paths migrated to /api/v1/** (Phase 4 complete).

## Known Issues & Warnings
- **CF-Connecting-IP**: Trusted before Cloudflare is connected (auto-resolves with Epic-11)
- **Refresh token race condition**: Known, not critical at current scale
- **Caffeine cache**: recordStats() not enabled, WARN in logs, no impact

## Next Steps
- Epic-10: Monitoring (Prometheus, UptimeRobot)
- Epic-11: Domain zhanfinance.kz + Cloudflare
- Epic-17: Staging environment
- Epic-06: Push/Telegram notifications
- Epic-07: PDF invoices, payment reminders
- Epic-08: Dashboard analytics (charts, conversion funnel)

## Epic Status Summary
- Done: 01-auth, 02-crm, 03-documents, 04-lms, 05-chat, 09-2fa, 18-landing, 19-advisor (8)
- Partial: 06-notifications, 07-billing, 08-dashboard (3)
- Planned: 10-monitoring, 11-domain-cdn, 12-payments, 13-1c-integration, 14-multi-tenancy, 15-storage-r2, 16-lms-quizzes, 17-staging (8)
