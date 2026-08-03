package com.example.zhanfinancebackend.modules.auth.service;

import com.example.zhanfinancebackend.common.exception.UnauthorizedException;
import com.example.zhanfinancebackend.modules.auth.entity.RefreshToken;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.RefreshTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private static final Logger log = LoggerFactory.getLogger(RefreshTokenService.class);

    private final RefreshTokenRepository refreshTokenRepository;
    private final long refreshTokenExpirationMs;

    public RefreshTokenService(
            RefreshTokenRepository refreshTokenRepository,
            @Value("${app.jwt.refresh-token-expiration-ms}") long refreshTokenExpirationMs
    ) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
    }

    @Transactional
    public RefreshToken create(User user) {
        RefreshToken newToken = new RefreshToken(
                UUID.randomUUID().toString(),
                user,
                Instant.now().plusMillis(refreshTokenExpirationMs)
        );
        RefreshToken saved = refreshTokenRepository.save(newToken);
        refreshTokenRepository.deleteAllByUserExceptId(user, saved.getId());
        return saved;
    }

    @Transactional
    public RefreshToken verify(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> {
                    log.warn("Refresh token not found - possible token reuse attack. Token: {}",
                            token.substring(0, Math.min(8, token.length())) + "...");
                    return new UnauthorizedException("Invalid refresh token");
                });

        if (refreshToken.getExpiresAt().isBefore(Instant.now())) {
            refreshTokenRepository.delete(refreshToken);
            throw new UnauthorizedException("Refresh token expired");
        }

        return refreshToken;
    }

    @Transactional
    public void revoke(String token) {
        refreshTokenRepository.findByToken(token).ifPresent(refreshTokenRepository::delete);
    }

    /**
     * Принудительная инвалидация всех сессий пользователя.
     * Вызывается при смене пароля, подозрении на компрометацию, выходе со всех устройств.
     */
    @Transactional
    public void revokeAll(User user) {
        int count = refreshTokenRepository.deleteAllByUser(user);
        log.info("Revoked {} refresh tokens for user {}", count, user.getId());
    }
}
