package com.example.zhanfinancebackend.modules.landing.service;

import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.common.exception.ErrorCode;
import com.example.zhanfinancebackend.modules.landing.dto.ContactRequestCreateRequest;
import com.example.zhanfinancebackend.modules.landing.dto.ContactRequestDto;
import com.example.zhanfinancebackend.modules.landing.entity.ContactRequest;
import com.example.zhanfinancebackend.modules.landing.entity.ContactRequest.ContactRequestStatus;
import com.example.zhanfinancebackend.modules.landing.repository.ContactRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ContactRequestService {

    private final ContactRequestRepository contactRequestRepository;

    public ContactRequestService(ContactRequestRepository contactRequestRepository) {
        this.contactRequestRepository = contactRequestRepository;
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

    private ContactRequest get(Long id) {
        return contactRequestRepository.findById(id)
                .orElseThrow(() -> new com.example.zhanfinancebackend.common.exception.ResourceNotFoundException("Contact request not found"));
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

