# Pre-Release Audit Plan — ZhanFinance (JF-1C)

## Goal
Perform full comprehensive audit (Phase 1) across R1.1 to R1.7, verifying exact root causes with file paths and line numbers, and produce `.agents/teamwork_preview_orchestrator_1/audit_report.md`.

## Streams
- **Stream 1 (Security - R1.2)**: JWT leakage/storage, /uploads/** filter-level security, Swagger in prod, Bucket4j rate limiting per-IP/user, IDOR audit on all {id} controller endpoints (CRM, Documents, Billing, LMS), Audit triggers immutability in DB, 2FA fallback check.
- **Stream 2 (Known Issues R1.1 & Stability/Memory R1.3)**:
  - R1.1: Lesson/module sort order (confirm exact query and file/line), Avatars not loading (storage path / URL resolution / security config), WebSocket "closed before connection is established" (client vs server timing).
  - R1.3: 512MB RAM VM checks (N+1 queries, unbound collection loads, WebSocket session leaks), Caffeine cache eviction policy, Dashboard cache eviction on all mutation paths.
- **Stream 3 (Data/Migrations R1.4 & Backend Modules 1-14 R1.5)**:
  - R1.4: Flyway chain V1-V110+ reproducibility, DatabaseMigrationRunner and OfficialDocumentTemplateSeeder idempotency.
  - R1.5: 14 backend modules (Auth, CRM, Documents, Billing, LMS, Chat, Notifications, Audit, Search, Calendar, Landing, etc.) for unhandled exceptions reaching client, null-unsafe DTO binding, missing @Transactional on multi-table mutations.
- **Stream 4 (Frontend R1.6 & Tests/CI-CD R1.7)**:
  - R1.6: React Query invalidation consistency, dnd-kit Kanban race conditions, i18next hardcoded strings, dead routes/unused imports.
  - R1.7: Test coverage (auth, CRM row-level security, billing), CI pipeline blocking behavior on failure.

## Synthesis & Verification
- Compile all findings into single report `.agents/teamwork_preview_orchestrator_1/audit_report.md`.
- Ensure each finding has: severity label ([CRITICAL] / [WARNING] / [INFO]), module name, confirmed root cause (with exact file and line), proposed fix (no code applied), affected files list. Explicit "No issue found" where applicable.
- Dispatch reviewer agent to verify report completeness against rubric.
- Send status report to parent.
