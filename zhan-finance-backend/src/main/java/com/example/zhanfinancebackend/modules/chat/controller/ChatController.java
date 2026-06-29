package com.example.zhanfinancebackend.modules.chat.controller;

import com.example.zhanfinancebackend.common.response.ApiResponse;
import com.example.zhanfinancebackend.modules.auth.security.UserPrincipal;
import com.example.zhanfinancebackend.modules.chat.dto.ChatContactDto;
import com.example.zhanfinancebackend.modules.chat.dto.ChatMessageDto;
import com.example.zhanfinancebackend.modules.chat.dto.SendChatMessageRequest;
import com.example.zhanfinancebackend.modules.chat.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE', 'CLIENT')")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping("/contacts")
    public ApiResponse<List<ChatContactDto>> getContacts(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(chatService.getContacts(principal.getId()));
    }

    @GetMapping("/{otherUserId}")
    public ApiResponse<List<ChatMessageDto>> getHistory(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long otherUserId,
            @RequestParam(required = false) Long afterId
    ) {
        return ApiResponse.success(chatService.getChatHistory(principal.getId(), otherUserId, afterId));
    }

    @PostMapping("/{otherUserId}")
    public ApiResponse<ChatMessageDto> sendMessage(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long otherUserId,
            @Valid @RequestBody SendChatMessageRequest request
    ) {
        return ApiResponse.success(chatService.sendMessage(principal.getId(), otherUserId, request));
    }

    @PutMapping("/{otherUserId}/read")
    public ApiResponse<Void> markAsRead(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long otherUserId
    ) {
        chatService.markAsRead(principal.getId(), otherUserId);
        return ApiResponse.success(null);
    }
    
    @GetMapping("/unread")
    public ApiResponse<Integer> getUnreadCount(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(chatService.getUnreadCount(principal.getId()));
    }

    @DeleteMapping("/messages/{messageId}")
    public ApiResponse<Void> deleteMessage(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long messageId
    ) {
        chatService.deleteMessage(principal.getId(), messageId);
        return ApiResponse.success(null);
    }
}
