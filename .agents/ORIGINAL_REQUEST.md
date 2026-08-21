# Original User Request

## 2026-08-21T05:00:20Z

Full pre-release audit of JF-1C (ZhanFinance) — a SaaS CRM/accounting platform for a Kazakhstani bookkeeping business. Two-phase: Phase 1 is audit-only (no code changes), output is a severity-tagged report. Phase 2 is remediation in priority order, one bug per commit, with diff review before each fix.

Working directory: C:\Users\murat\IdeaProjects\JF-1C

---

## Hard Constraints (violations = stop immediately)

- Work only in branch `audit/pre-release`, never in main.
- Phase 1 (audit) produces a report only. Zero code changes.
- Phase 2 (remediation) requires explicit checkpoint after Phase 1 report is reviewed.
- One bug = one commit. Each commit must include reason in message.
- Do NOT touch: `fly.toml`, GitHub Actions workflow files, `build.gradle`, `Dockerfile`.
- Do NOT edit applied Flyway migrations (V1–V110+). New schema issue = new migration V111+.
- No DROP/DELETE/wipe on DB without explicit human confirmation.
- Priority on conflict: Security > Correctness > Performance > Code Cleanliness.

---

## Requirements

### R1. Phase 1 — Full Audit Report

Produce a single markdown report covering all modules and dimensions below.
Each finding must have: severity label `[CRITICAL]` / `[WARNING]` / `[INFO]`,
module name, root cause (confirmed, not guessed), proposed fix (no code applied),
and affected files. No code changes in this phase.

#### R1.1 Known Issues — Confirm Root Cause (Do Not Re-Diagnose)
- Lesson/module sort order: missing `ORDER BY created_at ASC` — confirm the exact query location.
- Avatars not loading — confirm exact failure point (storage path, URL resolution, security config).
- WebSocket "closed before connection is established" — confirm whether client-side race or server handshake timing.

#### R1.2 Security
- JWT: confirm access+refresh tokens never appear in localStorage, URL params, logs, WebSocket handshake headers, or PDF generation pipeline.
- `/uploads/**`: confirm Spring Security blocks unauthenticated direct access at filter level, not only at controller level.
- Swagger: confirm disabled in `prod` profile via explicit config, not default assumption.
- Bucket4j / rate limiting: confirm limits are per-IP or per-user, not global (global = one client blocks all others).
- IDOR audit: for every controller endpoint with `{id}` in path — CRM (`CrmAccessService`), Documents, Billing, LMS — confirm ownership/role check exists, not just authentication.
- Audit table triggers: confirm the immutability trigger (blocking UPDATE/DELETE on audit tables) is actually present in the DB, not just declared in a migration file.
- 2FA (TOTP): check whether recovery codes / lost-device fallback exists. Not a release blocker — flag as `[INFO]` only.

#### R1.3 Stability / Memory
- 512MB RAM VM: check for N+1 queries in CRM/LMS listings. Check for unbound collection loads (any list endpoint missing pagination where data could grow). Check for WebSocket session leaks on connection drop.
- Caffeine cache: confirm eviction policy is configured, cache does not grow unbounded with many concurrent clients.
- Dashboard cache: confirm ALL mutation paths (including batch operations) call `@CacheEvict`, not just the main CRUD path.

#### R1.4 Data / Migrations
- Flyway chain V1–V110+: confirm reproducibility by reading migration files for type conflicts, naming collisions, or statements that rely on existing data state rather than schema.
- `DatabaseMigrationRunner` and `OfficialDocumentTemplateSeeder`: confirm idempotency — repeated runs on existing DB must not duplicate seeds.

#### R1.5 Backend Modules (all 14)
For Auth, CRM, Documents, Billing, LMS, Chat, Notifications, Audit, Search, Calendar, Landing, and any remaining modules: flag per-module any unhandled exceptions reaching client as raw stack trace, any null-unsafe DTO binding, any multi-table mutation missing `@Transactional`.

#### R1.6 Frontend
- React Query cache keys: confirm invalidation consistency (`['tasks','list',filter]` etc.) across all mutations from different features.
- dnd-kit Kanban: check for race condition / double-submit on rapid drag operations.
- i18next: flag any hardcoded UI strings outside the RU/EN dictionaries.
- Dead routes, unused imports: flag as `[INFO]`.

#### R1.7 Tests and CI/CD
- Confirm test coverage exists for: auth flow, CRM row-level security, billing.
- Confirm CI pipeline (`test.yml`, `ci.yml`, `deploy-backend.yml`) blocks deployment on test failure — not just warns.

---

### R2. Phase 2 — Remediation (only after checkpoint)

After the Phase 1 report is reviewed and priorities are set:

- Fix in order: `[CRITICAL]` security/data-loss → known bugs (R1.1) → `[WARNING]` → `[INFO]` at discretion.
- Each fix: one commit, conventional commit message, regression test added.
- Before each commit: show a diff and wait for approval signal in the report.
- No fix proceeds without the Phase 1 checkpoint being explicitly completed.

