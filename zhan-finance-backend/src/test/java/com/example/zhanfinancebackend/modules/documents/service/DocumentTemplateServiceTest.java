package com.example.zhanfinancebackend.modules.documents.service;

import com.example.zhanfinancebackend.common.exception.ResourceNotFoundException;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.documents.entity.DocumentTemplate;
import com.example.zhanfinancebackend.modules.documents.repository.DocumentRepository;
import com.example.zhanfinancebackend.modules.documents.repository.DocumentTemplateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DocumentTemplateServiceTest {

    @Mock
    private DocumentTemplateRepository templateRepository;
    @Mock
    private StorageService storageService;
    @Mock
    private DocumentRepository documentRepository;

    @InjectMocks
    private DocumentTemplateService templateService;

    private User admin;
    private DocumentTemplate template;
    private UUID templateId;

    @BeforeEach
    void setUp() {
        admin = new User("admin@test.com", "pass", "Admin", Role.ADMIN);
        templateId = UUID.randomUUID();
        template = new DocumentTemplate("Test Template", "Description", "storage/key/test.docx", admin);
        org.springframework.test.util.ReflectionTestUtils.setField(template, "id", templateId);
    }

    @Test
    void deleteTemplate_nullifiesReferencesAndDeletes() {
        // Arrange
        when(templateRepository.findById(templateId)).thenReturn(Optional.of(template));
        doNothing().when(documentRepository).nullifyTemplateReference(templateId);
        doNothing().when(storageService).delete(template.getFilePath());
        doNothing().when(templateRepository).delete(template);

        // Act
        templateService.deleteTemplate(templateId);

        // Assert
        verify(documentRepository).nullifyTemplateReference(templateId);
        verify(storageService).delete(template.getFilePath());
        verify(templateRepository).delete(template);
    }

    @Test
    void deleteTemplate_throwsNotFoundWhenTemplateDoesNotExist() {
        // Arrange
        when(templateRepository.findById(templateId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> templateService.deleteTemplate(templateId));
        
        verify(documentRepository, never()).nullifyTemplateReference(any());
        verify(storageService, never()).delete(anyString());
        verify(templateRepository, never()).delete(any());
    }
}
