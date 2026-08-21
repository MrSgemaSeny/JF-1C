# Handoff: W2 WebSocket Teardown Race Condition Investigation

## 1. Observation
1. **Frontend Test Suite Baseline**:
   - Running `npx vitest run` in `zhan-finance-frontend` passed 16 test files, 58 tests in 14.68s (Vitest v4.1.10, jsdom environment).
   - Existing tests cover Auth, UI components, HTTP client, and Kanban widgets, but there were no tests covering WebSocket lifecycle or `ChatNotificationContext`.

2. **ChatNotificationContext Implementation**:
   - File: `zhan-finance-frontend/src/features/chat/ChatNotificationContext.tsx:30-84`
   - Line 64: `client.activate()` initiates asynchronous connection handshake via SockJS/STOMP.
   - Lines 66-73:
     ```typescript
     const handleVisibilityChange = () => {
       if (document.visibilityState === 'visible') {
         if (!client.connected) {
           client.forceDisconnect();
           setTimeout(() => client.activate(), 100);
         }
       }
     };
     ```
   - Lines 76-80:
     ```typescript
     return () => {
       clearInterval(interval);
       document.removeEventListener('visibilitychange', handleVisibilityChange);
       client.deactivate();
     };
     ```

3. **STOMP / SockJS Behavior**:
   - In `@stomp/stompjs` (`node_modules/@stomp/stompjs/esm6/client.js:581` and `esm6/stomp-handler.js:292-297`):
     Calling `client.deactivate()` while `client.connected === false` and socket `readyState === StompSocketState.CONNECTING` invokes `this._closeWebsocket()`.
   - In `sockjs-client` and standard browser WebSockets:
     Closing a socket in state `CONNECTING` (0) logs `WebSocket is closed before the connection is established` and triggers `onWebSocketError` (`console.error('[STOMP NOTIF] WebSocket Error', event)`).

4. **Other Components with the Same Pattern**:
   - `zhan-finance-frontend/src/widgets/chat/ChatDrawer.tsx:63-118`
   - `zhan-finance-frontend/src/pages/dashboard/client/ClientChatPage.tsx:95-172`
   - `zhan-finance-frontend/src/pages/dashboard/employee/EmployeeChatPage.tsx:95-172`

---

## 2. Logic Chain
1. When `ChatNotificationProvider` mounts with an authenticated user, `client.activate()` is called immediately.
2. In React 19 / fast navigation / logout scenarios, the component unmounts while the SockJS handshake is still in-flight (`isConnecting === true`, `client.connected === false`, `readyState === 0`).
3. The unmount cleanup unconditionally calls `client.deactivate()`, which forces `this._closeWebsocket()` on the connecting socket.
4. SockJS/browser triggers the error "WebSocket is closed before the connection is established", invoking `onWebSocketError` and polluting error trackers/console.
5. Similarly, during `visibilitychange`, `if (!client.connected)` evaluates to true if the client is still in handshake, causing `forceDisconnect()` to abort in-flight connections and start duplicate connection attempts.
6. Solution: Introduce `isConnecting` and `isMounted` guard flags.
   - `beforeConnect` marks `isConnecting = true`.
   - `onConnect`, `onWebSocketError`, `onWebSocketClose`, `onStompError` clear `isConnecting = false`.
   - `handleVisibilityChange` checks `!client.connected && !isConnecting && !client.active` before activating.
   - Cleanup marks `isMounted = false` and only calls `client.deactivate()` if `client.connected` or `!isConnecting`. If `isConnecting` is true, `onConnect` / `onWebSocketClose` safely deactivates upon handshake resolution without race conditions.

---

## 3. Caveats
1. No source code modifications were performed during this task (read-only investigation per protocol).
2. The primary focus of W2 is `ChatNotificationContext.tsx`, but `ChatDrawer.tsx`, `ClientChatPage.tsx`, and `EmployeeChatPage.tsx` share the same pattern and should adopt identical lifecycle guards during implementation.
3. In Vitest/jsdom, WebSockets and SockJS are mocked because native WebSocket server connection is not available in unit test runners.

---

## 4. Conclusion
The root cause of W2 is confirmed: premature invocation of `deactivate()` and `forceDisconnect()` during in-flight SockJS/STOMP connection handshakes.
A robust fix pattern using `isConnecting` + `isMounted` guard flags resolves the issue cleanly.
A comprehensive regression test suite (`ChatNotificationContext.test.tsx`) has been designed with 5 specific test cases covering:
1. Normal connect and teardown lifecycle.
2. Rapid unmount during in-flight handshake (W2 regression test).
3. Visibility change during in-flight connection (no duplicate activation or force disconnect).
4. Visibility change after dropped connection (successful re-activation).
5. WebSocket error during connection (graceful error handling without crashes).

---

## 5. Verification Method
1. Place the test file at `zhan-finance-frontend/src/features/chat/ChatNotificationContext.test.tsx`.
2. Apply the guard fix in `zhan-finance-frontend/src/features/chat/ChatNotificationContext.tsx`.
3. Run the Vitest test runner:
   ```bash
   cd zhan-finance-frontend
   npx vitest run
   ```
4. Verify all tests pass: 17 test files, 63 tests, 0 failures.
5. Run frontend build to verify TypeScript compilation:
   ```bash
   npm run build
   ```
