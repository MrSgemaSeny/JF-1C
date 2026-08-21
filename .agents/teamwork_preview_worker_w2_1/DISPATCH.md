## 2026-08-21T10:01:19Z

You are Worker 1 implementing the remediation for issue W2 (WebSocket teardown race condition) in Phase 2 of JF-1C.

MANDATORY: Read ORIGINAL_REQUEST.md at `c:\Users\murat\IdeaProjects\JF-1C\.agents\ORIGINAL_REQUEST.md` before starting work.
Also read:
- Remediation Plan: `C:\Users\murat\Downloads\jf1c-phase2-remediation-plan.md`
- Audit Report: `c:\Users\murat\IdeaProjects\JF-1C\.agents\audit_report.md`
- Explorer handoff reports:
  - `c:\Users\murat\IdeaProjects\JF-1C\.agents\teamwork_preview_explorer_w2_1\handoff.md`
  - `c:\Users\murat\IdeaProjects\JF-1C\.agents\teamwork_preview_explorer_w2_2\handoff.md`
  - `c:\Users\murat\IdeaProjects\JF-1C\.agents\teamwork_preview_explorer_w2_3\handoff.md`

Your working directory: `c:\Users\murat\IdeaProjects\JF-1C\.agents\teamwork_preview_worker_w2_1`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Autonomous Commit Authorization:
You are authorized to execute git add, git commit, and git push on branch `audit/pre-release` (NEVER commit to main) after tests pass.
Also update the Second Brain journal at `C:\Users\murat\IdeaProjects\new_world\Brain's protocol - second brain\journal\2026-08-21\jf-1c.md`.

File ownership & scope:
- `zhan-finance-frontend/src/features/chat/ChatNotificationContext.tsx`
- `zhan-finance-frontend/src/pages/dashboard/client/ClientChatPage.tsx`
- `zhan-finance-frontend/src/pages/dashboard/employee/EmployeeChatPage.tsx`
- `zhan-finance-frontend/src/widgets/chat/ChatDrawer.tsx`
- `zhan-finance-frontend/src/features/chat/ChatNotificationContext.test.tsx` (new test)
- DO NOT touch `fly.toml`, GitHub Actions workflows, `build.gradle`, `Dockerfile`.

Instructions:
1. In `ChatNotificationContext.tsx` (and `ClientChatPage.tsx`, `EmployeeChatPage.tsx`, `ChatDrawer.tsx`):
   - Add `isConnecting` / `isMounted` guard flags.
   - Set `isConnecting = true` before `client.activate()`.
   - Clear `isConnecting = false` in `onConnect` and `onWebSocketClose` / `onStompError`.
   - In cleanup / unmount: check `if (client.connected)` before calling `client.deactivate()`. If `isConnecting` is true, mark a pending disconnect flag so that when `onConnect` fires, it immediately and safely deactivates without throwing errors during handshake.
   - In `handleVisibilityChange`: do NOT call `forceDisconnect()` or re-activate if `isConnecting` is true or `client.connected` is already true.
2. Create comprehensive regression tests in `zhan-finance-frontend/src/features/chat/ChatNotificationContext.test.tsx` verifying:
   - Rapid mount/unmount during handshake does not trigger premature deactivation or errors.
   - Visibility changes during in-flight handshakes do not cause race conditions.
   - Normal connect, message subscription, and teardown work cleanly.
3. Run `npm test` or `npx vitest run` in `zhan-finance-frontend` to ensure 100% tests pass.
4. Run `git add` and `git commit -m "fix(chat): guard WebSocket teardown and visibility reconnect against in-flight handshake race (W2)"` with descriptive reason.
5. Push commit to `audit/pre-release` via `git push origin audit/pre-release`.
6. Update Second Brain daily journal at `C:\Users\murat\IdeaProjects\new_world\Brain's protocol - second brain\journal\2026-08-21\jf-1c.md` and push.
7. Output your handoff report to `handoff.md`. Send a message to parent when done. Strict rule: NO EMOJIS anywhere.
