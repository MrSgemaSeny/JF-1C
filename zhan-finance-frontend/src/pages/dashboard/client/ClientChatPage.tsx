import { useEffect, useState, useRef } from 'react';
import { Send, User, Trash2 } from 'lucide-react';
import { getChatHistory, sendChatMessage, markChatAsRead, deleteChatMessage, ChatMessageDto } from '@/entities/chat/api/chatApi';
import { useAuth } from '@/features/auth/AuthContext';
import { getMyProfile } from '@/entities/user/api/userApi';
import { Spinner } from '@/shared/ui/Spinner';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export function ClientChatPage() {
  const { user } = useAuth();
  const [otherUserId, setOtherUserId] = useState<number | null>(null);
  const [otherUserName, setOtherUserName] = useState<string>('Ваш бухгалтер');
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<number>(0);

  useEffect(() => {
    if (user?.userId) {
      getMyProfile().then(profile => {
        if (profile.assignedEmployeeId) {
          setOtherUserId(profile.assignedEmployeeId);
          setOtherUserName(profile.assignedEmployeeName || 'Ваш бухгалтер');
        }
      }).catch(console.error);
    }
  }, [user?.userId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (otherUserId) {
      loadInitialHistory();
      markChatAsRead(otherUserId).catch(console.error);
    }
  }, [otherUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // WebSockets for active chat
  useEffect(() => {
    let stompClient: Client | null = null;
    
    if (otherUserId && user) {
      const token = localStorage.getItem('token');
      stompClient = new Client({
        webSocketFactory: () => new SockJS(`${import.meta.env.VITE_API_URL}/ws?token=${token}`),
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 5000,
        onConnect: () => {
          stompClient?.subscribe(`/topic/chat/${user.userId}`, (message) => {
            if (message.body) {
              const chatMessage: ChatMessageDto = JSON.parse(message.body);
              if (chatMessage.senderId === otherUserId || chatMessage.receiverId === otherUserId) {
                 setMessages(prev => {
                   if (prev.find(m => m.id === chatMessage.id)) return prev;
                   return [...prev, chatMessage];
                 });
                 if (chatMessage.id > lastMessageIdRef.current) {
                   lastMessageIdRef.current = chatMessage.id;
                 }
                 markChatAsRead(otherUserId).catch(console.error);
              }
            }
          });
        }
      });
      stompClient.activate();
    }

    return () => {
      if (stompClient) stompClient.deactivate();
    };
  }, [otherUserId, user]);

  const loadInitialHistory = async () => {
    if (!otherUserId) return;
    setIsLoading(true);
    try {
      const history = await getChatHistory(otherUserId);
      setMessages(history);
      if (history.length > 0) {
        lastMessageIdRef.current = Math.max(...history.map(m => m.id));
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !otherUserId || isSending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      const sent = await sendChatMessage(otherUserId, content);
      setMessages(prev => [...prev, sent]);
      lastMessageIdRef.current = Math.max(lastMessageIdRef.current, sent.id);
    } catch (error) {
      console.error('Failed to send message:', error);
      setNewMessage(content);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (msgId: number) => {
    try {
      await deleteChatMessage(msgId);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isDeleted: true, content: 'Пользователь удалил сообщение' } : m));
    } catch (error) {
      console.error(error);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!otherUserId) {
    return (
      <div className="flex h-full items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">Чат недоступен</p>
          <p className="text-sm mt-1">К вам еще не прикреплен сотрудник.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-brand-green text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-base">{otherUserName}</h3>
            <p className="text-xs text-white/70">Сотрудник Zhan Finance</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex justify-center items-center">
            <Spinner className="w-8 h-8 text-brand-green" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
            <p className="text-sm">Нет сообщений</p>
            <p className="text-xs">Напишите вашему бухгалтеру!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMine = msg.senderId === user?.userId;
            const showTail = idx === messages.length - 1 || messages[idx + 1].senderId !== msg.senderId;

            return (
              <div 
                key={msg.id} 
                className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} ${!showTail ? 'mb-[2px]' : 'mb-3'}`}
              >
                <div className={`flex items-center gap-2 group ${isMine ? 'flex-row-reverse' : ''}`}>
                  <div 
                    className={`px-4 py-2.5 max-w-[70%] relative ${
                      msg.isDeleted ? 'bg-transparent border border-gray-200 text-gray-400 italic rounded-2xl' :
                      isMine 
                        ? 'bg-brand-green text-white rounded-2xl rounded-tr-sm' 
                        : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm'
                    }`}
                  >
                    <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {isMine && !msg.isDeleted && (
                    <button 
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                      title="Удалить сообщение"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <span className={`text-[10px] text-gray-400 mt-1 ${isMine ? 'mr-1' : 'ml-1'}`}>
                  {formatTime(msg.createdAt)}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100">
        <form 
          onSubmit={handleSend}
          className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all"
        >
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder="Введите сообщение..."
            className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none focus:ring-0 resize-none text-sm px-3 py-2.5"
            rows={1}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="p-3 bg-brand-green text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-brand-green transition-colors flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
