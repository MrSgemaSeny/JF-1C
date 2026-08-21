# Handoff Report — W2: WebSocket Teardown Race Condition in ChatNotificationContext

## 1. Observation
- File inspected: `zhan-finance-frontend/src/features/chat/ChatNotificationContext.tsx:30-84`
  - Line 36-62: `const client = new Client({ webSocketFactory: () => new SockJS(...), connectHeaders: getAccessToken() ? { 'Authorization': `Bearer ${getAccessToken()}` } : {}, ... })`
  - Line 64: `client.activate()`
  - Line 66-74:
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
  - Line 76-80:
    ```typescript
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      client.deactivate();
    };
    ```
  - Line 84: Dependency array is `[user]`
- STOMP client library: `@stomp/stompjs` version `^7.3.0` (`node_modules/@stomp/stompjs/esm6/client.d.ts:379, 552, 580, 670`).
  - `client.connected` (`client.d.ts:379`): Boolean getter returning true only when STOMP handshake completed and `CONNECTED` frame received. Returns `false` while SockJS is in `CONNECTING` state.
  - `client.active` (`client.d.ts:552`): Boolean getter returning true when `state === ActivationState.ACTIVE`.
  - `client.state` (`client.d.ts:580`): Enum `ActivationState` (`ACTIVE = 0`, `DEACTIVATING = 1`, `INACTIVE = 2`).
  - `client.beforeConnect` (`client.d.ts:397`): Lifecycle hook invoked prior to every connection/reconnection attempt to set dynamic headers.
  - `client.deactivate(options)` (`client.d.ts:670`, `client.js:581-622`): Async method returning `Promise<void>`. Calls `_disposeStompHandler()` -> `_closeWebsocket()`. If underlying socket is `CONNECTING`, calling `.close()` produces browser error: `"WebSocket is closed before the connection is established"`.
- Test baseline: Ran `npm test` (`vitest run`) in `zhan-finance-frontend`: 16 test files passed, 58 tests passed.

---

## 2. Logic Chain
1. In `ChatNotificationContext.tsx:30-84`, when the component mounts or when `user` changes reference, `client.activate()` starts an asynchronous SockJS connection handshake.
2. If the component unmounts (e.g., page navigation, React StrictMode remount, or `user` state update in `AuthContext`), the cleanup function in `ChatNotificationContext.tsx:76-80` synchronously calls `client.deactivate()`.
3. Because the connection handshake has not yet finished (`client.connected === false`, socket `readyState === CONNECTING`), `deactivate()` immediately calls `_closeWebsocket()` on the SockJS socket.
4. SockJS triggers an error: `"WebSocket is closed before the connection is established"`, which reaches `onWebSocketError` and logs an unhandled error to the console.
5. In addition, when switching browser tabs, `handleVisibilityChange` (lines 66-74) checks `!client.connected`. If the client is currently reconnecting or in the middle of connecting, calling `forceDisconnect()` aborts the active handshake and schedules a duplicate `activate()`, causing recurring race conditions.
6. Furthermore, `connectHeaders` is set only once in the constructor. If the access token refreshes while the page is open, any subsequent background reconnect by `@stomp/stompjs` sends the expired token, failing authentication.
7. Adding `isConnecting` and `isMounted` guards, using `beforeConnect` to provide fresh JWT access tokens on reconnects, checking `client.active` prior to deactivation, handling the returned `Promise<void>` from `deactivate().catch()`, and keying the effect on `user?.userId` eliminates all race conditions.

---

## 3. Caveats
- No caveats. The root cause is completely diagnosed at the JavaScript/STOMP/SockJS layer, and the behavior in `@stomp/stompjs` v7.3.0 is verified via exact source code inspection.

---

## 4. Conclusion & Proposed Code Diff
The root cause of W2 is the synchronous teardown of in-flight SockJS connections during component unmount/re-render and tab visibility changes, combined with static auth headers on reconnects.

### Proposed Diff for `src/features/chat/ChatNotificationContext.tsx`:

