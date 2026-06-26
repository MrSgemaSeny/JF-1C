import { useEffect, useState, useRef } from 'react';
import { Send, User, Search, UserCheck, Shield, MessageCircle, Trash2, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { getChatContacts, getChatHistory, sendChatMessage, markChatAsRead, deleteChatMessage, ChatContactDto, ChatMessageDto } from '@/entities/chat/api/chatApi';
import { useAuth } from '@/features/auth/AuthContext';
import { Spinner } from '@/shared/ui/Spinner';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { twMerge } from 'tailwind-merge';

export function ClientChatPage() {
  const { user } = useAuth();
  
  // Contacts state
  const [contacts, setContacts] = useState<ChatContactDto[]>([]);
  const [search, setSearch] = useState('');
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  
  // Chat state
  const [selectedContact, setSelectedContact] = useState<ChatContactDto | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<number>(0);

  const fetchContacts = async () => {
    try {
      const data = await getChatContacts();
      data.sort((a, b) => {
        if (b.unreadCount !== a.unreadCount) return b.unreadCount - a.unreadCount;
        const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      setContacts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  useEffect(() => {
    fetchContacts();
    const interval = setInterval(fetchContacts, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedContact) {
      setMessages([]);
      lastMessageIdRef.current = 0;
      loadChatHistory(selectedContact.id);
      markChatAsRead(selectedContact.id).catch(console.error);
      setContacts(prev => prev.map(c => c.id === selectedContact.id ? { ...c, unreadCount: 0 } : c));
    }
  }, [selectedContact?.id]);

  const loadChatHistory = async (userId: number) => {
    setIsLoadingChat(true);
    try {
      const history = await getChatHistory(userId);
      if (selectedContact?.id === userId) {
        setMessages(history);
        if (history.length > 0) {
          lastMessageIdRef.current = Math.max(...history.map(m => m.id));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingChat(false);
    }
  };

  useEffect(() => {
    let stompClient: Client | null = null;
    if (selectedContact && user) {
      const token = localStorage.getItem('token');
      stompClient = new Client({
        webSocketFactory: () => new SockJS(`${import.meta.env.VITE_API_URL}/ws?token=${token}`),
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 5000,
        onConnect: () => {
          stompClient?.subscribe(`/topic/chat/${user.userId}`, (message) => {
            if (message.body) {
              const chatMessage: ChatMessageDto = JSON.parse(message.body);
              if (chatMessage.senderId === selectedContact.id || chatMessage.receiverId === selectedContact.id) {
                 setMessages(prev => {
                   if (prev.find(m => m.id === chatMessage.id)) return prev;
                   return [...prev, chatMessage];
                 });
                 if (chatMessage.id > lastMessageIdRef.current) {
                   lastMessageIdRef.current = chatMessage.id;
                 }
                 markChatAsRead(selectedContact.id).catch(console.error);
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
  }, [selectedContact?.id, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact || isSending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      const sent = await sendChatMessage(selectedContact.id, content);
      setMessages(prev => [...prev, sent]);
      lastMessageIdRef.current = Math.max(lastMessageIdRef.current, sent.id);
      
      setContacts(prev => {
        const updated = prev.map(c => 
          c.id === selectedContact.id ? { ...c, lastMessage: sent } : c
        );
        updated.sort((a, b) => {
          if (b.unreadCount !== a.unreadCount) return b.unreadCount - a.unreadCount;
          const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
          const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
          return timeB - timeA;
        });
        return updated;
      });
    } catch (error) {
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

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredContacts = contacts.filter(c => 
    c.fullName.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-[120px])] md:h-[calc(100vh-4rem)] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
      
      {/* Sidebar - Contacts */}
      <div className={twMerge(
        "w-full md:w-80 border-r border-gray-100 flex flex-col bg-gray-50/50 shrink-0",
        selectedContact ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Поддержка</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Поиск..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoadingContacts ? (
            <div className="flex justify-center p-8"><Spinner className="w-6 h-6 text-brand-green" /></div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center text-gray-400 p-8 text-sm">Нет контактов</div>
          ) : (
            filteredContacts.map(contact => (
              <motion.button
                layout
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={`w-full flex items-start gap-3 p-4 text-left transition-colors border-b border-gray-100 last:border-0 ${
                  selectedContact?.id === contact.id ? 'bg-brand-green/5' : 'hover:bg-white'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-white overflow-hidden ${
                      contact.role === 'ADMIN' ? 'bg-indigo-500' : 'bg-brand-green/80'
                  }`}>
                    {contact.role === 'ADMIN' ? <Shield className="w-5 h-5 absolute z-0" /> : <UserCheck className="w-5 h-5 absolute z-0" />}
                    {contact.avatarUrl && (
                      <img 
                        src={contact.avatarUrl} 
                        alt="" 
                        className="w-full h-full object-cover relative z-10" 
                        onError={(e) => e.currentTarget.style.display = 'none'} 
                      />
                    )}
                  </div>
                  {contact.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white z-20">
                      {contact.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p className="text-sm font-semibold text-gray-900 truncate pr-2">
                      {contact.role === 'ADMIN' ? 'Zhan Finance (Админ)' : contact.fullName}
                    </p>
                    {contact.lastMessage && (
                      <span className="text-[10px] text-gray-400 flex-shrink-0">
                        {formatTime(contact.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <p className={`text-xs truncate ${contact.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                      {contact.lastMessage ? contact.lastMessage.content : (contact.role === 'ADMIN' ? 'Поддержка' : 'Бухгалтер')}
                    </p>
                    <span className={`px-1.5 py-0.5 text-[9px] rounded uppercase font-bold tracking-wider ${
                      contact.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-brand-green/10 text-brand-green'
                    }`}>
                      {contact.role === 'ADMIN' ? 'Админ' : 'Бухгалтер'}
                    </span>
                  </div>
                </div>
              </motion.button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={twMerge(
        "flex-1 flex flex-col bg-white min-w-0 h-full",
        !selectedContact ? "hidden md:flex" : "flex"
      )}>
        {selectedContact ? (
          <>
            {/* Header */}
            <div className="flex items-center px-4 md:px-6 py-4 border-b border-gray-100 bg-white">
              <button 
                onClick={() => setSelectedContact(null)}
                className="md:hidden mr-3 p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                title="Назад к контактам"
              >
                <ChevronLeft size={24} />
              </button>
              <div className="flex items-center gap-3">
                <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-white overflow-hidden ${
                  selectedContact.role === 'ADMIN' ? 'bg-indigo-500' : 'bg-brand-green/80'
                }`}>
                  {selectedContact.role === 'ADMIN' ? <Shield className="w-5 h-5 absolute z-0" /> : <UserCheck className="w-5 h-5 absolute z-0" />}
                  {selectedContact.avatarUrl && (
                    <img 
                      src={selectedContact.avatarUrl} 
                      alt="" 
                      className="w-full h-full object-cover relative z-10" 
                      onError={(e) => e.currentTarget.style.display = 'none'} 
                    />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">
                    {selectedContact.role === 'ADMIN' ? 'Zhan Finance (Админ)' : selectedContact.fullName}
                  </h3>
                  <p className="text-xs text-brand-green font-medium">
                    {selectedContact.role === 'ADMIN' ? 'Служба поддержки' : 'Ваш бухгалтер'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col">
              {isLoadingChat ? (
                <div className="flex-1 flex justify-center items-center">
                  <Spinner className="w-8 h-8 text-brand-green" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
                  <p className="text-sm">Нет сообщений</p>
                  <p className="text-xs">Напишите первое сообщение!</p>
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
                          className={`px-4 py-2.5 max-w-[85%] md:max-w-[70%] relative ${
                            msg.isDeleted ? 'bg-transparent border border-gray-200 text-gray-400 italic rounded-2xl' :
                            isMine 
                              ? 'bg-brand-green text-white rounded-2xl rounded-tr-sm' 
                              : 'bg-gray-100 text-gray-900 rounded-2xl rounded-tl-sm'
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
            <div className="p-3 md:p-4 bg-white border-t border-gray-100">
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
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">
            <MessageCircle className="w-16 h-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-600">Поддержка Zhan Finance</p>
            <p className="text-sm">Выберите чат с администратором или вашим бухгалтером</p>
          </div>
        )}
      </div>
    </div>
  );
}
