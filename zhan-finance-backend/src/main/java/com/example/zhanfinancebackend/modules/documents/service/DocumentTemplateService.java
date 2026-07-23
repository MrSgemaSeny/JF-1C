package com.example.zhanfinancebackend.modules.documents.service;

import com.example.zhanfinancebackend.common.exception.ResourceNotFoundException;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.documents.dto.DocumentTemplateDto;
import com.example.zhanfinancebackend.modules.documents.entity.DocumentTemplate;
import com.example.zhanfinancebackend.modules.documents.repository.DocumentTemplateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.core.io.Resource;

import com.example.zhanfinancebackend.common.exception.BadRequestException;

@Service
public class DocumentTemplateService {

    private final DocumentTemplateRepository templateRepository;
    private final StorageService storageService;

    public DocumentTemplateService(DocumentTemplateRepository templateRepository, StorageService storageService) {
        this.templateRepository = templateRepository;
        this.storageService = storageService;
    }

    @Transactional
    public DocumentTemplateDto uploadTemplate(String name, String description, MultipartFile file, User actor) {
        if (!"application/vnd.openxmlformats-officedocument.wordprocessingml.document".equals(file.getContentType())) {
            throw new BadRequestException("Only .docx templates are allowed");
        }

        String storageKey = storageService.store(file);

        DocumentTemplate template = new DocumentTemplate(
                name,
                description,
                storageKey,
                actor
        );

        template = templateRepository.save(template);
        return mapToDto(template);
    }

    @Transactional(readOnly = true)
    public List<DocumentTemplateDto> getAllTemplates() {
        return templateRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteTemplate(UUID id) {
        DocumentTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Template not found"));
        
        storageService.delete(template.getFilePath());
        templateRepository.delete(template);
    }

    @Transactional(readOnly = true)
    public Resource getTemplateResource(UUID id) {
        DocumentTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Template not found"));
        return storageService.loadAsResource(template.getFilePath());
    }

    private DocumentTemplateDto mapToDto(DocumentTemplate template) {
        return new DocumentTemplateDto(
                template.getId(),
                template.getName(),
                template.getDescription(),
                template.getCreatedAt(),
                template.getCreatedBy() != null ? template.getCreatedBy().getFullName() : null
        );
    }
}
