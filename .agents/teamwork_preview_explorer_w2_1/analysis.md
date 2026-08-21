# W2 Investigation: WebSocket Teardown Race Condition in JF-1C

## 1. Executive Summary

The error `"WebSocket connection to '...' failed: WebSocket is closed before the connection is established"` is caused by two concurrent issues in the frontend STOMP/SockJS lifecycle:
1. **Unmount during handshake**: When a component unmounts or a user navigates away while a SockJS/STOMP connection handshake is in progress (`readyState === 0` / `CONNECTING`), the React `useEffect` cleanup hook immediately triggers `client.deactivate()`. In `@stomp/stompjs`, `deactivate()` calls `_webSocket.close()` on the connecting socket, causing the browser and SockJS to abort the handshake and log a transport failure.
2. **Visibility change trigger during connection**: The `handleVisibilityChange` handler present in four different components checks `if (!client.connected)` on `visibilitychange` (`document.visibilityState === 'visible'`) and immediately calls `client.forceDisconnect()`. If the user focuses the tab or navigates while a connection is still connecting, `forceDisconnect()` aborts the active handshake.

Four files in the frontend codebase share this identical pattern.

---

## 2. Affected Frontend Files

| File Path | Component / Context | Line Numbers |
|---|---|---|
| `src/features/chat/ChatNotificationContext.tsx` | `ChatNotificationProvider` | Lines 30-84 |
| `src/pages/dashboard/client/ClientChatPage.tsx` | `ClientChatPage` | Lines 92-173 |
| `src/pages/dashboard/employee/EmployeeChatPage.tsx` | `EmployeeChatPage` | Lines 98-183 |
| `src/widgets/chat/ChatDrawer.tsx` | `ChatDrawer` | Lines 58-119 |

---

## 3. Detailed Lifecycle and Call-Chain Analysis

### 3.1 Connection Instantiation & Activation
In each affected component:
```typescript
const client = new Client({
  webSocketFactory: () => new SockJS(getWsEndpointUrl(), null, { withCredentials: true } as any),
  connectHeaders: getAccessToken() ? { 'Authorization': `Bearer ${getAccessToken()}` } : {},
  reconnectDelay: 5000,
  heartbeatIncoming: 4000,
  heartbeatOutgoing: 4000,
  onConnect: () => { ... },
  onWebSocketError: (event) => { console.error('[STOMP] WebSocket Error', event); },
  onStompError: (frame) => { console.error('[STOMP] Broker reported error', frame); }
});

client.activate();
```

When `client.activate()` is called:
1. `@stomp/stompjs` transitions state to `ActivationState.ACTIVE` (`client.active === true`, but `client.connected === false`).
2. `webSocketFactory()` is invoked, returning a new `SockJS` instance.
3. SockJS begins its asynchronous connection handshake:
   - Step 1: HTTP GET to `/api/ws/info` (info check).
   - Step 2: Transport selection (WebSocket or XHR streaming).
   - Step 3: WebSocket TCP connection and HTTP upgrade handshake.
   - Step 4: STOMP `CONNECT` frame transmission and server `CONNECTED` frame response.
4. Total duration of this handshake window: between 50ms and 500ms depending on network latency.

### 3.2 Cleanup on Component Unmount / Navigation
When the user switches routes (e.g. from `/dashboard/chat` to `/dashboard/tasks`, or upon logout, or when closing `ChatDrawer`):
1. React unmounts the component and executes the cleanup function returned by `useEffect`:
   ```typescript
   return () => {
     clearInterval(interval);
     document.removeEventListener('visibilitychange', handleVisibilityChange);
     client.deactivate();
   };
   ```
2. Inside `@stomp/stompjs` (`node_modules/@stomp/stompjs/esm6/client.js:581-622`):
   ```javascript
   async deactivate(options = {}) {
     const needToDispose = this.active;
     ...
     this._changeState(ActivationState.DEACTIVATING);
     ...
     if (needToDispose) {
       this._disposeStompHandler();
     }
   }
   ```
