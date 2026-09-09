package com.example.zhanfinancebackend.modules.notifications.event;

public record SendSimpleEmailEvent(
        String to,
        String subject,
        String text
) {}
