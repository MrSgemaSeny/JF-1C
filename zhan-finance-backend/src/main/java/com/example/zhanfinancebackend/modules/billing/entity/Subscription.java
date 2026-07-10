package com.example.zhanfinancebackend.modules.billing.entity;

import com.example.zhanfinancebackend.common.audit.BaseEntity;
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
import java.time.LocalDate;

@Entity
@Table(name = "subscriptions")
public class Subscription extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    private com.example.zhanfinancebackend.modules.crm.entity.Task task;

    @Column(nullable = false, length = 120)
    private String planName;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal monthlyPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private SubscriptionStatus status = SubscriptionStatus.ACTIVE;

    @Column(nullable = false)
    private LocalDate startsAt;

    private LocalDate endsAt;

    protected Subscription() {
    }

    public Subscription(User user, String planName, BigDecimal monthlyPrice, LocalDate startsAt, LocalDate endsAt) {
        this.user = user;
        this.planName = planName;
        this.monthlyPrice = monthlyPrice;
        this.startsAt = startsAt;
        this.endsAt = endsAt;
    }

    public User getUser() {
        return user;
    }

    public com.example.zhanfinancebackend.modules.crm.entity.Task getTask() {
        return task;
    }

    public void setTask(com.example.zhanfinancebackend.modules.crm.entity.Task task) {
        this.task = task;
    }

    public String getPlanName() {
        return planName;
    }

    public void setPlanName(String planName) {
        this.planName = planName;
    }

    public BigDecimal getMonthlyPrice() {
        return monthlyPrice;
    }

    public void setMonthlyPrice(BigDecimal monthlyPrice) {
        this.monthlyPrice = monthlyPrice;
    }

    public SubscriptionStatus getStatus() {
        return status;
    }

    public void setStatus(SubscriptionStatus status) {
        this.status = status;
    }

    public LocalDate getStartsAt() {
        return startsAt;
    }

    public void setStartsAt(LocalDate startsAt) {
        this.startsAt = startsAt;
    }

    public LocalDate getEndsAt() {
        return endsAt;
    }

    public void setEndsAt(LocalDate endsAt) {
        this.endsAt = endsAt;
    }

    public enum SubscriptionStatus {
        ACTIVE,
        PAUSED,
        CANCELED
    }
}
