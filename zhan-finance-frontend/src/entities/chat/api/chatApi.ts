import { apiRequest } from '@/shared/api/http';

export interface ChatMessageDto {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  isRead: boolean;
  isDeleted: boolean;
}

export interface ChatContactDto {
  id: number;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE' | 'CLIENT';
  avatarUrl?: string;
  unreadCount: number;
  lastMessage?: ChatMessageDto;
}

export async function getChatContacts(): Promise<ChatContactDto[]> {
  return apiRequest<ChatContactDto[]>('/api/chat/contacts');
}

export async function getChatHistory(otherUserId: number, afterId?: number): Promise<ChatMessageDto[]> {
  const url = afterId ? `/api/chat/${otherUserId}?afterId=${afterId}` : `/api/chat/${otherUserId}`;
  return apiRequest<ChatMessageDto[]>(url);
}

export async function sendChatMessage(otherUserId: number, content: string): Promise<ChatMessageDto> {
  return apiRequest<ChatMessageDto>(`/api/chat/${otherUserId}`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function markChatAsRead(otherUserId: number): Promise<void> {
  return apiRequest<void>(`/api/chat/${otherUserId}/read`, {
    method: 'PUT',
  });
}

export async function deleteChatMessage(messageId: number): Promise<void> {
  return apiRequest<void>(`/api/chat/messages/${messageId}`, {
    method: 'DELETE',
  });
}

export async function getUnreadChatCount(): Promise<number> {
  return apiRequest<number>('/api/chat/unread');
}
