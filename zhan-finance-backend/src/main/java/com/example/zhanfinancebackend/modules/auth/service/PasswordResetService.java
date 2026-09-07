package com.example.zhanfinancebackend.modules.auth.service;

import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.common.exception.ErrorCode;
import com.example.zhanfinancebackend.modules.auth.entity.PasswordResetToken;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.PasswordResetTokenRepository;
import com.example.zhanfinancebackend.modules.auth.repository.RefreshTokenRepository;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.notifications.service.EmailNotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;

@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
    private static final Duration TOKEN_EXPIRATION = Duration.ofMinutes(15);

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EmailNotificationService emailNotificationService;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    public PasswordResetService(
            UserRepository userRepository,
            PasswordResetTokenRepository tokenRepository,
            RefreshTokenRepository refreshTokenRepository,
            EmailNotificationService emailNotificationService,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.emailNotificationService = emailNotificationService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void requestPasswordReset(String email) {
        if (email == null || email.isBlank()) {
            return;
        }

        String normalizedEmail = email.toLowerCase().trim();
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(normalizedEmail);

        if (userOpt.isEmpty()) {
            // Anti-enumeration: do not reveal that user doesn't exist
            log.info("Password reset requested for non-existing email: {}", normalizedEmail);
            return;
        }

        User user = userOpt.get();

        // Invalidate all previous unused tokens
        tokenRepository.markAllAsUsedForUser(user.getId());

        // Generate 32 bytes cryptographically secure random token (64 hex characters)
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        String rawToken = HexFormat.of().formatHex(randomBytes);

        String tokenHash = hashToken(rawToken);
        Instant expiresAt = Instant.now().plus(TOKEN_EXPIRATION);

        PasswordResetToken resetToken = new PasswordResetToken(user, tokenHash, expiresAt);
        tokenRepository.save(resetToken);

        emailNotificationService.sendPasswordResetEmail(user, rawToken);
        log.info("Password reset token generated and sent to user id: {}", user.getId());
    }

    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new ApiException(ErrorCode.INVALID_OR_EXPIRED_TOKEN, "Токен сброса пароля отсутствует");
        }

        if (newPassword == null || newPassword.length() < 8 || !newPassword.matches(".*[a-zA-Z].*") || !newPassword.matches(".*\\d.*")) {
            throw new ApiException(ErrorCode.PASSWORD_TOO_WEAK, "Пароль должен содержать минимум 8 символов, включая буквы и цифры");
        }

        String tokenHash = hashToken(rawToken.trim());
        PasswordResetToken token = tokenRepository.findByTokenHashAndUsedFalse(tokenHash)
                .orElseThrow(() -> new ApiException(ErrorCode.INVALID_OR_EXPIRED_TOKEN, "Ссылка для сброса пароля недействительна или уже была использована"));

        if (token.isExpired()) {
            token.setUsed(true);
            tokenRepository.save(token);
            throw new ApiException(ErrorCode.INVALID_OR_EXPIRED_TOKEN, "Срок действия ссылки для сброса пароля истек");
        }

        User user = token.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Mark reset token as used
        token.setUsed(true);
        tokenRepository.save(token);

        // Invalidate all active sessions for this user
        refreshTokenRepository.deleteAllByUser(user);
        log.info("Password successfully reset and active sessions invalidated for user id: {}", user.getId());
    }

    public String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }
}
