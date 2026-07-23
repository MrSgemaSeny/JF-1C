package com.example.zhanfinancebackend.modules.notifications.service;

import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.common.exception.ErrorCode;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.notifications.dto.NotificationDto;
import com.example.zhanfinancebackend.modules.notifications.entity.Notification;
import com.example.zhanfinancebackend.modules.notifications.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

import com.example.zhanfinancebackend.common.exception.ResourceNotFoundException;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final EmailNotificationService emailNotificationService;
    private final UserRepository userRepository;

    @org.springframework.beans.factory.annotation.Value("${app.frontend.url}")
    private String frontendUrl;

    public NotificationService(NotificationRepository notificationRepository, 
                               EmailNotificationService emailNotificationService,
                               UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.emailNotificationService = emailNotificationService;
        this.userRepository = userRepository;
    }

    @Transactional
    public void createNotification(User user, String title, String message, String relativeLink) {
        if (user == null) return;
        Notification notification = new Notification(user, title, message, relativeLink);
        notificationRepository.save(notification);
    }

    @Transactional
    public void createNotification(User user, String title, String message) {
        createNotification(user, title, message, null);
    }

    @Transactional
    public void notifyAdmins(String title, String message, String relativeLink) {
        List<User> admins = userRepository.findAllByRole(Role.ADMIN);
        for (User admin : admins) {
            createNotification(admin, title, message, relativeLink);
        }
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public NotificationDto markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        if (!notification.getUser().getId().equals(userId)) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied");
        }

        notification.setRead(true);
        return mapToDto(notificationRepository.save(notification));
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsReadByUserId(userId);
    }

    private NotificationDto mapToDto(Notification notification) {
        return new NotificationDto(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getLink(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}

