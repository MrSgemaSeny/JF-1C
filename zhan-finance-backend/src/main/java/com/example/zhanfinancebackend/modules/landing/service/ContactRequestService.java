package com.example.zhanfinancebackend.modules.landing.service;

import com.example.zhanfinancebackend.common.exception.ResourceNotFoundException;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.auth.security.UserPrincipal;
import com.example.zhanfinancebackend.modules.crm.entity.LeadSource;
import com.example.zhanfinancebackend.modules.crm.entity.Task;
import com.example.zhanfinancebackend.modules.crm.mapper.TaskMapper;
import com.example.zhanfinancebackend.modules.crm.repository.TaskRepository;
import com.example.zhanfinancebackend.modules.documents.entity.Document;
import com.example.zhanfinancebackend.modules.documents.repository.DocumentRepository;
import com.example.zhanfinancebackend.modules.documents.service.StorageService;
import com.example.zhanfinancebackend.modules.landing.dto.*;
import com.example.zhanfinancebackend.modules.landing.entity.ContactRequest;
import com.example.zhanfinancebackend.modules.landing.entity.ContactRequest.ContactRequestStatus;
import com.example.zhanfinancebackend.modules.landing.entity.ContactRequestFile;
import com.example.zhanfinancebackend.modules.landing.repository.ContactRequestFileRepository;
import com.example.zhanfinancebackend.modules.landing.repository.ContactRequestRepository;
import com.example.zhanfinancebackend.modules.services.repository.ServiceRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ContactRequestService {

    private final ContactRequestRepository contactRequestRepository;
    private final ContactRequestFileRepository fileRepository;
    private final StorageService storageService;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final DocumentRepository documentRepository;
    private final ServiceRepository serviceRepository;
    private final PasswordEncoder passwordEncoder;
    private final TaskMapper taskMapper;

    public ContactRequestService(
            ContactRequestRepository contactRequestRepository,
            ContactRequestFileRepository fileRepository,
            StorageService storageService,
            UserRepository userRepository,
            TaskRepository taskRepository,
            DocumentRepository documentRepository,
            ServiceRepository serviceRepository,
            PasswordEncoder passwordEncoder,
            TaskMapper taskMapper) {
        this.contactRequestRepository = contactRequestRepository;
        this.fileRepository = fileRepository;
        this.storageService = storageService;
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.documentRepository = documentRepository;
        this.serviceRepository = serviceRepository;
        this.passwordEncoder = passwordEncoder;
        this.taskMapper = taskMapper;
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

    @Transactional
    public ContactRequestConvertResponse convert(Long id, ContactRequestConvertRequest request) {
        ContactRequest contactRequest = get(id);
        
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User actor = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));

        String generatedPassword = null;
        User targetUser = userRepository.findByEmailIgnoreCase(request.email()).orElse(null);
        
        if (targetUser == null) {
            generatedPassword = UUID.randomUUID().toString().substring(0, 8);
            targetUser = new User(
                    contactRequest.getName(),
                    request.email(),
                    passwordEncoder.encode(generatedPassword),
                    Role.CLIENT
            );
            targetUser = userRepository.save(targetUser);
        }

        Task task = new Task("Converted from Contact Request: " + contactRequest.getName(), targetUser, actor);
        task.setDescription(contactRequest.getMessage());
        task.setSource(LeadSource.WEBSITE);
        
        if (request.serviceIds() != null && !request.serviceIds().isEmpty()) {
            List<com.example.zhanfinancebackend.modules.services.entity.ServiceEntity> services = 
                    serviceRepository.findAllById(request.serviceIds());
            task.setServices(services);
        }
        
        task = taskRepository.save(task);

        List<ContactRequestFile> requestFiles = fileRepository.findByContactRequestId(id);
        for (ContactRequestFile f : requestFiles) {
            Document document = new Document(
                    targetUser,
                    actor,
                    f.getFileName(),
                    f.getStorageKey(),
                    f.getContentType(),
                    f.getFileSize()
            );
            document.setTask(task);
            documentRepository.save(document);
            fileRepository.delete(f);
        }

        contactRequest.setStatus(ContactRequestStatus.DONE);
        contactRequestRepository.save(contactRequest);

        return new ContactRequestConvertResponse(taskMapper.mapToDto(task), generatedPassword);
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
