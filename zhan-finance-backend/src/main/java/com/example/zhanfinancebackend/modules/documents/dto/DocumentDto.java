package com.example.zhanfinancebackend.modules.documents.dto;

import java.time.LocalDateTime;

public class DocumentDto {
    private Long id;
    private Long userId;
    private String fileName;
    private String contentType;
    private Long fileSize;
    private LocalDateTime createdAt;
    
    public DocumentDto(Long id, Long userId, String fileName, String contentType, Long fileSize, LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.fileName = fileName;
        this.contentType = contentType;
        this.fileSize = fileSize;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
