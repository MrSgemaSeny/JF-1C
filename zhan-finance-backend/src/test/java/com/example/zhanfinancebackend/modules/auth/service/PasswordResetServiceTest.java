package com.example.zhanfinancebackend.modules.auth.service;

import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.common.exception.ErrorCode;
import com.example.zhanfinancebackend.modules.auth.entity.PasswordResetToken;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.PasswordResetTokenRepository;
import com.example.zhanfinancebackend.modules.auth.repository.RefreshTokenRepository;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.notifications.service.EmailNotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordResetTokenRepository tokenRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private EmailNotificationService emailNotificationService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private PasswordResetService passwordResetService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User("Test User", "test@example.com", "oldPasswordHash", Role.CLIENT);
        ReflectionTestUtils.setField(testUser, "id", 100L);
    }

    @Test
    void requestPasswordReset_whenUserNotFound_returnsSilentlyWithoutSendingEmail() {
        when(userRepository.findByEmailIgnoreCase("nonexistent@example.com")).thenReturn(Optional.empty());

        passwordResetService.requestPasswordReset("nonexistent@example.com");

        verify(tokenRepository, never()).save(any());
        verify(emailNotificationService, never()).sendPasswordResetEmail(any(), anyString());
    }

    @Test
    void requestPasswordReset_whenUserExists_invalidatesOldTokensAndSavesNewTokenAndSendsEmail() {
        when(userRepository.findByEmailIgnoreCase("test@example.com")).thenReturn(Optional.of(testUser));

        passwordResetService.requestPasswordReset("test@example.com");

        verify(tokenRepository).markAllAsUsedForUser(100L);

        ArgumentCaptor<PasswordResetToken> tokenCaptor = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(tokenRepository).save(tokenCaptor.capture());

        PasswordResetToken savedToken = tokenCaptor.getValue();
        assertThat(savedToken.getUser()).isEqualTo(testUser);
        assertThat(savedToken.getTokenHash()).isNotBlank();
        assertThat(savedToken.isUsed()).isFalse();
        assertThat(savedToken.getExpiresAt()).isAfter(Instant.now());

        verify(emailNotificationService).sendPasswordResetEmail(eq(testUser), anyString());
    }

    @Test
    void resetPassword_withValidToken_updatesPasswordAndRevokesSessions() {
        String rawToken = "a".repeat(64);
        String tokenHash = passwordResetService.hashToken(rawToken);

        PasswordResetToken token = new PasswordResetToken(testUser, tokenHash, Instant.now().plus(10, ChronoUnit.MINUTES));
        when(tokenRepository.findByTokenHashAndUsedFalse(tokenHash)).thenReturn(Optional.of(token));
        when(passwordEncoder.encode("NewSecret123")).thenReturn("newPasswordHash");

        passwordResetService.resetPassword(rawToken, "NewSecret123");

        assertThat(testUser.getPasswordHash()).isEqualTo("newPasswordHash");
        assertThat(token.isUsed()).isTrue();

        verify(userRepository).save(testUser);
        verify(tokenRepository).save(token);
        verify(refreshTokenRepository).deleteAllByUser(testUser);
    }

    @Test
    void resetPassword_withExpiredToken_throwsException() {
        String rawToken = "b".repeat(64);
        String tokenHash = passwordResetService.hashToken(rawToken);

        PasswordResetToken expiredToken = new PasswordResetToken(testUser, tokenHash, Instant.now().minus(5, ChronoUnit.MINUTES));
        when(tokenRepository.findByTokenHashAndUsedFalse(tokenHash)).thenReturn(Optional.of(expiredToken));

        assertThatThrownBy(() -> passwordResetService.resetPassword(rawToken, "ValidPassword123"))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> {
                    ApiException apiEx = (ApiException) ex;
                    assertThat(apiEx.getErrorCode()).isEqualTo(ErrorCode.INVALID_OR_EXPIRED_TOKEN);
                });

        assertThat(expiredToken.isUsed()).isTrue();
        verify(tokenRepository).save(expiredToken);
        verify(userRepository, never()).save(any());
        verify(refreshTokenRepository, never()).deleteAllByUser(any());
    }

    @Test
    void resetPassword_withWeakPassword_throwsException() {
        assertThatThrownBy(() -> passwordResetService.resetPassword("someToken", "short"))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> {
                    ApiException apiEx = (ApiException) ex;
                    assertThat(apiEx.getErrorCode()).isEqualTo(ErrorCode.PASSWORD_TOO_WEAK);
                });
    }

    @Test
    void resetPassword_whenTokenNotFound_throwsException() {
        String rawToken = "c".repeat(64);
        String tokenHash = passwordResetService.hashToken(rawToken);
        when(tokenRepository.findByTokenHashAndUsedFalse(tokenHash)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> passwordResetService.resetPassword(rawToken, "ValidPass123"))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> {
                    ApiException apiEx = (ApiException) ex;
                    assertThat(apiEx.getErrorCode()).isEqualTo(ErrorCode.INVALID_OR_EXPIRED_TOKEN);
                });
    }
}
