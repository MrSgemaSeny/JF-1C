package com.example.zhanfinancebackend.modules.landing.service;

import com.example.zhanfinancebackend.common.exception.ResourceNotFoundException;
import com.example.zhanfinancebackend.modules.landing.dto.*;
import com.example.zhanfinancebackend.modules.landing.entity.ContactRequest;
import com.example.zhanfinancebackend.modules.landing.entity.ContactRequest.ContactRequestStatus;
import com.example.zhanfinancebackend.modules.landing.entity.ContactRequestFile;
import com.example.zhanfinancebackend.modules.landing.repository.ContactRequestFileRepository;
import com.example.zhanfinancebackend.modules.landing.repository.ContactRequestRepository;
import com.example.zhanfinancebackend.modules.documents.service.StorageService;
import com.example.zhanfinancebackend.modules.notifications.service.EmailNotificationService;
import com.example.zhanfinancebackend.modules.notifications.service.NotificationService;
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
    private final NotificationService notificationService;
    private final EmailNotificationService emailNotificationService;

    public ContactRequestService(
            ContactRequestRepository contactRequestRepository,
            ContactRequestFileRepository fileRepository,
            StorageService storageService,
            NotificationService notificationService,
            EmailNotificationService emailNotificationService) {
        this.contactRequestRepository = contactRequestRepository;
        this.fileRepository = fileRepository;
        this.storageService = storageService;
        this.notificationService = notificationService;
        this.emailNotificationService = emailNotificationService;
    }

    @Transactional
    public ContactRequestDto create(ContactRequestCreateRequest request) {
        ContactRequest contactRequest = new ContactRequest(
                request.name(),
                request.phone(),
                request.email(),
                request.message(),
                request.source()
        );
        ContactRequest saved = contactRequestRepository.save(contactRequest);

        // Уведомление менеджерам (админам)
        try {
            String title = "Новый лид: " + request.name();
            String message = "Телефон: " + request.phone() + (request.email() != null ? ", Email: " + request.email() : "");
            notificationService.notifyAdmins(title, message, "/admin/leads");
        } catch (Exception e) {
            // Игнорируем ошибку уведомлений, чтобы не сбросить создание лида
        }

        // Email самому лиду
        if (request.email() != null && !request.email().isBlank()) {
            try {
                String subject = "Мы получили вашу заявку - Zhan Finance";
                String htmlBody = "<h3>Здравствуйте, " + request.name() + "!</h3>" +
                                  "<p>Мы успешно получили вашу заявку. Наш менеджер скоро свяжется с вами по номеру " + request.phone() + ".</p>" +
                                  "<p>Спасибо за интерес к Zhan Finance!</p>";
                emailNotificationService.sendHtmlEmail(request.email(), subject, htmlBody);
            } catch (Exception e) {
                // Игнорируем ошибку отправки письма
            }
        }

        return toDto(saved);
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
                contactRequest.getEmail(),
                contactRequest.getMessage(),
                contactRequest.getSource(),
                contactRequest.getStatus(),
                contactRequest.getCreatedAt(),
                contactRequest.getUpdatedAt()
        );
    }
}
