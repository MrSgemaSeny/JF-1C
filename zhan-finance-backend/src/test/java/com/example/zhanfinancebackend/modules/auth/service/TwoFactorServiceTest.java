package com.example.zhanfinancebackend.modules.auth.service;

import com.example.zhanfinancebackend.common.exception.BadRequestException;
import com.example.zhanfinancebackend.common.exception.UnauthorizedException;
import com.example.zhanfinancebackend.modules.auth.dto.TwoFactorSetupDto;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.TwoFactorPreAuth;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.TwoFactorPreAuthRepository;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TwoFactorServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private TwoFactorPreAuthRepository preAuthRepository;

    @InjectMocks
    private TwoFactorService twoFactorService;

    private User testUser;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        testUser = new User("Admin User", "admin@zhanfinance.kz", "hashedpass", Role.ADMIN);
        testUser.setId(1L);
    }

    @Test
    void generateSetup_ReturnsSetupDtoWithSecretAndQrCode() {
        TwoFactorSetupDto setupDto = twoFactorService.generateSetup(testUser);

        assertNotNull(setupDto);
        assertNotNull(setupDto.secret());
        assertTrue(setupDto.qrCodeImage().startsWith("data:image/png;base64,"));
        assertTrue(setupDto.uri().contains("ZhanFinance"));
    }

    @Test
    void createPreAuthToken_SavesAndReturnsToken() {
        when(preAuthRepository.save(any(TwoFactorPreAuth.class))).thenAnswer(invocation -> invocation.getArgument(0));

        String token = twoFactorService.createPreAuthToken(testUser);

        assertNotNull(token);
        verify(preAuthRepository).deleteByUser(testUser);
        verify(preAuthRepository).save(any(TwoFactorPreAuth.class));
    }

    @Test
    void validatePreAuthToken_ValidToken_ReturnsUser() {
        TwoFactorPreAuth preAuth = new TwoFactorPreAuth();
        preAuth.setUser(testUser);
        preAuth.setToken("valid-token");
        preAuth.setExpiresAt(LocalDateTime.now().plusMinutes(5));

        when(preAuthRepository.findByToken("valid-token")).thenReturn(Optional.of(preAuth));

        User result = twoFactorService.validatePreAuthToken("valid-token");

        assertEquals(testUser.getEmail(), result.getEmail());
    }

    @Test
    void validatePreAuthToken_ExpiredToken_ThrowsUnauthorizedException() {
        TwoFactorPreAuth preAuth = new TwoFactorPreAuth();
        preAuth.setUser(testUser);
        preAuth.setToken("expired-token");
        preAuth.setExpiresAt(LocalDateTime.now().minusMinutes(1));

        when(preAuthRepository.findByToken("expired-token")).thenReturn(Optional.of(preAuth));

        assertThrows(UnauthorizedException.class, () -> twoFactorService.validatePreAuthToken("expired-token"));
        verify(preAuthRepository).delete(preAuth);
    }

    @Test
    void confirmSetup_InvalidCode_ThrowsBadRequestException() {
        assertThrows(BadRequestException.class, () -> 
            twoFactorService.confirmSetup(testUser, "JBSWY3DPEHPK3PXP", "000000")
        );
    }

    @Test
    void verifyCode_NullSecret_ReturnsFalse() {
        testUser.setTotpSecret(null);
        assertFalse(twoFactorService.verifyCode(testUser, "123456"));
    }
}