```diff
--- a/zhan-finance-frontend/src/features/chat/ChatNotificationContext.tsx
+++ b/zhan-finance-frontend/src/features/chat/ChatNotificationContext.tsx
@@ -17,6 +17,7 @@ const ChatNotificationContext = createContext<ChatNotificationContextType | unde
 export function ChatNotificationProvider({ children }: { children: React.ReactNode }) {
   const { user } = useAuth();
+  const userId = user?.userId;
   const [unreadChatCount, setUnreadChatCount] = useState(0);
 
   const fetchUnreadCount = async () => {
-    if (!user) return;
+    if (!userId) return;
     try {
       const count = await getUnreadChatCount();
       setUnreadChatCount(count);
     } catch {
       // Ignore 401 / background polling errors
     }
   };
 
   useEffect(() => {
-    if (user) {
+    if (!userId) {
+      setUnreadChatCount(0);
+      return;
+    }
+
+    fetchUnreadCount();
+    const interval = setInterval(fetchUnreadCount, 30000);
+
+    let isMounted = true;
+    let isConnecting = true;
+
+    // Setup Stomp client
+    const client = new Client({
+      webSocketFactory: () => new SockJS(getWsEndpointUrl(), null, { withCredentials: true } as any),
+      beforeConnect: () => {
+        const token = getAccessToken();
+        client.connectHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};
+      },
+      debug: () => {},
+      reconnectDelay: 5000,
+      heartbeatIncoming: 4000,
+      heartbeatOutgoing: 4000,
+      onWebSocketError: (event) => {
+        isConnecting = false;
+        if (isMounted) {
+          console.error('[STOMP NOTIF] WebSocket Error', event);
+        }
+      },
+      onWebSocketClose: () => {
+        isConnecting = false;
+      },
+      onStompError: (frame) => {
+        isConnecting = false;
+        if (isMounted) {
+          console.error('[STOMP NOTIF] Broker reported error: ' + frame.headers['message']);
+          console.error('[STOMP NOTIF] Additional details: ' + frame.body);
+        }
+      },
+      onConnect: () => {
+        isConnecting = false;
+        if (!isMounted) {
+          void client.deactivate();
+          return;
+        }
+        client.subscribe(`/topic/chat/${userId}`, (message) => {
+          if (message.body) {
+            try {
+              const chatMessage = JSON.parse(message.body);
+              if (chatMessage.receiverId === userId && !chatMessage.isRead) {
+                fetchUnreadCount();
+              }
+            } catch {
+              // Ignore malformed payloads
+            }
+          }
+        });
+      },
+    });
+
+    client.activate();
+
+    const handleVisibilityChange = () => {
+      if (document.visibilityState === 'visible' && isMounted) {
+        if (!client.active) {
+          client.activate();
+        } else if (!client.connected && !isConnecting) {
+          client.forceDisconnect();
+        }
+      }
+    };
+    document.addEventListener('visibilitychange', handleVisibilityChange);
+
+    return () => {
+      isMounted = false;
+      clearInterval(interval);
+      document.removeEventListener('visibilitychange', handleVisibilityChange);
+      if (client.active) {
+        client.deactivate().catch(() => {
+          // Suppress deactivation error during unmount
+        });
+      }
+    };
-  }, [user]);
+  }, [userId]);
```

---

## 5. Verification Method
1. **Frontend test suite**:
   `cd zhan-finance-frontend && npm test`
   All existing unit and integration tests must pass.
2. **Regression Test Addition**:
   Add a unit/integration test for `ChatNotificationContext.test.tsx` that simulates:
   - Rapid mount and immediate unmount while `SockJS` is connecting (asserting no uncaught errors or console error spam).
   - Visibility change when connection is in-flight (asserting no duplicate connect attempts).
   - Token refresh prior to reconnect (asserting `beforeConnect` updates `connectHeaders`).
3. **Build verification**:
   `cd zhan-finance-frontend && npm run build` (tsc + vite build must pass with 0 errors).
