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

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

import com.example.zhanfinancebackend.common.exception.BadRequestException;
import com.example.zhanfinancebackend.common.exception.ResourceNotFoundException;

@Service
@ConditionalOnProperty(name = "app.storage.type", havingValue = "db", matchIfMissing = true)
public class DatabaseStorageService implements StorageService {

    private final StoredFileRepository storedFileRepository;
    private final LocalStorageService localStorageService;

    public DatabaseStorageService(StoredFileRepository storedFileRepository, org.springframework.beans.factory.ObjectProvider<LocalStorageService> localStorageServiceProvider) {
        this.storedFileRepository = storedFileRepository;
        this.localStorageService = localStorageServiceProvider.getIfAvailable();
    }

    @Override
    public String store(MultipartFile file) {
        try {
            if (file.isEmpty()) {
                throw new BadRequestException("Failed to store empty file.");
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
    public String store(byte[] content, String originalFilename, String contentType) {
        String cleanFilename = StringUtils.cleanPath(originalFilename != null ? originalFilename : "unknown");
        String storageKey = UUID.randomUUID().toString();
        
        StoredFile storedFile = new StoredFile(
            storageKey,
            cleanFilename,
            contentType,
            content
        );
        
        storedFileRepository.save(storedFile);
        return storageKey;
    }

    @Override
    public byte[] loadAsBytes(String storageKey) {
        java.util.Optional<StoredFile> fileOpt = storedFileRepository.findById(storageKey);
        if (fileOpt.isPresent()) {
            return fileOpt.get().getData();
        }
        
        if (localStorageService != null) {
            try {
                return localStorageService.loadAsBytes(storageKey);
            } catch (Exception e) {
                try {
                    return localStorageService.loadAsBytes("avatars/" + storageKey);
                } catch (Exception ex) {
                    throw new ResourceNotFoundException("Could not read file: " + storageKey);
                }
            }
        }
        throw new ResourceNotFoundException("Could not read file: " + storageKey);
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
        
        if (localStorageService != null) {
            try {
                return localStorageService.loadAsResource(storageKey);
            } catch (Exception e) {
                try {
                    return localStorageService.loadAsResource("avatars/" + storageKey);
                } catch (Exception ex) {
                    throw new ResourceNotFoundException("Could not read file: " + storageKey);
                }
            }
        }
        throw new ResourceNotFoundException("Could not read file: " + storageKey);
    }

    @Override
    public void delete(String storageKey) {
        storedFileRepository.deleteById(storageKey);
    }
}

