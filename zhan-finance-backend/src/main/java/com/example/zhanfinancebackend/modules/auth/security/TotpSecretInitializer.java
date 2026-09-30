package com.example.zhanfinancebackend.modules.auth.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class TotpSecretInitializer {

    public TotpSecretInitializer(
            @Value("${app.security.totp-encryption-key:${app.jwt.secret:default-insecure-test-secret-minimum-32-chars}}") String secret
    ) {
        TotpSecretConverter.initKey(secret);
    }
}
