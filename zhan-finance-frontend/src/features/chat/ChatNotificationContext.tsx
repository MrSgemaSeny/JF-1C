import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { getUnreadChatCount } from '@/entities/chat/api/chatApi';
import { Client } from '@stomp/stompjs';
import { getWsEndpointUrl } from '@/shared/api/http';
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
        connectHeaders: {},
        debug: (str) => {
          // console.log('[STOMP NOTIF]', str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
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

      return () => {
        clearInterval(interval);
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
