package com.example.zhanfinancebackend.modules.auth.service;

import com.example.zhanfinancebackend.common.exception.UnauthorizedException;
import com.example.zhanfinancebackend.modules.auth.entity.RefreshToken;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.RefreshTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class RefreshTokenRotationTest {

    private RefreshTokenService refreshTokenService;
    private RefreshTokenRepository refreshTokenRepository;
    private User testUser;

    @BeforeEach
    void setUp() {
        refreshTokenRepository = mock(RefreshTokenRepository.class);
        refreshTokenService = new RefreshTokenService(refreshTokenRepository, 86400000L); // 1 day

        testUser = new User();
        testUser.setId(10L);
        testUser.setEmail("user@example.com");
    }

    @Test
    @DisplayName("create() сохраняет новый токен и очищает прошлые токены пользователя")
    void create_SavesNewTokenAndCleansUpOldTokens() {
        RefreshToken tokenToReturn = new RefreshToken("new-token-uuid", testUser, Instant.now().plusSeconds(3600));
        tokenToReturn.setId(100L);

        when(refreshTokenRepository.save(any(RefreshToken.class))).thenReturn(tokenToReturn);

        RefreshToken result = refreshTokenService.create(testUser);

        assertNotNull(result);
        assertEquals("new-token-uuid", result.getToken());
        verify(refreshTokenRepository).save(any(RefreshToken.class));
        verify(refreshTokenRepository).deleteAllByUserExceptId(testUser, 100L);
    }

    @Test
    @DisplayName("verify() возвращает токен если он действителен")
    void verify_ValidToken_ReturnsRefreshToken() {
        RefreshToken validToken = new RefreshToken("valid-token", testUser, Instant.now().plusSeconds(3600));
        when(refreshTokenRepository.findByToken("valid-token")).thenReturn(Optional.of(validToken));

        RefreshToken result = refreshTokenService.verify("valid-token");

        assertNotNull(result);
        assertEquals(validToken, result);
    }

    @Test
    @DisplayName("verify() выбрасывает UnauthorizedException если токен истёк")
    void verify_ExpiredToken_ThrowsUnauthorizedException() {
        RefreshToken expiredToken = new RefreshToken("expired-token", testUser, Instant.now().minusSeconds(10));
        when(refreshTokenRepository.findByToken("expired-token")).thenReturn(Optional.of(expiredToken));

        assertThrows(UnauthorizedException.class, () -> refreshTokenService.verify("expired-token"));
    }

    @Test
    @DisplayName("verify() выбрасывает UnauthorizedException если токен не найден в базе")
    void verify_UnknownToken_ThrowsUnauthorizedException() {
        when(refreshTokenRepository.findByToken("unknown-token")).thenReturn(Optional.empty());

        assertThrows(UnauthorizedException.class, () -> refreshTokenService.verify("unknown-token"));
    }
}
