# Handoff Report - W2 WebSocket Teardown Race Condition

## 1. Observation

Direct code examination of frontend WebSocket / STOMP usage revealed 4 files instantiating `@stomp/stompjs` `Client`:
1. `zhan-finance-frontend/src/features/chat/ChatNotificationContext.tsx:36-84`
2. `zhan-finance-frontend/src/pages/dashboard/client/ClientChatPage.tsx:93-173`
3. `zhan-finance-frontend/src/pages/dashboard/employee/EmployeeChatPage.tsx:99-183`
4. `zhan-finance-frontend/src/widgets/chat/ChatDrawer.tsx:59-119`

Key verbatim patterns observed:
- In `ChatNotificationContext.tsx:64-80`:
  ```typescript
  client.activate();

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      if (!client.connected) {
        client.forceDisconnect();
        setTimeout(() => client.activate(), 100);
      }
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    clearInterval(interval);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    client.deactivate();
  };
  ```
- In `@stomp/stompjs` v7.3.0 (`node_modules/@stomp/stompjs/esm6/stomp-handler.js:292-297`):
  ```javascript
  else {
      if (this._webSocket.readyState === StompSocketState.CONNECTING ||
          this._webSocket.readyState === StompSocketState.OPEN) {
          this._closeWebsocket();
      }
  }
  ```

---

## 2. Logic Chain

1. When `client.activate()` is called, `@stomp/stompjs` sets `client.active = true` while `client.connected` remains `false` until the server responds with a STOMP `CONNECTED` frame.
2. The underlying `SockJS` connection requires 50-500ms to complete HTTP info fetching, transport negotiation, and STOMP handshake.
3. If a component unmounts (e.g. page navigation, logout, drawer closing) during this 50-500ms window, the React cleanup hook runs `client.deactivate()`.
4. Because `client.connected` is `false`, `@stomp/stompjs` invokes `StompHandler.dispose()` which directly executes `this._webSocket.close()` while `this._webSocket.readyState === CONNECTING` (0).
5. Calling `.close()` on a connecting socket causes SockJS / browser WebSocket to abort the handshake abnormally, emitting the browser error: `"WebSocket connection to '...' failed: WebSocket is closed before the connection is established"`.
6. Furthermore, `handleVisibilityChange` checks `!client.connected` and executes `client.forceDisconnect()` whenever the tab gains visibility during an in-flight connection or reconnect, causing identical premature socket terminations.

---

## 3. Caveats

- **Scope boundary**: This investigation focused exclusively on the client-side lifecycle race condition in the React frontend. Backend `WebSocketConfig.java` was reviewed and found compliant (standard Spring STOMP endpoint at `/ws` and `/api/ws` with JWT validation in `ChannelInterceptor`).
- **No code modification performed**: In accordance with the Explorer role and Phase 2 Governance, this investigation is strictly read-only.

---

## 4. Conclusion

- The root cause of the "closed before connection is established" warning is verified as a client-side teardown race condition occurring in 4 frontend components (`ChatNotificationContext.tsx`, `ClientChatPage.tsx`, `EmployeeChatPage.tsx`, `ChatDrawer.tsx`).
- The remediation requires:
  1. Adding an `isConnecting` and `isMounted` guard flag to each STOMP lifecycle hook.
  2. Checking `client.connected` prior to immediate deactivation, and deferring deactivation to `onConnect` if unmount occurs while `isConnecting` is true.
  3. Removing the aggressive `forceDisconnect()` in `handleVisibilityChange` and replacing it with an inactivity check (`!client.active && !isConnecting`).
  4. Creating a unit test suite (`ChatNotificationContext.test.tsx`) in Vitest.

---

## 5. Verification Method

To independently verify:
1. View the source files:
   - `zhan-finance-frontend/src/features/chat/ChatNotificationContext.tsx:36-84`
   - `zhan-finance-frontend/src/pages/dashboard/client/ClientChatPage.tsx:93-173`
   - `zhan-finance-frontend/src/pages/dashboard/employee/EmployeeChatPage.tsx:99-183`
   - `zhan-finance-frontend/src/widgets/chat/ChatDrawer.tsx:59-119`
2. Run test command in `zhan-finance-frontend`:
   `npm test`
   Confirm 16 test files pass.
