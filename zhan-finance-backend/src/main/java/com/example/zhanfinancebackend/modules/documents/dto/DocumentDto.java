package com.example.zhanfinancebackend.modules.documents.dto;

import java.time.LocalDateTime;

public class DocumentDto {
    private Long id;
    private Long userId;
    private String clientName;
    private Long taskId;
    private String fileName;
    private String contentType;
    private Long fileSize;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime confirmedAt;
    private String confirmedIp;
    private String folder;
    
    public DocumentDto(Long id, Long userId, String clientName, Long taskId, String fileName, String contentType, Long fileSize, String status, LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.clientName = clientName;
        this.taskId = taskId;
        this.fileName = fileName;
        this.contentType = contentType;
        this.fileSize = fileSize;
        this.status = status;
        this.createdAt = createdAt;
    }

    public DocumentDto(Long id, Long userId, String clientName, Long taskId, String fileName, String contentType, Long fileSize, String status, LocalDateTime createdAt, LocalDateTime confirmedAt, String confirmedIp, String folder) {
        this.id = id;
        this.userId = userId;
        this.clientName = clientName;
        this.taskId = taskId;
        this.fileName = fileName;
        this.contentType = contentType;
        this.fileSize = fileSize;
        this.status = status;
        this.createdAt = createdAt;
        this.confirmedAt = confirmedAt;
        this.confirmedIp = confirmedIp;
        this.folder = folder;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }
    public Long getTaskId() { return taskId; }
    public void setTaskId(Long taskId) { this.taskId = taskId; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getConfirmedAt() { return confirmedAt; }
    public void setConfirmedAt(LocalDateTime confirmedAt) { this.confirmedAt = confirmedAt; }
    public String getConfirmedIp() { return confirmedIp; }
    public void setConfirmedIp(String confirmedIp) { this.confirmedIp = confirmedIp; }
    public String getFolder() { return folder; }
    public void setFolder(String folder) { this.folder = folder; }
}
