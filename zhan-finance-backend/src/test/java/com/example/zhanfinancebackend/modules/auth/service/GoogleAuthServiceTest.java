package com.example.zhanfinancebackend.modules.auth.service;

import com.example.zhanfinancebackend.common.exception.BadRequestException;
import com.example.zhanfinancebackend.common.exception.ConflictException;
import com.example.zhanfinancebackend.modules.auth.entity.AuthProvider;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.auth.security.JwtService;
import com.example.zhanfinancebackend.modules.crm.service.ClientService;
import com.example.zhanfinancebackend.modules.notifications.service.EmailNotificationService;
import com.example.zhanfinancebackend.modules.notifications.service.NotificationService;
import com.example.zhanfinancebackend.modules.notifications.service.TelegramNotifierService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.Spy;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GoogleAuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private ClientService clientService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private EmailNotificationService emailNotificationService;

    @Mock
    private TwoFactorService twoFactorService;

    @Mock
    private TelegramNotifierService telegramNotifierService;

    private GoogleAuthService googleAuthService;

    private User currentUser;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        googleAuthService = new GoogleAuthService(
                userRepository,
                jwtService,
                refreshTokenService,
                clientService,
                notificationService,
                emailNotificationService,
                twoFactorService,
                telegramNotifierService
        );
        currentUser = new User("Murat", "murat@gmail.com", "hash", Role.CLIENT);
        currentUser.setId(1L);
        currentUser.setAuthProvider(AuthProvider.LOCAL);
        currentUser.setPasswordSet(true);
    }

    @Test
    void unlinkGoogleAccount_AlwaysThrowsBadRequestException() {
        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> googleAuthService.unlinkGoogleAccount(currentUser));
        org.junit.jupiter.api.Assertions.assertTrue(ex.getMessage().contains("Отвязка Google-аккаунта запрещена"));
    }
}
