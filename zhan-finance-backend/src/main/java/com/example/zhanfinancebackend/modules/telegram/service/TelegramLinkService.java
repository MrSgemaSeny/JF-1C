package com.example.zhanfinancebackend.modules.telegram.service;

import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.common.exception.ErrorCode;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.telegram.dto.TelegramBindRequest;
import com.example.zhanfinancebackend.modules.telegram.dto.TelegramBindResponse;
import com.example.zhanfinancebackend.modules.telegram.dto.TelegramLinkStatusResponse;
import com.example.zhanfinancebackend.modules.telegram.dto.TelegramLinkTokenResponse;
import com.example.zhanfinancebackend.modules.telegram.entity.TelegramLink;
import com.example.zhanfinancebackend.modules.telegram.entity.TelegramLinkToken;
import com.example.zhanfinancebackend.modules.telegram.repository.TelegramLinkRepository;
import com.example.zhanfinancebackend.modules.telegram.repository.TelegramLinkTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
public class TelegramLinkService {

    private final TelegramLinkRepository telegramLinkRepository;
    private final TelegramLinkTokenRepository telegramLinkTokenRepository;
    private final String botUsername;

    public TelegramLinkService(
            TelegramLinkRepository telegramLinkRepository,
            TelegramLinkTokenRepository telegramLinkTokenRepository,
            @Value("${app.telegram.bot-username:zhanfinancebot}") String botUsername
    ) {
        this.telegramLinkRepository = telegramLinkRepository;
        this.telegramLinkTokenRepository = telegramLinkTokenRepository;
        this.botUsername = botUsername != null ? botUsername.trim() : "zhanfinancebot";
    }

    @Transactional
    public TelegramLinkTokenResponse generateLinkToken(User user) {
        if (user == null || user.getId() == null) {
            throw new ApiException(ErrorCode.UNAUTHORIZED, "User is not authenticated");
        }

        telegramLinkTokenRepository.deleteByUserId(user.getId());

        String token = UUID.randomUUID().toString();
        Instant expiresAt = Instant.now().plus(15, ChronoUnit.MINUTES);

        TelegramLinkToken linkToken = new TelegramLinkToken(token, user, expiresAt);
        telegramLinkTokenRepository.save(linkToken);

        String deepLink = "https://t.me/" + botUsername + "?start=" + token;
        return new TelegramLinkTokenResponse(token, deepLink, expiresAt);
    }

    @Transactional(readOnly = true)
    public TelegramLinkStatusResponse getLinkStatus(User user) {
        if (user == null || user.getId() == null) {
            return new TelegramLinkStatusResponse(false, null, null, null);
        }

        Optional<TelegramLink> linkOpt = telegramLinkRepository.findByUserIdAndIsActiveTrue(user.getId());
        if (linkOpt.isPresent()) {
            TelegramLink link = linkOpt.get();
            return new TelegramLinkStatusResponse(true, link.getChatId(), link.getTelegramUsername(), link.getLinkedAt());
        }

        return new TelegramLinkStatusResponse(false, null, null, null);
    }

    @Transactional
    public void unlinkTelegram(User user) {
        if (user == null || user.getId() == null) {
            return;
        }

        telegramLinkRepository.findByUserId(user.getId()).ifPresent(link -> {
            link.setActive(false);
            link.setUpdatedAt(Instant.now());
            telegramLinkRepository.save(link);
        });

        telegramLinkTokenRepository.deleteByUserId(user.getId());
    }

    @Transactional
    public void unlinkByChatId(Long chatId) {
        if (chatId == null) {
            return;
        }

        telegramLinkRepository.findByChatId(chatId).ifPresent(link -> {
            link.setActive(false);
            link.setUpdatedAt(Instant.now());
            telegramLinkRepository.save(link);
        });
    }

    @Transactional
    public TelegramBindResponse bindTelegram(TelegramBindRequest request) {
        if (request == null || request.token() == null || request.chatId() == null) {
            throw new ApiException(ErrorCode.BAD_REQUEST, "Token and chatId are required");
        }

        String rawToken = request.token().trim();
        TelegramLinkToken linkToken = telegramLinkTokenRepository.findByToken(rawToken)
                .orElseThrow(() -> new ApiException(ErrorCode.INVALID_OR_EXPIRED_TOKEN, "Invalid or expired link token"));

        if (linkToken.getExpiresAt().isBefore(Instant.now())) {
            telegramLinkTokenRepository.delete(linkToken);
            throw new ApiException(ErrorCode.INVALID_OR_EXPIRED_TOKEN, "Link token has expired");
        }

        User user = linkToken.getUser();

        // Handle chat_id collision: if chatId is already linked to a different user, remove the conflicting link
        // so that the UNIQUE(chat_id) database constraint is never violated upon rebinding.
        telegramLinkRepository.findByChatId(request.chatId())
                .filter(existing -> existing.getUser() == null || !existing.getUser().getId().equals(user.getId()))
                .ifPresent(existing -> {
                    telegramLinkRepository.delete(existing);
                    telegramLinkRepository.flush();
                });

        // Check if there is an existing link for user
        TelegramLink link = telegramLinkRepository.findByUserId(user.getId())
                .orElseGet(() -> new TelegramLink(user, request.chatId(), request.telegramUsername()));

        link.setUser(user);
        link.setChatId(request.chatId());
        if (request.telegramUsername() != null && !request.telegramUsername().isBlank()) {
            link.setTelegramUsername(request.telegramUsername());
        }
        link.setActive(true);
        link.setUpdatedAt(Instant.now());
        telegramLinkRepository.save(link);

        telegramLinkTokenRepository.delete(linkToken);

        return new TelegramBindResponse(
                true,
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole() != null ? user.getRole().name() : null
        );
    }
}
