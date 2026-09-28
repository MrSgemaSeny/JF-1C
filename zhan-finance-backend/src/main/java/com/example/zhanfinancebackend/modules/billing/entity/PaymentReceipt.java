package com.example.zhanfinancebackend.modules.billing.entity;

import com.example.zhanfinancebackend.common.audit.BaseEntity;
import com.example.zhanfinancebackend.modules.audit.annotation.AuditedEntity;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "payment_receipts")
@AuditedEntity
public class PaymentReceipt extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id", nullable = false)
    private User client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_id")
    private Subscription subscription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id")
    private Invoice invoice;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency = "KZT";

    @Column(name = "receipt_file_key", nullable = false, columnDefinition = "TEXT")
    private String receiptFileKey;

    @Column(name = "receipt_file_url", columnDefinition = "TEXT")
    private String receiptFileUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private PaymentReceiptStatus status = PaymentReceiptStatus.AWAITING_REVIEW;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "reject_note", columnDefinition = "TEXT")
    private String rejectNote;

    protected PaymentReceipt() {
    }

    public PaymentReceipt(User client, Subscription subscription, Invoice invoice,
                          BigDecimal amount, String currency, String receiptFileKey) {
        this.client = client;
        this.subscription = subscription;
        this.invoice = invoice;
        this.amount = amount;
        this.currency = currency != null ? currency : "KZT";
        this.receiptFileKey = receiptFileKey;
        this.status = PaymentReceiptStatus.AWAITING_REVIEW;
    }

    public User getClient() {
        return client;
    }

    public void setClient(User client) {
        this.client = client;
    }

    public Subscription getSubscription() {
        return subscription;
    }

    public void setSubscription(Subscription subscription) {
        this.subscription = subscription;
    }

    public Invoice getInvoice() {
        return invoice;
    }

    public void setInvoice(Invoice invoice) {
        this.invoice = invoice;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getReceiptFileKey() {
        return receiptFileKey;
    }

    public void setReceiptFileKey(String receiptFileKey) {
        this.receiptFileKey = receiptFileKey;
    }

    public String getReceiptFileUrl() {
        return receiptFileUrl;
    }

    public void setReceiptFileUrl(String receiptFileUrl) {
        this.receiptFileUrl = receiptFileUrl;
    }

    public PaymentReceiptStatus getStatus() {
        return status;
    }

    public void setStatus(PaymentReceiptStatus status) {
        this.status = status;
    }

    public User getReviewedBy() {
        return reviewedBy;
    }

    public void setReviewedBy(User reviewedBy) {
        this.reviewedBy = reviewedBy;
    }

    public Instant getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(Instant reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public String getRejectNote() {
        return rejectNote;
    }

    public void setRejectNote(String rejectNote) {
        this.rejectNote = rejectNote;
    }
}
