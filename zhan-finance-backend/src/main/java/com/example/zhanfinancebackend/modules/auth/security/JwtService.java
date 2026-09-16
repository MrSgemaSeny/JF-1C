package com.example.zhanfinancebackend.modules.auth.security;

import com.example.zhanfinancebackend.modules.auth.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {

    private static final String CLAIM_TOKEN_TYPE = "type";
    private static final String TOKEN_TYPE_ACCESS = "access";

    private final SecretKey signingKey;
    private final long accessTokenExpirationMs;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-token-expiration-ms}") long accessTokenExpirationMs,
            Environment env
    ) {
        if (secret == null || secret.isBlank() || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("CRITICAL: JWT_SECRET must be configured and at least 32 bytes (256 bits) for secure HMAC-SHA256 operations");
        }
        boolean isTest = java.util.Arrays.asList(env.getActiveProfiles()).contains("test");
        if (!isTest && (secret.toLowerCase().contains("change-me") || secret.toLowerCase().contains("default-secret"))) {
            boolean isProdOrUnspecified = java.util.Arrays.asList(env.getActiveProfiles()).contains("prod") || env.getActiveProfiles().length == 0;
            if (isProdOrUnspecified) {
                throw new IllegalStateException("CRITICAL: Default or placeholder JWT secret is strictly forbidden in production");
            }
        }
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpirationMs = accessTokenExpirationMs;
    }

    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getEmail())
                .claim("uid", user.getId())
                .claim("role", user.getRole().name())
                .claim(CLAIM_TOKEN_TYPE, TOKEN_TYPE_ACCESS)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(accessTokenExpirationMs)))
                .signWith(signingKey)
                .compact();
    }

    public boolean isTokenValid(String token, String username) {
        Claims claims = parseClaimsOrNull(token);
        if (claims == null) {
            return false;
        }
        return TOKEN_TYPE_ACCESS.equals(claims.get(CLAIM_TOKEN_TYPE, String.class))
                && username.equals(claims.getSubject());
    }

    public String extractUsernameIfValidAccessToken(String token) {
        Claims claims = parseClaimsOrNull(token);
        if (claims == null || !TOKEN_TYPE_ACCESS.equals(claims.get(CLAIM_TOKEN_TYPE, String.class))) {
            return null;
        }
        return claims.getSubject();
    }

    public String extractRoleIfValidAccessToken(String token) {
        Claims claims = parseClaimsOrNull(token);
        if (claims == null || !TOKEN_TYPE_ACCESS.equals(claims.get(CLAIM_TOKEN_TYPE, String.class))) {
            return null;
        }
        return claims.get("role", String.class);
    }

    public Long extractUserIdIfValidAccessToken(String token) {
        Claims claims = parseClaimsOrNull(token);
        if (claims == null || !TOKEN_TYPE_ACCESS.equals(claims.get(CLAIM_TOKEN_TYPE, String.class))) {
            return null;
        }
        Object uid = claims.get("uid");
        if (uid instanceof Number number) {
            return number.longValue();
        }
        if (uid instanceof String str) {
            try {
                return Long.parseLong(str);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    private Claims parseClaimsOrNull(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException exception) {
            // JwtException покрывает и истёкший токен (ExpiredJwtException - его подкласс),
            // и неверную подпись. Невалидный токен = null, без разделения по причине.
            return null;
        }
    }
}