package com.example.zhanfinancebackend.modules.documents.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "stored_files")
public class StoredFile {
    @Id
    @Column(name = "id", nullable = false, length = 64)
    private String id; // UUID string

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "content_type")
    private String contentType;

    @Lob
    @Column(name = "data", nullable = false)
    private byte[] data;

    public StoredFile() {}

    public StoredFile(String id, String fileName, String contentType, byte[] data) {
        this.id = id;
        this.fileName = fileName;
        this.contentType = contentType;
        this.data = data;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public byte[] getData() { return data; }
    public void setData(byte[] data) { this.data = data; }
}
