import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { getUnreadChatCount } from '@/entities/chat/api/chatApi';
import { Client } from '@stomp/stompjs';
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
    } catch (err) {
      console.error('Failed to fetch unread chat count', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 60000);
      
      // Setup Stomp client
      const token = user.accessToken;
      const stompClient = new Client({
        webSocketFactory: () => new SockJS(`${import.meta.env.VITE_API_URL}/ws?token=${token}`),
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 5000,
        onConnect: () => {
          stompClient.subscribe(`/topic/chat/${user.userId}`, (message) => {
            if (message.body) {
              const chatMessage = JSON.parse(message.body);
              if (chatMessage.receiverId === user.userId && !chatMessage.isRead) {
                fetchUnreadCount();
              }
            }
          });
        },
      });

      stompClient.activate();

      return () => {
        clearInterval(interval);
        stompClient.deactivate();
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
