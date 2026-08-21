# W2 Analysis: WebSocket Teardown Race Condition in ChatNotificationContext

## Executive Summary
This investigation analyzes the root causes of the WebSocket "closed before connection is established" warning/error, explores STOMP client state semantics in `@stomp/stompjs` v7.3.0, audits connection lifecycle handling in `ChatNotificationContext.tsx`, and details the exact implementation fix.

---

## 1. STOMP Client Lifecycle and State Exposure in `@stomp/stompjs` v7

### 1.1 State Properties & Getters
`@stomp/stompjs` (v7.3.0) exposes the following state properties and methods on the `Client` instance:

| Property / Method | Type | Description |
|---|---|---|
| `client.connected` | `boolean` (getter) | `true` only when the STOMP protocol handshake has completed and the `CONNECTED` frame is received. `false` during TCP/SockJS connection establishment, reconnection delay, disconnection, or deactivation. |
| `client.active` | `boolean` (getter) | `true` when `client.state === ActivationState.ACTIVE`. It becomes `true` immediately upon `client.activate()` and remains `true` through reconnect attempts until `client.deactivate()` is invoked. |
| `client.state` | `ActivationState` (enum) | Represents the activation phase: `ACTIVE` (0), `DEACTIVATING` (1), `INACTIVE` (2). |
| `client.beforeConnect` | `(client: Client) => void \| Promise<void>` | Lifecycle callback executed immediately before each connection or reconnection attempt. Used to dynamically update headers (e.g., fresh JWT token). |
| `client.activate()` | `void` | Transitions state to `ACTIVE` and initiates the connection sequence. If connection drops, automatically retries according to `reconnectDelay`. |
| `client.deactivate(options?: { force?: boolean })` | `Promise<void>` | Sets state to `DEACTIVATING`, clears reconnection timers, sends `DISCONNECT` frame (if connected), closes the underlying WebSocket, and transitions state to `INACTIVE`. Returns a Promise that resolves when the socket is fully closed. |
| `client.forceDisconnect()` | `void` | Forces closure of the active WebSocket without sending a `DISCONNECT` frame, but leaves `active = true`, causing STOMP to automatically schedule a reconnection attempt. |
| `client.webSocket` | `IStompSocket \| undefined` (getter) | The underlying WebSocket / SockJS instance. Exposes `readyState` (`CONNECTING` = 0, `OPEN` = 1, `CLOSING` = 2, `CLOSED` = 3). |

### 1.2 STOMP v7 Internal Teardown Mechanism
When `client.deactivate()` is called:
1. If `client.state === ActivationState.INACTIVE`, it resolves immediately.
2. State is set to `ActivationState.DEACTIVATING`.
3. Auto-reconnect timers (`_reconnector`) are cleared.
4. `_disposeStompHandler()` is called:
   - If `connected === true`, STOMP sends a `DISCONNECT` frame with a `receipt` header and waits for broker acknowledgement before closing the socket.
   - If `connected === false` (e.g. SockJS handshake is currently in flight, `readyState === CONNECTING`), `_stompHandler` calls `_closeWebsocket()`, which invokes `.close()` directly on the underlying socket.
5. In SockJS and browser WebSockets, calling `.close()` on a socket in the `CONNECTING` state aborts the HTTP handshake / TCP handshake and triggers an error event:
   `"WebSocket connection to '...' failed: WebSocket is closed before the connection is established."`
6. `onWebSocketError` callback is invoked with the error event before `onWebSocketClose` runs.

---

## 2. Audit of `ChatNotificationContext.tsx`

Current implementation (`src/features/chat/ChatNotificationContext.tsx`):

```tsx
useEffect(() => {
  if (user) {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    
    // Setup Stomp client
    const client = new Client({
      webSocketFactory: () => new SockJS(getWsEndpointUrl(), null, { withCredentials: true } as any),
      connectHeaders: getAccessToken() ? { 'Authorization': `Bearer ${getAccessToken()}` } : {},
      debug: (str) => {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onWebSocketError: (event) => {
        console.error('[STOMP NOTIF] WebSocket Error', event);
      },
      onStompError: (frame) => {
        console.error('[STOMP NOTIF] Broker reported error: ' + frame.headers['message']);
        console.error('[STOMP NOTIF] Additional details: ' + frame.body);
      },
      onConnect: () => {
        client.subscribe(`/topic/chat/${user.userId}`, (message) => {
          if (message.body) {
             const chatMessage = JSON.parse(message.body);
             if (chatMessage.receiverId === user.userId && !chatMessage.isRead) {
               fetchUnreadCount();
             }
          }
        });
      },
    });

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
  } else {
    setUnreadChatCount(0);
  }
}, [user]);
```

