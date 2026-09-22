package com.example.zhanfinancebackend.modules.auth.service;

import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.common.exception.BadRequestException;
import com.example.zhanfinancebackend.common.exception.UnauthorizedException;
import com.example.zhanfinancebackend.modules.auth.dto.RegisterRequest;
import com.example.zhanfinancebackend.modules.auth.entity.EmailVerificationOtp;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.EmailVerificationOtpRepository;
import com.example.zhanfinancebackend.modules.notifications.service.EmailNotificationService;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class EmailOtpServiceTest {

    @Mock
    private EmailVerificationOtpRepository otpRepository;

    @Mock
    private EmailNotificationService emailNotificationService;

    private ObjectMapper objectMapper = new ObjectMapper();

    private EmailOtpService emailOtpService;

    private User testUser;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        emailOtpService = new EmailOtpService(otpRepository, emailNotificationService, objectMapper);
        testUser = new User("Test User", "test@gmail.com", "hash123", Role.CLIENT);
        testUser.setId(10L);
    }

    @Test
    void createLoginOtp_SavesOtpAndSendsEmail() {
        when(otpRepository.save(any(EmailVerificationOtp.class))).thenAnswer(inv -> inv.getArgument(0));

        String token = emailOtpService.createLoginOtp(testUser);

        assertNotNull(token);
        verify(otpRepository).deleteByUser(testUser);
        verify(otpRepository).deleteByEmailIgnoreCase(testUser.getEmail());
        verify(emailNotificationService).sendLoginOtpEmail(eq(testUser.getEmail()), eq(testUser.getFullName()), anyString());
    }

    @Test
    void createRegisterOtp_StoresHashedPasswordNeverPlaintext() {
        when(otpRepository.save(any(EmailVerificationOtp.class))).thenAnswer(inv -> inv.getArgument(0));

        RegisterRequest req = new RegisterRequest("New User", "new@gmail.com", "plainPass", Role.CLIENT, "+77771234567", "Test Corp");
        String passwordHash = "$2a$10$hashedPasswordHere";

        String token = emailOtpService.createRegisterOtp(req, passwordHash);

        assertNotNull(token);
        verify(otpRepository).save(any(EmailVerificationOtp.class));
        verify(emailNotificationService).sendRegisterOtpEmail(eq("new@gmail.com"), eq("New User"), anyString());
    }

    @Test
    void verifyOtp_Success_DeletesRecordAndReturns() {
        EmailVerificationOtp otp = new EmailVerificationOtp();
        otp.setEmail("user@gmail.com");
        otp.setOtpCode("123456");
        otp.setPreAuthToken("valid-token");
        otp.setExpiresAt(LocalDateTime.now().plusMinutes(5));
        otp.setAttempts(0);
        otp.setPurpose("LOGIN");

        when(otpRepository.findByPreAuthToken("valid-token")).thenReturn(Optional.of(otp));

        EmailVerificationOtp verified = emailOtpService.verifyOtp("valid-token", "123456");

        assertEquals("user@gmail.com", verified.getEmail());
        verify(otpRepository).delete(otp);
    }

    @Test
    void verifyOtp_WrongCode_IncrementsAttemptsAndThrows() {
        EmailVerificationOtp otp = new EmailVerificationOtp();
        otp.setEmail("user@gmail.com");
        otp.setOtpCode("123456");
        otp.setPreAuthToken("valid-token");
        otp.setExpiresAt(LocalDateTime.now().plusMinutes(5));
        otp.setAttempts(0);

        when(otpRepository.findByPreAuthToken("valid-token")).thenReturn(Optional.of(otp));

        assertThrows(BadRequestException.class, () -> emailOtpService.verifyOtp("valid-token", "999999"));
        assertEquals(1, otp.getAttempts());
        verify(otpRepository).save(otp);
    }

    @Test
    void verifyOtp_MaxAttempts_DeletesAndThrowsUnauthorized() {
        EmailVerificationOtp otp = new EmailVerificationOtp();
        otp.setEmail("user@gmail.com");
        otp.setOtpCode("123456");
        otp.setPreAuthToken("max-token");
        otp.setExpiresAt(LocalDateTime.now().plusMinutes(5));
        otp.setAttempts(5);

        when(otpRepository.findByPreAuthToken("max-token")).thenReturn(Optional.of(otp));

        assertThrows(UnauthorizedException.class, () -> emailOtpService.verifyOtp("max-token", "123456"));
        verify(otpRepository).delete(otp);
    }

    @Test
    void resendOtp_WithinCooldown_ThrowsRateLimit() {
        EmailVerificationOtp otp = new EmailVerificationOtp();
        otp.setPreAuthToken("recent-token");
        otp.setLastSentAt(LocalDateTime.now().minusSeconds(20)); // only 20 sec elapsed

        when(otpRepository.findByPreAuthToken("recent-token")).thenReturn(Optional.of(otp));

        assertThrows(ApiException.class, () -> emailOtpService.resendOtp("recent-token"));
    }
}
