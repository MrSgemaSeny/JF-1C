package com.example.zhanfinancebackend.modules.chat.service;

import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.common.exception.ErrorCode;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.chat.dto.ChatContactDto;
import com.example.zhanfinancebackend.modules.chat.dto.ChatMessageDto;
import com.example.zhanfinancebackend.modules.chat.dto.SendChatMessageRequest;
import com.example.zhanfinancebackend.modules.chat.entity.ChatMessage;
import com.example.zhanfinancebackend.modules.chat.repository.ChatMessageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

import org.springframework.messaging.simp.SimpMessagingTemplate;

@Service
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatService(ChatMessageRepository chatMessageRepository, UserRepository userRepository, SimpMessagingTemplate messagingTemplate) {
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDto> getChatHistory(Long currentUserId, Long otherUserId, Long afterId) {
        validateAccess(currentUserId, otherUserId);
        
        List<ChatMessage> messages;
        if (afterId != null && afterId > 0) {
            messages = chatMessageRepository.findChatHistory(currentUserId, otherUserId, afterId);
        } else {
            messages = chatMessageRepository.findChatHistoryFull(currentUserId, otherUserId);
        }

        return messages.stream().map(this::toDto).toList();
    }

    @Transactional
    public ChatMessageDto sendMessage(Long currentUserId, Long receiverId, SendChatMessageRequest request) {
        validateAccess(currentUserId, receiverId);

        User sender = userRepository.findById(currentUserId)
                .orElseThrow(() -> new com.example.zhanfinancebackend.common.exception.ResourceNotFoundException("Sender not found"));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new com.example.zhanfinancebackend.common.exception.ResourceNotFoundException("Receiver not found"));

        ChatMessage message = new ChatMessage(sender, receiver, request.content());
        ChatMessage saved = chatMessageRepository.save(message);
        ChatMessageDto dto = toDto(saved);

        // Broadcast via WebSocket to receiver and sender
        messagingTemplate.convertAndSend("/topic/chat/" + receiverId, dto);
        messagingTemplate.convertAndSend("/topic/chat/" + currentUserId, dto);

        return dto;
    }
    
    @Transactional
    public void markAsRead(Long currentUserId, Long senderId) {
        chatMessageRepository.markMessagesAsRead(currentUserId, senderId);
    }
    
    @Transactional(readOnly = true)
    public List<ChatContactDto> getContacts(Long currentUserId) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new com.example.zhanfinancebackend.common.exception.ResourceNotFoundException("User not found"));

        List<User> usersToInclude = new ArrayList<>();

        if (currentUser.getRole() == Role.ADMIN) {
            usersToInclude.addAll(userRepository.findAllByRoleIn(List.of(Role.ADMIN, Role.EMPLOYEE, Role.CLIENT)));
        } else if (currentUser.getRole() == Role.EMPLOYEE) {
            usersToInclude.addAll(userRepository.findAllByRoleIn(List.of(Role.ADMIN, Role.EMPLOYEE)));
            usersToInclude.addAll(userRepository.findAllByAssignedEmployee(currentUser));
        } else if (currentUser.getRole() == Role.CLIENT || currentUser.getRole() == Role.LEARNER) {
            if (currentUser.getAssignedEmployee() != null) {
                usersToInclude.add(currentUser.getAssignedEmployee());
            }
            usersToInclude.addAll(userRepository.findAllByRoleIn(List.of(Role.ADMIN)));
        }

        return usersToInclude.stream()
                .filter(u -> !u.getId().equals(currentUserId))
                .map(u -> {
                    int unread = chatMessageRepository.countBySenderIdAndReceiverIdAndIsReadFalse(u.getId(), currentUserId);
                    ChatMessage lastMsg = chatMessageRepository.findLastMessage(currentUserId, u.getId());
                    return new ChatContactDto(
                            u.getId(),
                            u.getFullName(),
                            u.getEmail(),
                            u.getRole(),
                            u.getAvatarUrl(),
                            unread,
                            lastMsg != null ? toDto(lastMsg) : null
                    );
                })
                .toList();
    }
    
    @Transactional(readOnly = true)
    public int getUnreadCount(Long userId) {
        return chatMessageRepository.countByReceiverIdAndIsReadFalse(userId);
    }

    private void validateAccess(Long currentUserId, Long otherUserId) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new com.example.zhanfinancebackend.common.exception.ResourceNotFoundException("User not found"));
        User otherUser = userRepository.findById(otherUserId)
                .orElseThrow(() -> new com.example.zhanfinancebackend.common.exception.ResourceNotFoundException("Other user not found"));

        if (currentUser.getRole() == Role.ADMIN) {
            return; // Admin can chat with anyone
        }

        if (currentUser.getRole() == Role.CLIENT || currentUser.getRole() == Role.LEARNER) {
            if (otherUser.getRole() == Role.ADMIN) {
                return; // Clients/Learners can chat with admins
            }
            if (currentUser.getAssignedEmployee() != null && currentUser.getAssignedEmployee().getId().equals(otherUserId)) {
                return;
            }
            throw new org.springframework.security.access.AccessDeniedException("Client can only chat with their assigned employee or admins");
        } 
        
        if (currentUser.getRole() == Role.EMPLOYEE) {
            if (otherUser.getRole() == Role.ADMIN || otherUser.getRole() == Role.EMPLOYEE) {
                return; // Employees can chat with admins and other employees
            }
            if (otherUser.getRole() == Role.CLIENT || otherUser.getRole() == Role.LEARNER) {
                if (otherUser.getAssignedEmployee() != null && otherUser.getAssignedEmployee().getId().equals(currentUserId)) {
                    return;
                }
                throw new org.springframework.security.access.AccessDeniedException("Employee can only chat with their assigned clients");
            }
        }
        
        // Deny by default
        throw new org.springframework.security.access.AccessDeniedException("Access denied");
    }

    @Transactional
    public void deleteMessage(Long currentUserId, Long messageId) {
        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new com.example.zhanfinancebackend.common.exception.ResourceNotFoundException("Message not found"));
        
        if (!message.getSender().getId().equals(currentUserId)) {
            throw new org.springframework.security.access.AccessDeniedException("You can only delete your own messages");
        }
        
        message.setDeleted(true);
        message.setContent("Пользователь удалил сообщение");
    }

    private ChatMessageDto toDto(ChatMessage message) {
        return new ChatMessageDto(
                message.getId(),
                message.getSender().getId(),
                message.getReceiver().getId(),
                message.getContent(),
                message.getCreatedAt(),
                message.isRead(),
                message.isDeleted()
        );
    }
}