### Identified Root Causes & Failure Modes

#### Issue A: Teardown Race Condition on Unmount / Effect Re-run
- `useEffect` depends on `[user]`. The `user` object reference in `AuthContext` changes on operations like `setUser(next)`, `updateUser()`, or token refresh.
- When `user` reference changes or component unmounts quickly (e.g. React StrictMode or route navigation), React executes the cleanup function immediately.
- `client.deactivate()` is called while SockJS is still establishing its HTTP/WebSocket handshake (`isConnecting = true`, `client.connected = false`).
- SockJS aborts with `"WebSocket is closed before the connection is established"`, triggering `onWebSocketError` and logging console errors.

#### Issue B: Aggressive `visibilitychange` Reconnect Logic
- `handleVisibilityChange` checks `if (!client.connected)`.
- When a user switches tabs and returns, if the client is currently in the middle of connecting or in the middle of reconnect backoff, `client.connected` is `false`.
- Calling `client.forceDisconnect()` forces the connecting socket to close, producing another `"closed before connection is established"` error.
- Calling `setTimeout(() => client.activate(), 100)` when `client.active` is already `true` creates redundant connection attempts.

#### Issue C: Stale Auth Token on Background Reconnects
- `connectHeaders` is evaluated once as a static literal in the `Client` constructor options:
  `connectHeaders: getAccessToken() ? { 'Authorization': `Bearer ${getAccessToken()}` } : {}`
- When STOMP auto-reconnects in the background (e.g., after temporary network drop or token refresh via `http.ts`), `@stomp/stompjs` reuses the stale token passed at construction time.
- The server STOMP interceptor rejects the stale token with `401 / UNAUTHORIZED`.
- Missing `beforeConnect` callback to dynamically assign `client.connectHeaders` prior to each connection attempt.

#### Issue D: Missing Subscription JSON Parsing Guard
- In `onConnect`, `JSON.parse(message.body)` is executed without a try/catch block. Malformed broker messages could cause uncaught exceptions in the notification listener.

---

## 3. Formulated Fix Architecture

### 3.1 Key Fix Strategies
1. **`isMounted` and `isConnecting` Guards**:
   - Track component mount status via `let isMounted = true;` inside `useEffect`.
   - Track in-flight connection status via `let isConnecting = true;`.
   - In `onConnect`, `onWebSocketClose`, and `onWebSocketError`, set `isConnecting = false;`.
   - In `onConnect`, verify `if (!isMounted) { void client.deactivate(); return; }`.
   - In `onWebSocketError`, suppress logging if the error was due to teardown while unmounted.

2. **Safe Async Deactivation**:
   - In the effect cleanup, set `isMounted = false;`.
   - Check `if (client.active)`.
   - Call `client.deactivate().catch(() => {});` to safely handle the returned Promise.

3. **Dynamic Auth Token via `beforeConnect`**:
   - Add `beforeConnect: () => { const token = getAccessToken(); client.connectHeaders = token ? { Authorization: 'Bearer ' + token } : {}; }`.
   - Ensures any background auto-reconnect always carries the newest valid JWT access token.

4. **Refined `visibilitychange` Handler**:
   - Only trigger reconnect if the client is `!client.active` (call `activate()`) or if the socket is disconnected AND not actively in the middle of connecting (`!client.connected && !isConnecting`).

5. **Stabilize Hook Dependency**:
   - Depend on `[userId]` (e.g., `user?.userId`) rather than the full `user` object to avoid unnecessary teardown/reconnect cycles when non-ID fields change.

---

## 4. Other WebSocket Usages in Frontend
The exact same pattern should also be applied or mirrored across the other STOMP consumers:
- `src/pages/dashboard/client/ClientChatPage.tsx`
- `src/pages/dashboard/employee/EmployeeChatPage.tsx`
- `src/widgets/chat/ChatDrawer.tsx`

Each of these components currently contains similar `Client` instantiation and `visibilitychange` / `deactivate()` teardown patterns.
