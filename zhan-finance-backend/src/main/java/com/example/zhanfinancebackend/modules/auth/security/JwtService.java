package com.example.zhanfinancebackend.modules.auth.security;

import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class JwtService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final Base64.Encoder URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder URL_DECODER = Base64.getUrlDecoder();

    private final ObjectMapper objectMapper;
    private final String secret;
    private final long accessTokenExpirationMs;

    public JwtService(
            ObjectMapper objectMapper,
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-token-expiration-ms}") long accessTokenExpirationMs
    ) {
        this.objectMapper = objectMapper;
        this.secret = secret;
        this.accessTokenExpirationMs = accessTokenExpirationMs;
    }

    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        Map<String, Object> header = Map.of("alg", "HS256", "typ", "JWT");
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sub", user.getEmail());
        payload.put("uid", user.getId());
        payload.put("role", user.getRole().name());
        payload.put("iat", now.getEpochSecond());
        payload.put("exp", now.plusMillis(accessTokenExpirationMs).getEpochSecond());
        String unsignedToken = encode(header) + "." + encode(payload);
        return unsignedToken + "." + sign(unsignedToken);
    }

    public boolean isTokenValid(String token, String username) {
        try {
            return username.equals(extractUsername(token)) && !isExpired(token) && signatureMatches(token);
        } catch (RuntimeException exception) {
            return false;
        }
    }

    public String extractUsername(String token) {
        return payload(token).get("sub").toString();
    }

    private boolean isExpired(String token) {
        Number expiresAt = (Number) payload(token).get("exp");
        return Instant.now().getEpochSecond() >= expiresAt.longValue();
    }

    private boolean signatureMatches(String token) {
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            return false;
        }
        return sign(parts[0] + "." + parts[1]).equals(parts[2]);
    }

    private String encode(Map<String, Object> value) {
        try {
            byte[] json = objectMapper.writeValueAsBytes(value);
            return URL_ENCODER.encodeToString(json);
        } catch (Exception exception) {
            throw new IllegalStateException("Cannot encode JWT", exception);
        }
    }

    private Map<String, Object> payload(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                throw new IllegalArgumentException("Invalid token");
            }
            byte[] json = URL_DECODER.decode(parts[1]);
            return objectMapper.readValue(json, new TypeReference<>() {
            });
        } catch (Exception exception) {
            throw new IllegalArgumentException("Invalid token", exception);
        }
    }

    private String sign(String value) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
            return URL_ENCODER.encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Cannot sign JWT", exception);
        }
    }
}