3. Inside `StompHandler.dispose()` (`node_modules/@stomp/stompjs/esm6/stomp-handler.js:273-298`):
   ```javascript
   dispose() {
     if (this.connected) {
       // Graceful DISCONNECT frame
       this.watchForReceipt(disconnectHeaders.receipt, frame => { ... });
       this._transmit({ command: 'DISCONNECT', headers: disconnectHeaders });
     } else {
       // Connection is not established yet!
       if (this._webSocket.readyState === StompSocketState.CONNECTING ||
           this._webSocket.readyState === StompSocketState.OPEN) {
         this._closeWebsocket(); // invokes this._webSocket.close()!
       }
     }
   }
   ```
4. Calling `_webSocket.close()` while `readyState === CONNECTING` (0):
   - The browser and SockJS treat closing during handshake as an abnormal abort.
   - Browser console logs: `WebSocket connection to 'ws://.../websocket' failed: WebSocket is closed before the connection is established.`
   - SockJS triggers its `onerror` and `onclose` handlers with code 1006.
   - `client.onWebSocketError` fires, logging `[STOMP] WebSocket Error` in application logs.

### 3.3 Flawed Visibility Change Handler
In all four components, the visibility listener contains:
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
Whenever the browser tab gains focus or becomes visible:
- If a connection attempt is actively in progress or reconnecting, `client.connected` is `false`.
- `client.forceDisconnect()` is immediately invoked, terminating the in-flight socket before connection completion.
- This creates an artificial race condition every time the user tabs away and back quickly.

---

## 4. Root Cause Confirmation

The problem is entirely client-side lifecycle management:
1. Lack of connection state guarding (`isConnecting` / `isMounted` flag).
2. Direct invocation of `deactivate()` while handshake is in-flight without waiting for connection resolution or handling unmount state gracefully in `onConnect`.
3. Inappropriate `forceDisconnect()` in `handleVisibilityChange` when the client is already connecting or active.

---

## 5. Proposed Remediation Design

For each affected component (`ChatNotificationContext.tsx`, `ClientChatPage.tsx`, `EmployeeChatPage.tsx`, `ChatDrawer.tsx`):

### 5.1 Guard Pattern with Lifecycle Awareness
```typescript
useEffect(() => {
  let isMounted = true;
  let isConnecting = true;
  let stompClient: Client | null = null;

  if (user) {
    stompClient = new Client({
      webSocketFactory: () => new SockJS(getWsEndpointUrl(), null, { withCredentials: true } as any),
      connectHeaders: getAccessToken() ? { 'Authorization': `Bearer ${getAccessToken()}` } : {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        isConnecting = false;
        if (!isMounted) {
          stompClient?.deactivate();
          return;
        }
        // Subscriptions...
      },
      onWebSocketClose: () => {
        isConnecting = false;
      },
      onWebSocketError: (event) => {
        isConnecting = false;
        if (isMounted) {
          console.error('[STOMP] WebSocket Error', event);
        }
      },
      onStompError: (frame) => {
        isConnecting = false;
        console.error('[STOMP] Broker reported error: ' + frame.headers['message']);
      }
    });

    stompClient.activate();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMounted) {
        // Only reactivate if client is completely inactive and not connecting
        if (stompClient && !stompClient.active && !isConnecting) {
          stompClient.activate();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (stompClient) {
        if (stompClient.connected) {
          stompClient.deactivate();
        } else if (!isConnecting) {
          stompClient.deactivate();
        }
        // If isConnecting is true, the onConnect callback will detect !isMounted and cleanly deactivate
      }
    };
  }
}, [user]);
```

---

## 6. Implementation and Regression Testing Strategy

1. **Target Files**:
   - `src/features/chat/ChatNotificationContext.tsx`
   - `src/pages/dashboard/client/ClientChatPage.tsx`
   - `src/pages/dashboard/employee/EmployeeChatPage.tsx`
   - `src/widgets/chat/ChatDrawer.tsx`
2. **Regression Test**:
   - Create `src/features/chat/ChatNotificationContext.test.tsx` using Vitest + React Testing Library.
   - Mock `@stomp/stompjs` Client and SockJS to simulate delayed handshake and immediate unmount.
   - Verify that unmounting before `onConnect` triggers deactivation cleanly without calling `forceDisconnect()` or throwing unhandled errors.
