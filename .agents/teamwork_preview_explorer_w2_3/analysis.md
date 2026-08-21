# Analysis: W2 WebSocket Teardown Race Condition

## 1. Executive Summary
Issue W2 is a client-side race condition in `zhan-finance-frontend` where component unmount (e.g., fast route navigation, React 19 StrictMode double-mounting, or user state changes) or browser `visibilitychange` events invoke `client.deactivate()` or `client.forceDisconnect()` while a SockJS/STOMP connection handshake is actively in-flight (`CONNECTING` state / readyState 0).
Calling `deactivate()` or `forceDisconnect()` during the handshake forces the underlying SockJS/WebSocket transport to close prematurely, triggering the browser error `WebSocket is closed before the connection is established` and firing `onWebSocketError` / `[STOMP NOTIF] WebSocket Error`.

Additionally, the `visibilitychange` event handler in `ChatNotificationContext.tsx` checked only `if (!client.connected)` without checking whether a connection attempt was already in-flight (`isConnecting` or `client.active`), causing it to abort in-flight handshakes and trigger duplicate activations.

---

## 2. Codebase Investigation & Root Cause Analysis

### 2.1 File Under Investigation
- Path: `zhan-finance-frontend/src/features/chat/ChatNotificationContext.tsx`
- Affected lines: 30-84

### 2.2 Mechanism Breakdown
In `@stomp/stompjs` (v7.3.0) and `sockjs-client` (v1.6.1):
1. When `client.activate()` is called, `@stomp/stompjs` transitions internal state to `ACTIVE` and invokes `webSocketFactory()`. SockJS initializes an asynchronous HTTP handshake/negotiation (`readyState === 0 / CONNECTING`).
2. At this point:
   - `client.active` is `true`.
   - `client.connected` is `false` (until the STOMP `CONNECTED` frame arrives and `onConnect` executes).
3. If the React component unmounts quickly (e.g., fast user navigation or React StrictMode lifecycle):
   - The `useEffect` cleanup function executes:
     ```typescript
     return () => {
       clearInterval(interval);
       document.removeEventListener('visibilitychange', handleVisibilityChange);
       client.deactivate();
     };
     ```
   - Inside `@stomp/stompjs` `Client.deactivate()` (`esm6/client.js:581` and `esm6/stomp-handler.js:292`):
     Because `connected` is `false` but `this.webSocket.readyState === StompSocketState.CONNECTING`, `@stomp/stompjs` calls `this._closeWebsocket()`.
   - SockJS / browser WebSocket receives a `.close()` call during state `CONNECTING` (0), producing the console error/warning:
     `WebSocket is closed before the connection is established.`
   - SockJS emits an error/close event, invoking `onWebSocketError: (event) => console.error('[STOMP NOTIF] WebSocket Error', event)`.

4. In the `visibilitychange` listener:
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
   If a user switches tabs or focuses the window while the connection handshake is still in progress, `!client.connected` evaluates to `true`. This causes `client.forceDisconnect()` to abort the in-flight handshake and trigger a redundant connection attempt, causing repeated connection churn and error logs.

### 2.3 Other Affected Components
The same pattern (`new Client(...)`, immediate `activate()`, unguarded `handleVisibilityChange`, and direct `deactivate()` in cleanup) also exists in:
- `zhan-finance-frontend/src/widgets/chat/ChatDrawer.tsx` (lines 63-118)
- `zhan-finance-frontend/src/pages/dashboard/client/ClientChatPage.tsx` (lines 95-172)
- `zhan-finance-frontend/src/pages/dashboard/employee/EmployeeChatPage.tsx` (lines 95-172)

Remediating `ChatNotificationContext.tsx` serves as the primary fix and blueprint for consistent WebSocket lifecycle management across the application.

---

## 3. Proposed Remediation for ChatNotificationContext.tsx

### 3.1 Solution Strategy
1. **Guard flags**:
   - `let isMounted = true;` (tracks component mount lifecycle).
   - `let isConnecting = false;` (tracks in-flight handshake state).
