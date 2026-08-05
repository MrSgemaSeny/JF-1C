package com.example.zhanfinancebackend.modules.auth.service;

import com.example.zhanfinancebackend.common.exception.BadRequestException;
import com.example.zhanfinancebackend.common.exception.UnauthorizedException;
import com.example.zhanfinancebackend.modules.auth.dto.TwoFactorSetupDto;
import com.example.zhanfinancebackend.modules.auth.entity.TwoFactorPreAuth;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.TwoFactorPreAuthRepository;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import dev.samstevens.totp.code.CodeGenerator;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.exceptions.QrGenerationException;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.UUID;

@Service
public class TwoFactorService {

    private final SecretGenerator secretGenerator;
    private final QrGenerator qrGenerator;
    private final CodeVerifier codeVerifier;
    private final UserRepository userRepository;
    private final TwoFactorPreAuthRepository preAuthRepository;

    public TwoFactorService(
            UserRepository userRepository,
            TwoFactorPreAuthRepository preAuthRepository
    ) {
        this.userRepository = userRepository;
        this.preAuthRepository = preAuthRepository;
        this.secretGenerator = new DefaultSecretGenerator();
        this.qrGenerator = new ZxingPngQrGenerator();

        TimeProvider timeProvider = new SystemTimeProvider();
        CodeGenerator codeGenerator = new DefaultCodeGenerator(HashingAlgorithm.SHA1);
        this.codeVerifier = new DefaultCodeVerifier(codeGenerator, timeProvider);
    }

    @Transactional(readOnly = true)
    public TwoFactorSetupDto generateSetup(User user) {
        String secret = secretGenerator.generate();

        QrData qrData = new QrData.Builder()
                .label(user.getEmail())
                .secret(secret)
                .issuer("ZhanFinance")
                .algorithm(HashingAlgorithm.SHA1)
                .digits(6)
                .period(30)
                .build();

        String qrImageBase64;
        try {
            byte[] imageData = qrGenerator.generate(qrData);
            qrImageBase64 = "data:image/png;base64," + Base64.getEncoder().encodeToString(imageData);
        } catch (QrGenerationException e) {
            throw new BadRequestException("Ошибка генерации QR-кода");
        }

        return new TwoFactorSetupDto(secret, qrImageBase64, qrData.getUri());
    }

    @Transactional
    public void confirmSetup(User user, String secret, String code) {
        if (!codeVerifier.isValidCode(secret, code)) {
            throw new BadRequestException("Неверный код подтверждения 2FA");
        }
        User persistentUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new BadRequestException("Пользователь не найден"));
        persistentUser.setTotpSecret(secret);
        persistentUser.setTwoFactorEnabled(true);
        userRepository.save(persistentUser);
    }

    @Transactional
    public void disable2FA(User user, String code) {
        User persistentUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new BadRequestException("Пользователь не найден"));
        if (!persistentUser.isTwoFactorEnabled()) {
            throw new BadRequestException("Двухфакторная аутентификация не включена");
        }
        if (!codeVerifier.isValidCode(persistentUser.getTotpSecret(), code)) {
            throw new BadRequestException("Неверный код подтверждения");
        }
        persistentUser.setTotpSecret(null);
        persistentUser.setTwoFactorEnabled(false);
        userRepository.save(persistentUser);
    }

    @Transactional
    public String createPreAuthToken(User user) {
        preAuthRepository.deleteByUser(user);

        String token = UUID.randomUUID().toString();
        TwoFactorPreAuth preAuth = new TwoFactorPreAuth();
        preAuth.setUser(user);
        preAuth.setToken(token);
        preAuth.setExpiresAt(LocalDateTime.now().plusMinutes(5));
        preAuth.setCreatedAt(LocalDateTime.now());
        preAuthRepository.save(preAuth);

        return token;
    }

    @Transactional
    public User verifyCode(String token, String code) {
        TwoFactorPreAuth preAuth = preAuthRepository.findByToken(token)
                .orElseThrow(() -> new UnauthorizedException("Недействительный токен 2FA"));

        if (preAuth.getExpiresAt().isBefore(LocalDateTime.now())) {
            preAuthRepository.delete(preAuth);
            throw new UnauthorizedException("Срок действия токена 2FA истек. Войдите заново.");
        }

        User user = userRepository.findById(preAuth.getUser().getId())
                .orElseThrow(() -> new UnauthorizedException("Пользователь не найден"));

        if (user.getTotpSecret() == null) {
            throw new UnauthorizedException("2FA не настроена");
        }

        if (preAuth.getAttempts() >= 5) {
            preAuthRepository.delete(preAuth);
            throw new UnauthorizedException("Превышен лимит попыток. Войдите заново.");
        }

        if (!codeVerifier.isValidCode(user.getTotpSecret(), code)) {
            preAuth.setAttempts(preAuth.getAttempts() + 1);
            preAuthRepository.save(preAuth);
            if (preAuth.getAttempts() >= 5) {
                preAuthRepository.delete(preAuth);
                throw new UnauthorizedException("Превышен лимит попыток. Войдите заново.");
            }
            throw new UnauthorizedException("Неверный код 2FA");
        }
        
        return user;
    }

    @Transactional
    public void deletePreAuthToken(String token) {
        preAuthRepository.deleteByToken(token);
    }

    @Scheduled(fixedDelay = 300000)
    @Transactional
    public void purgeExpiredTokens() {
        preAuthRepository.deleteByExpiresAtBefore(LocalDateTime.now());
    }
}
