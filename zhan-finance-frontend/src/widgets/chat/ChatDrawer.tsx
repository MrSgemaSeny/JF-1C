import { useEffect, useState, useRef } from 'react';
import { X, Send, User } from 'lucide-react';
import { getChatHistory, sendChatMessage, markChatAsRead, ChatMessageDto } from '@/entities/chat/api/chatApi';
import { useAuth } from '@/features/auth/AuthContext';
import { Spinner } from '@/shared/ui/Spinner';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  otherUserId: number | null;
  otherUserName: string;
}

export function ChatDrawer({ isOpen, onClose, otherUserId, otherUserName }: ChatDrawerProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // To keep track of the latest message ID without adding it as a dependency in the interval
  const lastMessageIdRef = useRef<number>(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && otherUserId) {
      loadInitialHistory();
      markChatAsRead(otherUserId).catch(console.error);
    } else {
      setMessages([]);
      lastMessageIdRef.current = 0;
    }
  }, [isOpen, otherUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isOpen && otherUserId) {
      interval = setInterval(async () => {
        try {
          const newMsgs = await getChatHistory(otherUserId, lastMessageIdRef.current);
          if (newMsgs && newMsgs.length > 0) {
            setMessages(prev => [...prev, ...newMsgs]);
            const maxId = Math.max(...newMsgs.map(m => m.id));
            if (maxId > lastMessageIdRef.current) {
              lastMessageIdRef.current = maxId;
              markChatAsRead(otherUserId).catch(console.error);
            }
          }
        } catch (error) {
          console.error('Failed to poll messages:', error);
        }
      }, 3000); // Poll every 3 seconds to avoid spamming
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, otherUserId]);

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
    setNewMessage(''); // optimistic clear
    setIsSending(true);

    try {
      const sent = await sendChatMessage(otherUserId, content);
      setMessages(prev => [...prev, sent]);
      lastMessageIdRef.current = Math.max(lastMessageIdRef.current, sent.id);
    } catch (error) {
      console.error('Failed to send message:', error);
      // rollback text?
      setNewMessage(content);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-brand-green text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">{otherUserName || 'Чат'}</h3>
              <p className="text-xs text-white/70">Online</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-y-auto p-6 bg-gray-50 flex flex-col gap-4"
        >
          {isLoading ? (
            <div className="flex-1 flex justify-center items-center">
              <Spinner className="w-8 h-8 text-brand-green" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
              <p className="text-sm">Нет сообщений</p>
              <p className="text-xs">Напишите первым!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMine = msg.senderId === user?.userId;
              const showTail = idx === messages.length - 1 || messages[idx + 1].senderId !== msg.senderId;

              return (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} ${!showTail ? 'mb-1' : 'mb-4'}`}
                >
                  <div 
                    className={`px-4 py-2.5 max-w-[85%] ${
                      isMine 
                        ? 'bg-brand-green text-white rounded-2xl rounded-tr-sm' 
                        : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm'
                    }`}
                  >
                    <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
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

        {/* Input Form */}
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
              className="flex-1 max-h-32 min-h-[40px] bg-transparent border-none focus:ring-0 resize-none text-sm px-2 py-2"
              rows={1}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="p-2.5 bg-brand-green text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-brand-green transition-colors flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