2. **Lifecycle callbacks**:
   - `beforeConnect`: set `isConnecting = true`.
   - `onConnect`: set `isConnecting = false`. If `!isMounted`, immediately call `client.deactivate()` safely (as the socket is now connected). If `isMounted`, subscribe to `/topic/chat/{userId}`.
   - `onWebSocketClose` / `onWebSocketError` / `onStompError`: set `isConnecting = false`. Only log errors if `isMounted`.
3. **Visibility change**:
   - Only activate if `!client.connected && !isConnecting && !client.active`.
4. **Cleanup**:
   - Set `isMounted = false`.
   - If `client.connected`: call `client.deactivate()`.
   - If `!isConnecting`: call `client.deactivate()`.
   - If `isConnecting`: do not call premature `deactivate()` on the connecting socket; `onConnect` / `onWebSocketClose` will gracefully finalize teardown without triggering browser abort errors.

### 3.2 Proposed Code Replacement for `ChatNotificationContext.tsx`
```tsx
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      
      let isMounted = true;
      let isConnecting = false;

      // Setup Stomp client
      const client = new Client({
        webSocketFactory: () => new SockJS(getWsEndpointUrl(), null, { withCredentials: true } as any),
        connectHeaders: getAccessToken() ? { 'Authorization': `Bearer ${getAccessToken()}` } : {},
        debug: (str) => {
          // console.log('[STOMP NOTIF]', str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        beforeConnect: () => {
          isConnecting = true;
        },
        onWebSocketError: (event) => {
          isConnecting = false;
          if (isMounted) {
            console.error('[STOMP NOTIF] WebSocket Error', event);
          }
        },
        onWebSocketClose: () => {
          isConnecting = false;
        },
        onStompError: (frame) => {
          isConnecting = false;
          if (isMounted) {
            console.error('[STOMP NOTIF] Broker reported error: ' + frame.headers['message']);
            console.error('[STOMP NOTIF] Additional details: ' + frame.body);
          }
        },
        onConnect: () => {
          isConnecting = false;
          if (!isMounted) {
            client.deactivate();
            return;
          }
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

      isConnecting = true;
      client.activate();

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          if (!client.connected && !isConnecting && !client.active) {
            client.activate();
          }
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        isMounted = false;
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        if (client.connected || !isConnecting) {
          client.deactivate();
        }
      };
    } else {
      setUnreadChatCount(0);
    }
  }, [user]);
```

---

## 4. Regression Test Suite Specification

### 4.1 Target Test File
- Path: `zhan-finance-frontend/src/features/chat/ChatNotificationContext.test.tsx`
- Framework: Vitest 4.1.10, `@testing-library/react` 16.3.2, `jsdom`

