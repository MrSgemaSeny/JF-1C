package com.example.zhanfinancebackend.modules.auth.service;

import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.common.exception.ErrorCode;
import com.example.zhanfinancebackend.modules.auth.entity.RefreshToken;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

import com.example.zhanfinancebackend.common.exception.UnauthorizedException;

@Service
public class RefreshTokenService {

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
        // 1. Сначала создаём НОВЫЙ токен и сохраняем его.
        //    Это гарантирует, что в момент удаления старых токенов
        //    у пользователя уже есть валидный новый.
        RefreshToken newToken = new RefreshToken(
                UUID.randomUUID().toString(),
                user,
                Instant.now().plusMillis(refreshTokenExpirationMs)
        );
        RefreshToken savedNewToken = refreshTokenRepository.save(newToken);

        // 2. Потом удаляем ВСЕ СТАРЫЕ токены (кроме новосозданного).
        //    Если два refresh-запроса придут одновременно:
        //    - оба создадут новый токен (два разных)
        //    - оба попытаются удалить старые
        //    - но ни один не удалит сам себя, т.к. мы исключили свой ID
        //    → нет StaleObjectStateException, нет race condition
        refreshTokenRepository.deleteAllByUserExceptId(user, savedNewToken.getId());

        return savedNewToken;
    }

    @Transactional(readOnly = true)
    public RefreshToken verify(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));
        if (refreshToken.getExpiresAt().isBefore(Instant.now())) {
            throw new UnauthorizedException("Refresh token expired");
        }
        return refreshToken;
    }
}
