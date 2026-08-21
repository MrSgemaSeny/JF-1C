## 2026-08-21T07:51:30Z
You are Worker 1 implementing the remediation for issue C5 (Missing @Transactional on 6 methods) in Phase 2 of JF-1C.

MANDATORY: Read ORIGINAL_REQUEST.md at `c:\Users\murat\IdeaProjects\JF-1C\.agents\ORIGINAL_REQUEST.md` before starting work.
Also read:
- Remediation Plan: `C:\Users\murat\Downloads\jf1c-phase2-remediation-plan.md`
- Audit Report: `c:\Users\murat\IdeaProjects\JF-1C\.agents\audit_report.md`
- Explorer handoff reports:
  - `c:\Users\murat\IdeaProjects\JF-1C\.agents\teamwork_preview_explorer_c5_1\handoff.md`
  - `c:\Users\murat\IdeaProjects\JF-1C\.agents\teamwork_preview_explorer_c5_2\handoff.md`
  - `c:\Users\murat\IdeaProjects\JF-1C\.agents\teamwork_preview_explorer_c5_3\handoff.md`

Your working directory: `c:\Users\murat\IdeaProjects\JF-1C\.agents\teamwork_preview_worker_c5_1`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Autonomous Commit Authorization:
You are authorized to execute git add, git commit, and git push on branch `audit/pre-release` (NEVER commit to main) after tests pass.
Also update the Second Brain journal at `C:\Users\murat\IdeaProjects\new_world\Brain's protocol - second brain\journal\2026-08-21\jf-1c.md`.

File ownership & scope:
- `src/main/java/com/example/zhanfinancebackend/modules/admin/service/AdminService.java`
- `src/main/java/com/example/zhanfinancebackend/modules/crm/service/TaskService.java` (verify @Transactional on requestTask)
- `src/test/java/com/example/zhanfinancebackend/modules/admin/service/AdminServiceTest.java` (or new test file)
- DO NOT touch `fly.toml`, GitHub Actions workflows, `build.gradle`, `Dockerfile`.
- DO NOT touch Flyway migrations V1-V110.

Instructions:
1. In `AdminService.java`, add `@Transactional` (from `org.springframework.transaction.annotation.Transactional`) to the 5 mutating methods:
   - `demoteToEmployee(Long userId)`
   - `toggleUserStatus(Long userId)`
   - `approveEmployee(Long id)`
   - `rejectEmployee(Long id)`
   - `createLearner(RegisterRequest request)`
   (Verify that `promoteToAdvisor` already has `@Transactional`, and check that `TaskService.requestTask` already has `@Transactional`).
2. Add regression tests in `AdminServiceTest.java` verifying that:
   - All mutation methods (`demoteToEmployee`, `toggleUserStatus`, `approveEmployee`, `rejectEmployee`, `createLearner`, `promoteToAdvisor`) are annotated with `@Transactional`.
   - Behavioral tests confirming mutations and audit/token revocations work properly.
3. Run `./gradlew test --tests "com.example.zhanfinancebackend.modules.admin.service.AdminServiceTest"` and `./gradlew test` to ensure all tests pass (0 failures).
4. Run `git add` and `git commit -m "fix(admin): add missing @Transactional to AdminService mutation methods (C5)"` with descriptive explanation of why `@Transactional` is required for audit event listener and rollback atomicity.
5. Push commit to `audit/pre-release` via `git push origin audit/pre-release`.
6. Update Second Brain daily journal at `C:\Users\murat\IdeaProjects\new_world\Brain's protocol - second brain\journal\2026-08-21\jf-1c.md`.
7. Output your diff, test output, commit hash, and handoff report to `handoff.md`. Send a message to parent when done. Strict rule: NO EMOJIS anywhere.
