package com.example.zhanfinancebackend.modules.billing.service;

import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.billing.entity.PaymentReceipt;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PaymentReceiptAccessServiceTest {

    private PaymentReceiptAccessService accessService;

    private User admin;
    private User client1;
    private User client2;
    private PaymentReceipt receiptClient1;

    @BeforeEach
    void setUp() {
        accessService = new PaymentReceiptAccessService();

        admin = new User("admin@test.com", "hash", "Admin User", Role.ADMIN);
        admin.setId(1L);

        client1 = new User("client1@test.com", "hash", "Client One", Role.CLIENT);
        client1.setId(10L);

        client2 = new User("client2@test.com", "hash", "Client Two", Role.CLIENT);
        client2.setId(20L);

        receiptClient1 = new PaymentReceipt(client1, null, null, BigDecimal.valueOf(50000), "KZT", "receipts/test.pdf");
        receiptClient1.setId(100L);
    }

    @Test
    @DisplayName("Admin can read any payment receipt")
    void adminCanReadAnyReceipt() {
        assertThat(accessService.canRead(admin, receiptClient1)).isTrue();
        accessService.assertCanRead(admin, receiptClient1);
    }

    @Test
    @DisplayName("Client can read their own payment receipt")
    void clientCanReadOwnReceipt() {
        assertThat(accessService.canRead(client1, receiptClient1)).isTrue();
        accessService.assertCanRead(client1, receiptClient1);
    }

    @Test
    @DisplayName("Client cannot read another client's payment receipt")
    void clientCannotReadOtherClientReceipt() {
        assertThat(accessService.canRead(client2, receiptClient1)).isFalse();
        assertThatThrownBy(() -> accessService.assertCanRead(client2, receiptClient1))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("Admin has review permissions")
    void adminCanReview() {
        assertThat(accessService.canReview(admin)).isTrue();
        accessService.assertCanReview(admin);
    }

    @Test
    @DisplayName("Client does not have review permissions")
    void clientCannotReview() {
        assertThat(accessService.canReview(client1)).isFalse();
        assertThatThrownBy(() -> accessService.assertCanReview(client1))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("Client and Admin can submit receipts")
    void clientAndAdminCanSubmit() {
        assertThat(accessService.canSubmit(client1)).isTrue();
        accessService.assertCanSubmit(client1);

        assertThat(accessService.canSubmit(admin)).isTrue();
        accessService.assertCanSubmit(admin);
    }
}