---

### R3. Release Readiness Checklist

At end of Phase 2, verify all of the following pass:

- [ ] No secrets in source files — only in env vars.
- [ ] `ddl-auto` is not `create` or `update` in prod profile.
- [ ] Logout invalidates refresh token end-to-end (tested).
- [ ] All errors return structured JSON with requestId, not raw stack trace.
- [ ] CI blocks deploy on test failure (confirmed, not assumed).
- [ ] `./gradlew build` exits 0 with 0 errors.
- [ ] `npm run build` exits 0 with 0 errors.
- [ ] Known bugs from R1.1 are closed and covered by a regression test.

---

## Verification

### Phase 1 — Audit report completeness (agent-as-judge)

An independent reviewer agent checks the Phase 1 report against this rubric:
- Every section in R1.1–R1.7 has at least one finding or an explicit "no issue found" entry.
- Every finding has: severity label, module, confirmed root cause (not guessed), proposed fix, affected file list.
- No proposed fix contains applied code — findings only.
- Known issues (R1.1) have confirmed root cause pointing to a specific file and line, not a module-level description.

### Phase 2 — Remediation correctness

- Each fix commit is accompanied by a test that would have caught the bug before the fix.
- `./gradlew test` passes after each commit before the next fix begins.
- Release checklist R3 items are verified programmatically where possible (build commands, grep for secrets patterns, config value checks).

---

## Stack Reference (do not change, audit against this)

- Backend: Spring Boot 3/4, Java 17, PostgreSQL, Flyway, Gradle, Caffeine cache
- Frontend: React 19, Vite 8, TypeScript, Tailwind v4, FSD architecture
- Auth: JWT (access + refresh), singleton refresh in http.ts
- WebSocket: STOMP/SockJS
- Deploy: Fly.io (backend) + GitHub Pages (frontend)
- API: context-path=/api, controllers on /v1/**, final routes /api/v1/**
- Roles: ADMIN, EMPLOYEE, CLIENT, LEARNER, CURATOR, ADVISOR
- Security: Spring Security, @PreAuthorize, row-level via CrmAccessService
- Migrations: V1–V110 applied and immutable

## Follow-up — 2026-08-21T05:08:00Z

CRITICAL WORKFLOW RULES:
1. JOURNAL & PUSH: You must always run git add, git commit, git push and update the journal (C:\Users\murat\IdeaProjects\new_world\Brain's protocol - second brain\journal\2026-08-21\jf-1c.md) after completing any stage or task.
2. SECOND BRAIN: If you learn important project info, make architectural decisions, or discover critical debt, YOU MUST document it in the Second Brain (the context/ folder or valeur.md) so it isn't lost.

## Phase 2 Authorization — 2026-08-21T07:30:44Z

Authorization granted for Phase 2 (Remediation).
Plan file: C:\Users\murat\Downloads\jf1c-phase2-remediation-plan.md

Execution Order for Tier 1 (CRITICAL):
1. C6 — OfficialDocumentTemplateSeeder: remove delete-then-insert, only seed missing templates (upsert/skip existing).
2. C5 — Missing @Transactional on 6 methods (TaskService.requestTask + 5 methods in AdminService).
3. C4 — V107 NULL violation on clean DB: create V111 migration backfilling created_by to first ADMIN user id.
4. C1 — Avatar 404 (prefix mismatch).
5. C3 — Unbounded queries / missing pagination + TaskSpecification in-memory pagination fix.
6. C2 — N+1 queries (LMS -> Documents -> Chat).

Rules:
- 1 issue = 1 commit with descriptive reason.
- Show diff for approval before each commit.
- After each fix: regression test verifying the specific fix.
- Do NOT touch fly.toml, GitHub Actions workflows, build.gradle, Dockerfile.
- Migrations V1-V110 immutable.
- Update Journal & Push after completing stage/task.

## Autonomous Commit Authorization — 2026-08-21T07:50:10Z

The user has explicitly authorized autonomous commits on branch 'audit/pre-release' (NEVER commit to main).
1. Continue strictly on branch 'audit/pre-release'.
2. 1 issue = 1 commit with descriptive reason + regression test.
3. Automatically commit and push to origin/audit/pre-release as soon as regression tests pass for each issue, without waiting for manual human approval per commit.
4. Proceed autonomously through Tier 1 in order:
   - C5 (@Transactional on AdminService / TaskService)
   - C4 (V111 migration backfilling courses.created_by)
   - C1 (Avatar 404 normalization)
   - C3 (Unbounded queries pagination + TaskSpecification)
   - C2 (N+1 queries: LMS -> Documents -> Chat)
5. Stop at Checkpoint 1 (after all 6 CRITICAL are complete) with full diff --stat for tier review.



