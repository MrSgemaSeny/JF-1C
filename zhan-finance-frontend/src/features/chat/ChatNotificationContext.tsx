import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { getUnreadChatCount } from '@/entities/chat/api/chatApi';
import { Client } from '@stomp/stompjs';
import { getWsEndpointUrl, getAccessToken } from '@/shared/api/http';
import SockJS from 'sockjs-client';

interface ChatNotificationContextType {
  unreadChatCount: number;
  refreshUnreadChatCount: () => Promise<void>;
  decrementUnreadCount: (amount: number) => void;
}

const ChatNotificationContext = createContext<ChatNotificationContextType | undefined>(undefined);

export function ChatNotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const count = await getUnreadChatCount();
      setUnreadChatCount(count);
    } catch {
      // Ignore 401 / background polling errors
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      
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

  const decrementUnreadCount = (amount: number) => {
    setUnreadChatCount(prev => Math.max(0, prev - amount));
  };

  return (
    <ChatNotificationContext.Provider value={{
      unreadChatCount,
      refreshUnreadChatCount: fetchUnreadCount,
      decrementUnreadCount
    }}>
      {children}
    </ChatNotificationContext.Provider>
  );
}

export function useChatNotifications() {
  const context = useContext(ChatNotificationContext);
  if (context === undefined) {
    throw new Error('useChatNotifications must be used within a ChatNotificationProvider');
  }
  return context;
}
