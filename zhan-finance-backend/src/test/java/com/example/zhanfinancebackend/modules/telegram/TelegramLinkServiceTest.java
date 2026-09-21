package com.example.zhanfinancebackend.modules.telegram;

import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.telegram.dto.TelegramBindRequest;
import com.example.zhanfinancebackend.modules.telegram.dto.TelegramBindResponse;
import com.example.zhanfinancebackend.modules.telegram.dto.TelegramLinkStatusResponse;
import com.example.zhanfinancebackend.modules.telegram.dto.TelegramLinkTokenResponse;
import com.example.zhanfinancebackend.modules.telegram.entity.TelegramLink;
import com.example.zhanfinancebackend.modules.telegram.entity.TelegramLinkToken;
import com.example.zhanfinancebackend.modules.telegram.repository.TelegramLinkRepository;
import com.example.zhanfinancebackend.modules.telegram.repository.TelegramLinkTokenRepository;
import com.example.zhanfinancebackend.modules.telegram.service.TelegramLinkService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class TelegramLinkServiceTest {

    private TelegramLinkRepository telegramLinkRepository;
    private TelegramLinkTokenRepository telegramLinkTokenRepository;
    private TelegramLinkService telegramLinkService;

    private User testUser;

    @BeforeEach
    void setUp() {
        telegramLinkRepository = mock(TelegramLinkRepository.class);
        telegramLinkTokenRepository = mock(TelegramLinkTokenRepository.class);
        telegramLinkService = new TelegramLinkService(telegramLinkRepository, telegramLinkTokenRepository, "zhanfinancebot");

        testUser = new User();
        testUser.setId(42L);
        testUser.setFullName("Алихан Сейдахметов");
        testUser.setEmail("testclient@example.kz");
        testUser.setRole(Role.CLIENT);
    }

    @Test
    @DisplayName("generateLinkToken creates 15-minute token and deeplink, purging older tokens")
    void generateLinkToken_success() {
        TelegramLinkTokenResponse response = telegramLinkService.generateLinkToken(testUser);

        assertNotNull(response);
        assertNotNull(response.token());
        assertTrue(response.deepLink().contains("https://t.me/zhanfinancebot?start=" + response.token()));
        assertTrue(response.expiresAt().isAfter(Instant.now().plus(14, ChronoUnit.MINUTES)));

        verify(telegramLinkTokenRepository).deleteByUserId(42L);
        verify(telegramLinkTokenRepository).save(any(TelegramLinkToken.class));
    }

    @Test
    @DisplayName("getLinkStatus returns linked=true when active link exists")
    void getLinkStatus_linkedTrue() {
        TelegramLink link = new TelegramLink(testUser, 123456789L, "alihan_tg");
        when(telegramLinkRepository.findByUserIdAndIsActiveTrue(42L)).thenReturn(Optional.of(link));

        TelegramLinkStatusResponse response = telegramLinkService.getLinkStatus(testUser);

        assertTrue(response.linked());
        assertEquals(123456789L, response.chatId());
        assertEquals("alihan_tg", response.telegramUsername());
    }

    @Test
    @DisplayName("getLinkStatus returns linked=false when no active link exists")
    void getLinkStatus_linkedFalse() {
        when(telegramLinkRepository.findByUserIdAndIsActiveTrue(42L)).thenReturn(Optional.empty());

        TelegramLinkStatusResponse response = telegramLinkService.getLinkStatus(testUser);

        assertFalse(response.linked());
        assertNull(response.chatId());
    }

    @Test
    @DisplayName("unlinkTelegram sets active=false and purges pending tokens")
    void unlinkTelegram_deactivatesAndPurges() {
        TelegramLink link = new TelegramLink(testUser, 123456789L, "alihan_tg");
        when(telegramLinkRepository.findByUserId(42L)).thenReturn(Optional.of(link));

        telegramLinkService.unlinkTelegram(testUser);

        assertFalse(link.isActive());
        verify(telegramLinkRepository).save(link);
        verify(telegramLinkTokenRepository).deleteByUserId(42L);
    }

    @Test
    @DisplayName("bindTelegram binds account successfully when token is valid")
    void bindTelegram_success() {
        String token = "valid-test-token-123";
        TelegramLinkToken linkToken = new TelegramLinkToken(token, testUser, Instant.now().plus(10, ChronoUnit.MINUTES));
        when(telegramLinkTokenRepository.findByToken(token)).thenReturn(Optional.of(linkToken));
        when(telegramLinkRepository.findByUserId(42L)).thenReturn(Optional.empty());
        when(telegramLinkRepository.findByChatId(99999L)).thenReturn(Optional.empty());

        TelegramBindRequest request = new TelegramBindRequest(token, 99999L, "new_tg_user", "Alihan", "Seidakhmetov");
        TelegramBindResponse response = telegramLinkService.bindTelegram(request);

        assertTrue(response.success());
        assertEquals(42L, response.userId());
        assertEquals("Алихан Сейдахметов", response.fullName());
        assertEquals("CLIENT", response.role());

        ArgumentCaptor<TelegramLink> captor = ArgumentCaptor.forClass(TelegramLink.class);
        verify(telegramLinkRepository).save(captor.capture());
        TelegramLink saved = captor.getValue();
        assertEquals(99999L, saved.getChatId());
        assertEquals("new_tg_user", saved.getTelegramUsername());
        assertTrue(saved.isActive());

        verify(telegramLinkTokenRepository).delete(linkToken);
    }

    @Test
    @DisplayName("bindTelegram throws exception when token has expired")
    void bindTelegram_expiredToken_throwsException() {
        String token = "expired-token-123";
        TelegramLinkToken linkToken = new TelegramLinkToken(token, testUser, Instant.now().minus(5, ChronoUnit.MINUTES));
        when(telegramLinkTokenRepository.findByToken(token)).thenReturn(Optional.of(linkToken));

        TelegramBindRequest request = new TelegramBindRequest(token, 99999L, "new_tg_user", "Alihan", null);

        assertThrows(ApiException.class, () -> telegramLinkService.bindTelegram(request));
        verify(telegramLinkTokenRepository).delete(linkToken);
    }

    @Test
    @DisplayName("bindTelegram throws exception when token is not found")
    void bindTelegram_notFoundToken_throwsException() {
        when(telegramLinkTokenRepository.findByToken("unknown-token")).thenReturn(Optional.empty());

        TelegramBindRequest request = new TelegramBindRequest("unknown-token", 99999L, "new_tg_user", "Alihan", null);

        assertThrows(ApiException.class, () -> telegramLinkService.bindTelegram(request));
    }

    @Test
    @DisplayName("bindTelegram deletes conflicting link if chatId is already held by a different user")
    void bindTelegram_chatIdCollision_removesOldLinkBeforeBinding() {
        String token = "collision-token-456";
        TelegramLinkToken linkToken = new TelegramLinkToken(token, testUser, Instant.now().plus(10, ChronoUnit.MINUTES));
        when(telegramLinkTokenRepository.findByToken(token)).thenReturn(Optional.of(linkToken));

        User otherUser = new User();
        otherUser.setId(99L);
        otherUser.setFullName("Другой Пользователь");

        TelegramLink existingOtherLink = new TelegramLink(otherUser, 99999L, "old_owner_tg");
        when(telegramLinkRepository.findByChatId(99999L)).thenReturn(Optional.of(existingOtherLink));
        when(telegramLinkRepository.findByUserId(testUser.getId())).thenReturn(Optional.empty());

        TelegramBindRequest request = new TelegramBindRequest(token, 99999L, "new_tg_user", "Alihan", "Seidakhmetov");
        TelegramBindResponse response = telegramLinkService.bindTelegram(request);

        assertTrue(response.success());
        assertEquals(testUser.getId(), response.userId());

        // Conflicting link belonging to otherUser must be deleted and flushed
        verify(telegramLinkRepository).delete(existingOtherLink);
        verify(telegramLinkRepository).flush();

        // New link must be saved for testUser
        ArgumentCaptor<TelegramLink> captor = ArgumentCaptor.forClass(TelegramLink.class);
        verify(telegramLinkRepository).save(captor.capture());
        assertEquals(testUser, captor.getValue().getUser());
        assertEquals(99999L, captor.getValue().getChatId());
    }
}
