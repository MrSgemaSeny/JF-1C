# BRIEFING — 2026-08-21T14:52:00+05:00

## Mission
Remediate issue C3 (Unbounded queries / missing pagination + TaskSpecification in-memory pagination fix) across CRM, Billing, Documents, Notifications, and Audit modules.

## 🔒 My Identity
- Archetype: implementer
- Roles: implementer, qa, specialist
- Working directory: C:\Users\murat\IdeaProjects\JF-1C\.agents\teamwork_preview_worker_c3_1
- Original parent: eb1b34f5-626b-48fb-93c8-870f74a30ac3
- Milestone: Phase 2 Remediation (Issue C3)

## 🔒 Key Constraints
- Branch: audit/pre-release ONLY (never main).
- Strict rule: NO EMOJIS anywhere.
- 1 issue = 1 commit with descriptive reason + regression test.
- Push commit to origin/audit/pre-release.
- Maintain 100% backward compatibility with frontend consumers.
- Eliminate Hibernate HHH90003004 in-memory pagination warnings via two-query pattern.
- Update Second Brain journal and push.

## Current Parent
- Conversation ID: eb1b34f5-626b-48fb-93c8-870f74a30ac3
- Updated: 2026-08-21T14:52:00+05:00

## Task Summary
- **What to build**: Two-query TaskSpecification pagination in CRM and bounded/pageable dual-mode list endpoints in Documents, Billing (Invoice/Subscription), and Notifications.
- **Success criteria**: Zero HHH90003004 in-memory warnings, bounded database queries across all listed endpoints, 100% backend test pass.
- **Interface contracts**: Dual-mode controllers: return Page<T> if page/size params are given, bounded List<T> (limit 50-100) if omitted.

## Key Decisions Made
- Use two-query pagination (pure criteria pagination + bulk detail fetch by IDs) for TaskService.
- Use dual-mode pagination across DocumentController, InvoiceController, SubscriptionController, and NotificationController to maintain seamless backward compatibility with existing frontend while safeguarding against 512MB RAM VM OOM.

## Artifact Index
- TaskSpecification.java
- TaskRepository.java
- TaskService.java
- DocumentRepository.java, DocumentService.java, DocumentController.java
- InvoiceRepository.java, InvoiceService.java, InvoiceController.java
- SubscriptionRepository.java, SubscriptionService.java, SubscriptionController.java
- NotificationRepository.java, NotificationService.java, NotificationController.java
