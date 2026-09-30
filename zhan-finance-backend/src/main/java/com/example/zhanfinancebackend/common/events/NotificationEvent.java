package com.example.zhanfinancebackend.common.events;

public record NotificationEvent(
        EventType eventType,
        Long recipientUserId,
        String recipientEmail,
        String title,
        String message,
        String link
) {
    public enum EventType {
        EMAIL,
        TELEGRAM,
        IN_APP,
        SYSTEM_BROADCAST
    }

    public static NotificationEvent email(String email, String title, String message) {
        return new NotificationEvent(EventType.EMAIL, null, email, title, message, null);
    }

    public static NotificationEvent telegram(Long userId, String title, String message, String link) {
        return new NotificationEvent(EventType.TELEGRAM, userId, null, title, message, link);
    }

    public static NotificationEvent inApp(Long userId, String title, String message, String link) {
        return new NotificationEvent(EventType.IN_APP, userId, null, title, message, link);
    }
}
