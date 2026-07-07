package com.example.zhanfinancebackend.modules.documents.service;

import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.common.exception.ErrorCode;
import com.example.zhanfinancebackend.modules.documents.entity.StoredFile;
import com.example.zhanfinancebackend.modules.documents.repository.StoredFileRepository;
import org.springframework.context.annotation.Primary;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
@Primary
public class DatabaseStorageService implements StorageService {

    private final StoredFileRepository storedFileRepository;
    private final LocalStorageService localStorageService;

    public DatabaseStorageService(StoredFileRepository storedFileRepository, LocalStorageService localStorageService) {
        this.storedFileRepository = storedFileRepository;
        this.localStorageService = localStorageService;
    }

    @Override
    public String store(MultipartFile file) {
        try {
            if (file.isEmpty()) {
                throw new com.example.zhanfinancebackend.common.exception.BadRequestException("Failed to store empty file.");
            }
            
            String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown");
            String storageKey = UUID.randomUUID().toString();
            
            StoredFile storedFile = new StoredFile(
                storageKey,
                originalFilename,
                file.getContentType(),
                file.getBytes()
            );
            
            storedFileRepository.save(storedFile);
            return storageKey;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file in database.");
        }
    }

    @Override
    public Resource loadAsResource(String storageKey) {
        java.util.Optional<StoredFile> fileOpt = storedFileRepository.findById(storageKey);
        if (fileOpt.isPresent()) {
            StoredFile storedFile = fileOpt.get();
            return new ByteArrayResource(storedFile.getData()) {
                @Override
                public String getFilename() {
                    return storedFile.getFileName();
                }
            };
        }
        
        try {
            return localStorageService.loadAsResource(storageKey);
        } catch (Exception e) {
            try {
                return localStorageService.loadAsResource("avatars/" + storageKey);
            } catch (Exception ex) {
                throw new com.example.zhanfinancebackend.common.exception.ResourceNotFoundException("Could not read file: " + storageKey);
            }
        }
    }

    @Override
    public void delete(String storageKey) {
        storedFileRepository.deleteById(storageKey);
    }
}

