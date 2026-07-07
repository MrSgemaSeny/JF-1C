package com.example.zhanfinancebackend.modules.services.entity;

import com.example.zhanfinancebackend.common.audit.BaseEntity;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.crm.entity.Task;
import jakarta.persistence.*;

@Entity
@Table(name = "service_requests")
public class ServiceRequest extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private User client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id")
    private ServiceEntity service;

    @Column(name = "service_title", nullable = false, length = 255)
    private String serviceTitle;

    @Column(name = "client_message", columnDefinition = "TEXT")
    private String clientMessage;

    @Column(name = "preferred_contact_date")
    private java.time.LocalDate preferredContactDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ServiceRequestStatus status = ServiceRequestStatus.NEW;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_employee_id")
    private User assignedEmployee;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "linked_task_id")
    private Task linkedTask;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    public ServiceRequest() {}

    public ServiceRequest(User client, ServiceEntity service, String serviceTitle) {
        this.client = client;
        this.service = service;
        this.serviceTitle = serviceTitle;
    }

    // ========== Getters & Setters ==========

    public User getClient() { return client; }
    public void setClient(User client) { this.client = client; }

    public ServiceEntity getService() { return service; }
    public void setService(ServiceEntity service) { this.service = service; }

    public String getServiceTitle() { return serviceTitle; }
    public void setServiceTitle(String serviceTitle) { this.serviceTitle = serviceTitle; }

    public String getClientMessage() { return clientMessage; }
    public void setClientMessage(String clientMessage) { this.clientMessage = clientMessage; }

    public ServiceRequestStatus getStatus() { return status; }
    public void setStatus(ServiceRequestStatus status) { this.status = status; }

    public java.time.LocalDate getPreferredContactDate() { return preferredContactDate; }
    public void setPreferredContactDate(java.time.LocalDate preferredContactDate) { this.preferredContactDate = preferredContactDate; }

    public User getAssignedEmployee() { return assignedEmployee; }
    public void setAssignedEmployee(User assignedEmployee) { this.assignedEmployee = assignedEmployee; }

    public Task getLinkedTask() { return linkedTask; }
    public void setLinkedTask(Task linkedTask) { this.linkedTask = linkedTask; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
}
