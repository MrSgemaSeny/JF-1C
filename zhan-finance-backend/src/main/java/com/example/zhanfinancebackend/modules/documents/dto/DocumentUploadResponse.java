package com.example.zhanfinancebackend.modules.documents.dto;

public class DocumentUploadResponse {
    private Long id;
    private String fileName;
    
    public DocumentUploadResponse(Long id, String fileName) {
        this.id = id;
        this.fileName = fileName;
    }
    
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
}
