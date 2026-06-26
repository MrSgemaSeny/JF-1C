package com.example.zhanfinancebackend.modules.notifications.controller;

import com.example.zhanfinancebackend.modules.notifications.service.EmailNotificationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestEmailController {

    private final EmailNotificationService emailNotificationService;

    public TestEmailController(EmailNotificationService emailNotificationService) {
        this.emailNotificationService = emailNotificationService;
    }

    @GetMapping("/api/test-email")
    public String sendTestEmail(@RequestParam String email) {
        String html = "<h2>Почта работает! 🚀</h2>" +
                      "<p>Привет! Это тестовое сообщение от вашего сервера ZhanFinance.</p>" +
                      "<p>Раз вы его видите, значит SMTP-настройки введены абсолютно верно и сервер готов рассылать реальные уведомления клиентам и сотрудникам.</p>";
        
        emailNotificationService.sendHtmlEmail(email, "Тестовое письмо от ZhanFinance", html);
        
        return "Успех! Тестовое письмо отправлено на адрес: " + email + ". Проверьте ваш ящик (включая папку Спам).";
    }
}
