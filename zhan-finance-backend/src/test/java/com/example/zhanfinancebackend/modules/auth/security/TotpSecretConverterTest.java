package com.example.zhanfinancebackend.modules.auth.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TotpSecretConverterTest {

    private TotpSecretConverter converter;

    @BeforeEach
    void setUp() {
        TotpSecretConverter.initKey("my-super-secret-key-for-testing-totp-encryption-32-bytes");
        converter = new TotpSecretConverter();
    }

    @Test
    @DisplayName("Encrypts plaintext secret to AES-GCM base64 format starting with enc:")
    void testEncryption() {
        String plainSecret = "JBSWY3DPEHPK3PXP";
        String encrypted = converter.convertToDatabaseColumn(plainSecret);

        assertThat(encrypted).isNotNull();
        assertThat(encrypted).startsWith("enc:");
        assertThat(encrypted).isNotEqualTo(plainSecret);

        String decrypted = converter.convertToEntityAttribute(encrypted);
        assertThat(decrypted).isEqualTo(plainSecret);
    }

    @Test
    @DisplayName("Backward compatibility: legacy plaintext secret without enc: prefix is returned as-is")
    void testBackwardCompatibility() {
        String legacyPlainSecret = "HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ";
        String entityAttribute = converter.convertToEntityAttribute(legacyPlainSecret);

        assertThat(entityAttribute).isEqualTo(legacyPlainSecret);
    }

    @Test
    @DisplayName("Null or blank values are preserved as null")
    void testNullOrBlank() {
        assertThat(converter.convertToDatabaseColumn(null)).isNull();
        assertThat(converter.convertToDatabaseColumn("")).isNull();
        assertThat(converter.convertToEntityAttribute(null)).isNull();
        assertThat(converter.convertToEntityAttribute("")).isNull();
    }
}