### 4.2 Test Implementation Design
```tsx
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ChatNotificationProvider, useChatNotifications } from './ChatNotificationContext';
import * as chatApi from '@/entities/chat/api/chatApi';
import * as authContext from '@/features/auth/AuthContext';

vi.mock('@/entities/chat/api/chatApi', () => ({
  getUnreadChatCount: vi.fn(),
}));

vi.mock('@/shared/api/http', () => ({
  getWsEndpointUrl: vi.fn(() => 'http://localhost:8080/ws'),
  getAccessToken: vi.fn(() => 'test-access-token'),
}));

vi.mock('sockjs-client', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      close: vi.fn(),
    })),
  };
});

let mockClientInstances: any[] = [];

vi.mock('@stomp/stompjs', () => {
  return {
    Client: vi.fn().mockImplementation((config: any) => {
      const instance = {
        config,
        connected: false,
        active: false,
        activate: vi.fn().mockImplementation(function (this: any) {
          this.active = true;
          if (config.beforeConnect) {
            config.beforeConnect();
          }
        }),
        deactivate: vi.fn().mockImplementation(function (this: any) {
          this.active = false;
          this.connected = false;
          return Promise.resolve();
        }),
        forceDisconnect: vi.fn().mockImplementation(function (this: any) {
          this.connected = false;
        }),
        subscribe: vi.fn().mockReturnValue({
          unsubscribe: vi.fn(),
        }),
        __simulateConnect: function (this: any) {
          this.connected = true;
          if (config.onConnect) {
            config.onConnect({});
          }
        },
        __simulateError: function (this: any, error: any) {
          this.connected = false;
          if (config.onWebSocketError) {
            config.onWebSocketError(error);
          }
        },
        __simulateClose: function (this: any) {
          this.connected = false;
          if (config.onWebSocketClose) {
            config.onWebSocketClose({});
          }
        },
      };
      mockClientInstances.push(instance);
      return instance;
    }),
  };
});

const ConsumerComponent = () => {
  const { unreadChatCount } = useChatNotifications();
  return <div>Unread: {unreadChatCount}</div>;
};

describe('ChatNotificationContext - W2 WebSocket Teardown Regression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClientInstances = [];
    vi.mocked(chatApi.getUnreadChatCount).mockResolvedValue(5);
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: { userId: 101, email: 'client@zhanfinance.kz', role: 'CLIENT' } as any,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      googleLogin: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('connects and subscribes when user is authenticated, and deactivates on normal unmount', async () => {
    const { unmount } = render(
      <ChatNotificationProvider>
        <ConsumerComponent />
      </ChatNotificationProvider>
    );

    expect(mockClientInstances.length).toBe(1);
    const client = mockClientInstances[0];
    expect(client.activate).toHaveBeenCalledTimes(1);

    act(() => {
      client.__simulateConnect();
    });

    expect(client.subscribe).toHaveBeenCalledWith(
      '/topic/chat/101',
      expect.any(Function)
    );

    unmount();
    expect(client.deactivate).toHaveBeenCalledTimes(1);
  });

  it('W2 Regression: rapid unmount during in-flight connection does not call deactivate prematurely on connecting socket', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { unmount } = render(
      <ChatNotificationProvider>
        <ConsumerComponent />
      </ChatNotificationProvider>
    );

    expect(mockClientInstances.length).toBe(1);
    const client = mockClientInstances[0];
    expect(client.activate).toHaveBeenCalledTimes(1);
    expect(client.connected).toBe(false);

    // Rapid unmount while handshake is in flight
    unmount();

    // Must NOT call deactivate while handshake is in flight
    expect(client.deactivate).not.toHaveBeenCalled();

    // Handshake completes asynchronously
    act(() => {
      client.__simulateConnect();
    });

    // Safely deactivated upon handshake completion because isMounted is false
    expect(client.deactivate).toHaveBeenCalledTimes(1);
    expect(client.subscribe).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('visibility change during in-flight connection does not trigger forceDisconnect or duplicate activate', () => {
    render(
      <ChatNotificationProvider>
        <ConsumerComponent />
      </ChatNotificationProvider>
    );

    const client = mockClientInstances[0];
    expect(client.activate).toHaveBeenCalledTimes(1);
    expect(client.connected).toBe(false);

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    });

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(client.forceDisconnect).not.toHaveBeenCalled();
    expect(client.activate).toHaveBeenCalledTimes(1);
  });

  it('re-activates on visibility change when connection was dropped and client is inactive', () => {
    render(
      <ChatNotificationProvider>
        <ConsumerComponent />
      </ChatNotificationProvider>
    );

    const client = mockClientInstances[0];
    act(() => {
      client.__simulateConnect();
    });

    // Simulate dropped connection
    client.connected = false;
    client.active = false;

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    });

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(client.activate).toHaveBeenCalledTimes(2);
  });

  it('handles websocket error during connection without crashing or uncaught errors', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { unmount } = render(
      <ChatNotificationProvider>
        <ConsumerComponent />
      </ChatNotificationProvider>
    );

    const client = mockClientInstances[0];

    act(() => {
      client.__simulateError(new Error('Connection refused'));
    });

    unmount();
    expect(client.deactivate).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
```

---

## 5. Verification Commands
- Frontend test runner: `npx vitest run` in `zhan-finance-frontend`
- Build check: `npm run build` in `zhan-finance-frontend`
- Expected result: 17 test files passed, 63 tests passed, 0 failures, 0 errors.
