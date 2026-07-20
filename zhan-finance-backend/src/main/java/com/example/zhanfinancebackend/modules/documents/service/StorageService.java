package com.example.zhanfinancebackend.modules.documents.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
    String store(MultipartFile file);
    String store(byte[] content, String originalFilename, String contentType);
    Resource loadAsResource(String storageKey);
    byte[] loadAsBytes(String storageKey);
    void delete(String storageKey);
}
