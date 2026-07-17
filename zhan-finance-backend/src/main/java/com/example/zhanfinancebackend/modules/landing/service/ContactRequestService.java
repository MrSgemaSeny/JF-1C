package com.example.zhanfinancebackend.modules.landing.service;

import com.example.zhanfinancebackend.common.exception.ResourceNotFoundException;
import com.example.zhanfinancebackend.modules.landing.dto.*;
import com.example.zhanfinancebackend.modules.landing.entity.ContactRequest;
import com.example.zhanfinancebackend.modules.landing.entity.ContactRequest.ContactRequestStatus;
import com.example.zhanfinancebackend.modules.landing.entity.ContactRequestFile;
import com.example.zhanfinancebackend.modules.landing.repository.ContactRequestFileRepository;
import com.example.zhanfinancebackend.modules.landing.repository.ContactRequestRepository;
import com.example.zhanfinancebackend.modules.documents.service.StorageService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ContactRequestService {

    private final ContactRequestRepository contactRequestRepository;
    private final ContactRequestFileRepository fileRepository;
    private final StorageService storageService;

    public ContactRequestService(
            ContactRequestRepository contactRequestRepository,
            ContactRequestFileRepository fileRepository,
            StorageService storageService) {
        this.contactRequestRepository = contactRequestRepository;
        this.fileRepository = fileRepository;
        this.storageService = storageService;
    }

    @Transactional
    public ContactRequestDto create(ContactRequestCreateRequest request) {
        ContactRequest contactRequest = new ContactRequest(
                request.name(),
                request.phone(),
                request.message(),
                request.source()
        );
        return toDto(contactRequestRepository.save(contactRequest));
    }

    @Transactional(readOnly = true)
    public List<ContactRequestDto> findAll() {
        return contactRequestRepository.findAll().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public ContactRequestDto findById(Long id) {
        return toDto(get(id));
    }

    @Transactional
    public ContactRequestDto updateStatus(Long id, ContactRequestStatus status) {
        ContactRequest contactRequest = get(id);
        contactRequest.setStatus(status);
        return toDto(contactRequest);
    }

    @Transactional
    public void delete(Long id) {
        ContactRequest contactRequest = get(id);
        contactRequestRepository.delete(contactRequest);
    }

    @Transactional
    public List<ContactRequestFileDto> uploadFiles(Long id, MultipartFile[] files) {
        ContactRequest contactRequest = get(id);
        List<ContactRequestFile> savedFiles = new ArrayList<>();
        
        for (MultipartFile file : files) {
            String storageKey = storageService.store(file);
            ContactRequestFile requestFile = new ContactRequestFile(
                    contactRequest,
                    file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown",
                    storageKey,
                    file.getContentType() != null ? file.getContentType() : "application/octet-stream",
                    file.getSize()
            );
            savedFiles.add(fileRepository.save(requestFile));
        }

        return savedFiles.stream()
                .map(f -> new ContactRequestFileDto(f.getId(), f.getFileName(), f.getContentType(), f.getFileSize()))
                .collect(Collectors.toList());
    }


    private ContactRequest get(Long id) {
        return contactRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contact request not found"));
    }

    private ContactRequestDto toDto(ContactRequest contactRequest) {
        return new ContactRequestDto(
                contactRequest.getId(),
                contactRequest.getName(),
                contactRequest.getPhone(),
                contactRequest.getMessage(),
                contactRequest.getSource(),
                contactRequest.getStatus(),
                contactRequest.getCreatedAt(),
                contactRequest.getUpdatedAt()
        );
    }
}
