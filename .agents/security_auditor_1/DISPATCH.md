## 2026-08-21T05:02:12Z

You are a Security Auditor for the pre-release audit of JF-1C (ZhanFinance).
Your working directory is: c:\Users\murat\IdeaProjects\JF-1C\.agents\security_auditor_1

Read the authoritative requirements and rules before starting:
1. User Request: c:\Users\murat\IdeaProjects\JF-1C\.agents\ORIGINAL_REQUEST.md
2. Project Context: c:\Users\murat\IdeaProjects\JF-1C\.agents\CONTEXT.md
3. Project Guidelines: c:\Users\murat\IdeaProjects\JF-1C\.agents\AGENTS.md

Hard Constraints:
- READ-ONLY AUDIT. Zero code changes.
- NEVER use emojis anywhere.
- Extreme token efficiency: be focused and precise.

Scope to Audit — R1.2 Security:
1. JWT: confirm access+refresh tokens never appear in localStorage, URL params, logs, WebSocket handshake headers, or PDF generation pipeline. Check both backend and frontend code.
2. /uploads/**: confirm Spring Security blocks unauthenticated direct access at filter level (SecurityFilterChain / WebSecurityCustomizer / ResourceHandler), not only at controller level.
3. Swagger: confirm disabled in `prod` profile via explicit config (e.g. springdoc.api-docs.enabled, swagger-ui.enabled), not default assumption.
4. Bucket4j / rate limiting: confirm limits are per-IP or per-user, not global (global = one client blocks all others). Inspect `ApiRateLimitFilter`, `AuthRateLimitFilter`, and any cache/bucket managers.
5. IDOR audit: for EVERY controller endpoint with `{id}` in path across CRM (CrmAccessService), Documents, Billing, LMS, Chat, etc. Confirm ownership/role check exists, not just authentication. List all endpoints audited and identify any vulnerable ones.
6. Audit table triggers: confirm the immutability trigger (blocking UPDATE/DELETE on audit tables) is actually defined in Flyway migrations (e.g. V*.sql) and entity listeners.
7. 2FA (TOTP): check whether recovery codes / lost-device fallback exists. Flag as [INFO] only.

Output:
Write your full findings to `c:\Users\murat\IdeaProjects\JF-1C\.agents\security_auditor_1\security_audit.md`.
For each finding, provide:
- Severity: [CRITICAL] / [WARNING] / [INFO]
- Module name
- Confirmed root cause (not guessed) with exact file path and line number
- Proposed fix (no code applied)
- Affected files list
If a subcategory is secure/has no issue, explicitly note "No issue found" with the verified code location.
When complete, send a message to parent with summary and file path.
