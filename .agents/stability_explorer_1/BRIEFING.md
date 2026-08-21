# BRIEFING — 2026-08-21T05:09:45Z

## Mission
Stability and Performance Audit for JF-1C pre-release (R1.1 Known Issues & R1.3 Stability/Memory). Read-only investigation.

## 🔒 My Identity
- Archetype: explorer
- Roles: stability and performance auditor
- Working directory: c:\Users\murat\IdeaProjects\JF-1C\.agents\stability_explorer_1
- Original parent: 59307f8b-e3d3-469d-a2a5-efba1e3ad31a
- Milestone: Phase 1 Pre-Release Audit

## 🔒 Key Constraints
- Read-only investigation — zero code changes.
- Never use emojis anywhere.
- Extreme token efficiency.

## Current Parent
- Conversation ID: 59307f8b-e3d3-469d-a2a5-efba1e3ad31a
- Updated: not yet

## Investigation State
- **Explored paths**: `zhan-finance-backend/src/main/java`, `zhan-finance-frontend/src`.
- **Key findings**:
  - LMS sort order: Non-deterministic ordering due to `orderIndex=0` default and missing secondary `id ASC` sort in `ChapterRepository.java:11` and `CourseService.java:117-127`. Missing `ORDER BY` in `CourseRepository` search and `LessonProgressRepository`.
  - Avatar 404: Storage key prefix mismatch (`"avatars/"` prepended in `FileDownloadController.java:48`, but DB primary key in `StoredFile` table is raw UUID without prefix).
  - WebSocket closed before connection: React unmount / visibility checks tearing down in-flight SockJS handshakes in `ChatNotificationContext.tsx`, `ClientChatPage.tsx`, `ChatDrawer.tsx`.
  - N+1 Queries: LMS course hierarchy initialization (1+N+NM), LMS curator courses (1+N), document DTO mapping (1+3N), chat contacts (1+2N), billing invoice associations.
  - Unbounded Collections: `AuditLogController.getAllAuditLogs`, `NotificationController.getUserNotifications`, `DocumentController.getAllVisibleDocuments`, billing `findAll`, `findChatHistoryFull`; in-memory pagination hazard on `TaskSpecification` services fetch join.
  - Caffeine Cache: Bounded with `maximumSize` and `expireAfterWrite`. Region names `dashboard_admin/client` use default fallback config (300 items / 60s).
  - Dashboard Cache Eviction: Missing `@CacheEvict` on `PipelineController` stage mutations, `AdminService` staff promotions/approvals, and `TaskService` label toggles.
- **Unexplored areas**: None within R1.1 and R1.3 scope.

## Key Decisions Made
- All findings documented in `stability_audit.md` and `handoff.md`.

## Artifact Index
- DISPATCH.md — Initial user instructions
- BRIEFING.md — Persistent working state
- progress.md — Liveness heartbeat and milestone tracking
- stability_audit.md — Full audit report
- handoff.md — 5-component handoff report
