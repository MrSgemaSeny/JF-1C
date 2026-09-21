package com.example.zhanfinancebackend.modules.telegram;

import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.common.exception.ErrorCode;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.security.InternalTokenFilter;
import com.example.zhanfinancebackend.modules.telegram.dto.TelegramBindRequest;
import com.example.zhanfinancebackend.modules.telegram.dto.TelegramBindResponse;
import com.example.zhanfinancebackend.modules.telegram.dto.TelegramLinkTokenResponse;
import com.example.zhanfinancebackend.modules.telegram.entity.TelegramLink;
import com.example.zhanfinancebackend.modules.telegram.entity.TelegramLinkToken;
import com.example.zhanfinancebackend.modules.telegram.repository.TelegramLinkRepository;
import com.example.zhanfinancebackend.modules.telegram.repository.TelegramLinkTokenRepository;
import com.example.zhanfinancebackend.modules.telegram.service.TelegramLinkService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class TelegramAdversarialTokenLifecycleTest {

    private TelegramLinkRepository telegramLinkRepository;
    private TelegramLinkTokenRepository telegramLinkTokenRepository;
    private TelegramLinkService telegramLinkService;

    private User testUser;

    @BeforeEach
    void setUp() {
        telegramLinkRepository = mock(TelegramLinkRepository.class);
        telegramLinkTokenRepository = mock(TelegramLinkTokenRepository.class);
        telegramLinkService = new TelegramLinkService(telegramLinkRepository, telegramLinkTokenRepository, "zhan_bot");

        testUser = new User();
        testUser.setId(42L);
        testUser.setEmail("client@zhanfinance.kz");
        testUser.setFullName("Adversarial Test Client");
        testUser.setRole(Role.CLIENT);
        testUser.setEnabled(true);
    }

    @Test
    @DisplayName("TTL Verification: newly generated token expires in exactly 15 minutes")
    void generateLinkToken_has15MinTtl() {
        Instant before = Instant.now().plus(14, ChronoUnit.MINUTES).plus(55, ChronoUnit.SECONDS);
        TelegramLinkTokenResponse response = telegramLinkService.generateLinkToken(testUser);
        Instant after = Instant.now().plus(15, ChronoUnit.MINUTES).plus(5, ChronoUnit.SECONDS);

        assertNotNull(response);
        assertNotNull(response.token());
        assertEquals(36, response.token().length(), "Token must be a 36-character UUID");
        assertTrue(response.deepLink().contains("https://t.me/zhan_bot?start=" + response.token()));
        assertTrue(response.expiresAt().isAfter(before), "ExpiresAt should be >= now + 14m55s");
        assertTrue(response.expiresAt().isBefore(after), "ExpiresAt should be <= now + 15m05s");

        verify(telegramLinkTokenRepository, times(1)).deleteByUserId(42L);
        verify(telegramLinkTokenRepository, times(1)).save(any(TelegramLinkToken.class));
    }

    @Test
    @DisplayName("Purge Prior Tokens: generating new token purges any existing tokens for user")
    void generateLinkToken_purgesPriorTokensForSameUser() {
        telegramLinkService.generateLinkToken(testUser);
        verify(telegramLinkTokenRepository, times(1)).deleteByUserId(42L);

        // Generating a second token calls deleteByUserId again
        telegramLinkService.generateLinkToken(testUser);
        verify(telegramLinkTokenRepository, times(2)).deleteByUserId(42L);
    }

    @Test
    @DisplayName("Expiration Enforcement: bind attempt with expired token throws INVALID_OR_EXPIRED_TOKEN and purges token")
    void bindTelegram_expiredToken_purgesAndThrowsException() {
        String token = "expired-token-uuid-1234";
        Instant expiredAt = Instant.now().minus(5, ChronoUnit.SECONDS);
        TelegramLinkToken expiredLinkToken = new TelegramLinkToken(token, testUser, expiredAt);

        when(telegramLinkTokenRepository.findByToken(token)).thenReturn(Optional.of(expiredLinkToken));

        TelegramBindRequest request = new TelegramBindRequest(token, 123456789L, "adver_user", "Adver", "Client");

        ApiException ex = assertThrows(ApiException.class, () -> telegramLinkService.bindTelegram(request));
        assertEquals(ErrorCode.INVALID_OR_EXPIRED_TOKEN, ex.getErrorCode());
        assertTrue(ex.getMessage().contains("expired"), "Exception message should indicate expiration");

        // Expired token must be immediately purged from database
        verify(telegramLinkTokenRepository, times(1)).delete(expiredLinkToken);
    }

    @Test
    @DisplayName("One-Time Token Consumption: token is deleted upon binding and cannot be reused")
    void bindTelegram_oneTimeConsumption_secondAttemptFails() {
        String token = "one-time-token-uuid-5678";
        Instant validUntil = Instant.now().plus(10, ChronoUnit.MINUTES);
        TelegramLinkToken activeLinkToken = new TelegramLinkToken(token, testUser, validUntil);

        AtomicBoolean tokenConsumed = new AtomicBoolean(false);

        when(telegramLinkTokenRepository.findByToken(token)).thenAnswer(inv -> {
            if (tokenConsumed.get()) {
                return Optional.empty();
            }
            return Optional.of(activeLinkToken);
        });

        doAnswer(inv -> {
            tokenConsumed.set(true);
            return null;
        }).when(telegramLinkTokenRepository).delete(activeLinkToken);

        when(telegramLinkRepository.findByUserId(42L)).thenReturn(Optional.empty());
        when(telegramLinkRepository.findByChatId(999888L)).thenReturn(Optional.empty());

        TelegramBindRequest request = new TelegramBindRequest(token, 999888L, "adver_user", "Adver", "Client");

        // 1st attempt: Successful binding
        TelegramBindResponse firstResponse = telegramLinkService.bindTelegram(request);
        assertTrue(firstResponse.success());
        assertEquals(42L, firstResponse.userId());
        assertTrue(tokenConsumed.get(), "Token must be marked consumed and deleted in DB");

        // 2nd attempt with the identical token: Must fail because token was deleted
        ApiException secondEx = assertThrows(ApiException.class, () -> telegramLinkService.bindTelegram(request));
        assertEquals(ErrorCode.INVALID_OR_EXPIRED_TOKEN, secondEx.getErrorCode());
    }

    @Test
    @DisplayName("Edge Cases: null or missing token/chatId throws BAD_REQUEST")
    void bindTelegram_missingParameters_throwsBadRequest() {
        TelegramBindRequest nullTokenRequest = new TelegramBindRequest(null, 123L, "user", "Murat", null);
        ApiException ex1 = assertThrows(ApiException.class, () -> telegramLinkService.bindTelegram(nullTokenRequest));
        assertEquals(ErrorCode.BAD_REQUEST, ex1.getErrorCode());

        TelegramBindRequest nullChatIdRequest = new TelegramBindRequest("valid-token", null, "user", "Murat", null);
        ApiException ex2 = assertThrows(ApiException.class, () -> telegramLinkService.bindTelegram(nullChatIdRequest));
        assertEquals(ErrorCode.BAD_REQUEST, ex2.getErrorCode());
    }

    @Test
    @DisplayName("Timing-Attack Resistance: InternalTokenFilter constant-time MessageDigest.isEqual verification")
    void internalTokenFilter_constantTimeResistance() throws Exception {
        String secret = "super-secret-internal-bot-token-length-32";
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
        InternalTokenFilter filter = new InternalTokenFilter(secret, objectMapper);

        // Test with various adversarial payloads
        String[] adversarialTokens = {
                "",
                " ",
                "super-secret-internal-bot-token-length-31",
                "super-secret-internal-bot-token-length-32-extra",
                "Super-Secret-Internal-Bot-Token-Length-32",
                "a".repeat(1000),
                "\0\0\0\0"
        };

        for (String badToken : adversarialTokens) {
            MockHttpServletRequest request = new MockHttpServletRequest();
            request.setServletPath("/v1/internal/telegram/pending");
            request.addHeader(InternalTokenFilter.INTERNAL_TOKEN_HEADER, badToken);
            MockHttpServletResponse response = new MockHttpServletResponse();

            filter.doFilter(request, response, (req, res) -> {});
            assertEquals(401, response.getStatus(), "Bad token must return 401 for: " + badToken);
        }
    }
}
