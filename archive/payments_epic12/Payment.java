package com.example.zhanfinancebackend.modules.billing.entity;

import com.example.zhanfinancebackend.common.audit.BaseEntity;
import com.example.zhanfinancebackend.modules.audit.annotation.AuditedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "payments")
@AuditedEntity
public class Payment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invoice_id")
    private Invoice invoice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private PaymentProvider provider;

    @Column(name = "provider_transaction_id", nullable = false, length = 100, unique = true)
    private String providerTransactionId;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private PaymentStatus status;

    protected Payment() {
    }

    public Payment(Invoice invoice, PaymentProvider provider, String providerTransactionId, BigDecimal amount, PaymentStatus status) {
        this.invoice = invoice;
        this.provider = provider;
        this.providerTransactionId = providerTransactionId;
        this.amount = amount;
        this.status = status;
    }

    public Invoice getInvoice() {
        return invoice;
    }

    public PaymentProvider getProvider() {
        return provider;
    }

    public String getProviderTransactionId() {
        return providerTransactionId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public void setStatus(PaymentStatus status) {
        this.status = status;
    }

    public enum PaymentProvider {
        KASPI,
        HALYK
    }

    public enum PaymentStatus {
        SUCCESS,
        FAILED,
        PENDING
    }
}
