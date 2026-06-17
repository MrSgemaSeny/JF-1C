package com.example.zhanfinancebackend.modules.landing.entity;

import com.example.zhanfinancebackend.common.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

@Entity
@Table(name = "contact_requests")
public class ContactRequest extends BaseEntity {

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 40)
    private String phone;

    @Column(length = 600)
    private String message;

    @Column(nullable = false, length = 80)
    private String source = "landing";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ContactRequestStatus status = ContactRequestStatus.NEW;

    protected ContactRequest() {
    }

    public ContactRequest(String name, String phone, String message, String source) {
        this.name = name;
        this.phone = phone;
        this.message = message;
        if (source != null && !source.isBlank()) {
            this.source = source;
        }
    }

    public String getName() {
        return name;
    }

    public String getPhone() {
        return phone;
    }

    public String getMessage() {
        return message;
    }

    public String getSource() {
        return source;
    }

    public ContactRequestStatus getStatus() {
        return status;
    }

    public void setStatus(ContactRequestStatus status) {
        this.status = status;
    }

    public enum ContactRequestStatus {
        NEW,
        IN_PROGRESS,
        DONE,
        CANCELED
    }
}
