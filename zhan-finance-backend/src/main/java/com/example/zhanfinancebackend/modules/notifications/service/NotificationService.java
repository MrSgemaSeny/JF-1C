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

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final EmailNotificationService emailNotificationService;

    @org.springframework.beans.factory.annotation.Value("${app.frontend.url}")
    private String frontendUrl;

    public NotificationService(NotificationRepository notificationRepository, EmailNotificationService emailNotificationService) {
        this.notificationRepository = notificationRepository;
        this.emailNotificationService = emailNotificationService;
    }

    @Transactional
    public void createNotification(User user, String title, String message, String relativeLink) {
        Notification notification = new Notification(user, title, message);
        notificationRepository.save(notification);

        // Also fire off an email asynchronously
        String emailText = message;
        if (relativeLink != null && !relativeLink.isBlank()) {
            emailText += "\n\nView details here: " + frontendUrl + relativeLink;
        }
        
        // We only send emails to users who have an email address (should be all users)
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            emailNotificationService.sendEmailAsync(user.getEmail(), title, emailText);
        }
    }

    @Transactional
    public void createNotification(User user, String title, String message) {
        createNotification(user, title, message, null);
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
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Notification not found"));

        if (!notification.getUser().getId().equals(userId)) {
            throw new ApiException(ErrorCode.FORBIDDEN, "Access denied");
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
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
