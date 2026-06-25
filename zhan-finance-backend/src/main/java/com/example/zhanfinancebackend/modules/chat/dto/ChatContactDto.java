package com.example.zhanfinancebackend.modules.chat.dto;

import com.example.zhanfinancebackend.modules.auth.entity.Role;

public record ChatContactDto(
        Long id,
        String fullName,
        String email,
        Role role,
        String avatarUrl,
        int unreadCount,
        ChatMessageDto lastMessage
) {}
