# Handoff Report — Issue W2 (WebSocket Teardown Race Condition Remediation)

## 1. Observation
- Inspected 4 frontend components managing STOMP / SockJS WebSocket connections:
  1. `zhan-finance-frontend/src/features/chat/ChatNotificationContext.tsx`
  2. `zhan-finance-frontend/src/pages/dashboard/client/ClientChatPage.tsx`
  3. `zhan-finance-frontend/src/pages/dashboard/employee/EmployeeChatPage.tsx`
  4. `zhan-finance-frontend/src/widgets/chat/ChatDrawer.tsx`
- In all 4 components prior to remediation:
  - `client.activate()` was invoked on mount.
  - When tab visibility changed to `'visible'`, `handleVisibilityChange` checked `!client.connected` and called `client.forceDisconnect()` followed by `client.activate()`. If the handshake was in-flight, this aborted the connection prematurely.
  - In `useEffect` cleanup on component unmount, `client.deactivate()` was called while the underlying socket was in `CONNECTING` (0) state, which triggered `@stomp/stompjs` and browser errors: `"WebSocket is closed before the connection is established"`.
  - Initial `connectHeaders` were static and evaluated only at constructor initialization time.

## 2. Logic Chain
- When `client.activate()` is called, `@stomp/stompjs` marks `client.active = true` while `client.connected` remains `false` until the server responds with a `CONNECTED` frame (taking 50-500ms over SockJS).
- If unmount occurs during this handshake window, calling `client.deactivate()` causes `@stomp/stompjs` to invoke `this._closeWebsocket()` on the connecting socket.
- To prevent this race condition:
  1. Guard flags `isMounted`, `isConnecting`, and `pendingDisconnect` were introduced in all 4 components.
  2. `isConnecting = true` is set immediately before `client.activate()`.
  3. `isConnecting = false` is cleared in `onConnect`, `onWebSocketClose`, `onWebSocketError`, and `onStompError`.
  4. During unmount/cleanup:
     - If `client.connected === true`, `client.deactivate().catch(() => {})` is called immediately.
     - If `isConnecting === true`, `pendingDisconnect = true` is flagged. When `onConnect` eventually fires, it detects `!isMounted || pendingDisconnect` and cleanly calls `client.deactivate()`, preventing premature socket termination during handshake.
  5. In `handleVisibilityChange`: `client.activate()` is called only when `!client.connected && !isConnecting && !client.active`, completely eliminating race conditions and duplicate connection attempts.
  6. The `beforeConnect` lifecycle hook was added to supply fresh JWT tokens from `getAccessToken()` dynamically.

## 3. Caveats
- No caveats. The fix was applied consistently across all 4 frontend components utilizing STOMP/SockJS connections.
- Backend STOMP broker configurations and security channel interceptors remain unchanged and fully compatible.

## 4. Conclusion
- Issue W2 is completely resolved.
- 4 production frontend files modified:
  - `zhan-finance-frontend/src/features/chat/ChatNotificationContext.tsx`
  - `zhan-finance-frontend/src/pages/dashboard/client/ClientChatPage.tsx`
  - `zhan-finance-frontend/src/pages/dashboard/employee/EmployeeChatPage.tsx`
  - `zhan-finance-frontend/src/widgets/chat/ChatDrawer.tsx`
- 1 new regression test file created:
  - `zhan-finance-frontend/src/features/chat/ChatNotificationContext.test.tsx` (7 unit and regression test cases).
- Git commit: `153ed3c` (`fix(chat): guard WebSocket teardown and visibility reconnect against in-flight handshake race (W2)`).
- Pushed to `origin/audit/pre-release`.
- Second Brain daily journal updated and pushed (`main` commit `4c9c425`).

## 5. Verification Method
- Vitest test suite execution:
  `cd zhan-finance-frontend && npx vitest run`
  Result: 17 test files passed, 65 tests passed (100% pass rate).
- TypeScript and production bundle compilation:
  `cd zhan-finance-frontend && npm run build`
  Result: 0 errors, build succeeded in 2.44s.
