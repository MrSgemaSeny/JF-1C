package com.example.zhanfinancebackend.modules.documents.service;

import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.crm.entity.ClientProfile;
import com.example.zhanfinancebackend.modules.crm.entity.Task;
import com.example.zhanfinancebackend.modules.crm.repository.ClientProfileRepository;
import com.example.zhanfinancebackend.modules.crm.repository.TaskRepository;
import com.example.zhanfinancebackend.modules.documents.dto.DocumentDto;
import com.example.zhanfinancebackend.modules.documents.entity.Document;
import com.example.zhanfinancebackend.modules.documents.entity.DocumentTemplate;
import com.example.zhanfinancebackend.modules.documents.repository.DocumentRepository;
import com.example.zhanfinancebackend.modules.documents.repository.DocumentTemplateRepository;
import com.example.zhanfinancebackend.modules.services.entity.ServiceEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DocumentGeneratorServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private DocumentTemplateRepository templateRepository;

    @Mock
    private StorageService storageService;

    @Mock
    private DocumentAccessService documentAccessService;

    @Mock
    private ClientProfileRepository clientProfileRepository;

    @Mock
    private DocumentRepository documentRepository;

    private DocumentDataLoader documentDataLoader;

    private DocumentGeneratorService documentGeneratorService;

    private User adminUser;
    private User clientUser;
    private Task task;
    private DocumentTemplate template;
    private ServiceEntity serviceEntity;

    @BeforeEach
    void setUp() {
        documentDataLoader = new DocumentDataLoader(
                taskRepository,
                templateRepository,
                storageService,
                documentAccessService,
                clientProfileRepository
        );

        documentGeneratorService = new DocumentGeneratorService(
                templateRepository,
                taskRepository,
                documentRepository,
                storageService,
                documentAccessService,
                clientProfileRepository,
                documentDataLoader
        );

        adminUser = new User("Admin User", "admin@example.com", "pass", Role.ADMIN);
        adminUser.setId(1L);

        clientUser = new User("Client User", "client@example.com", "pass", Role.CLIENT);
        clientUser.setId(2L);

        task = new Task();
        task.setId(10L);
        task.setTitle("Консультация по НДС");
        task.setDescription("Описание задачи");
        task.setAmount(new BigDecimal("150000.00"));
        task.setDueDate(LocalDate.of(2026, 8, 15));
        task.setClient(clientUser);

        serviceEntity = new ServiceEntity();
        serviceEntity.setTitle("Налоговый аудит");
        task.setServices(List.of(serviceEntity));

        template = new DocumentTemplate("Акт выполненных работ", "Шаблон", "templates/avr.docx", adminUser);
    }

    @Test
    @DisplayName("DocumentDataLoader.load() корректно формирует контекст с getTitle() и docNumber")
    void testDocumentDataLoader_Load_BuildsCorrectContext() {
        when(taskRepository.findById(10L)).thenReturn(Optional.of(task));
        when(templateRepository.findById(any(UUID.class))).thenReturn(Optional.of(template));
        when(storageService.loadAsBytes("templates/avr.docx")).thenReturn(new byte[]{1, 2, 3});
        when(templateRepository.getNextDocNumber()).thenReturn(1042L);

        ClientProfile profile = new ClientProfile(clientUser);
        profile.setCompanyName("ИП Иванов");
        profile.setPhone("+77011234567");
        when(clientProfileRepository.findByUser(clientUser)).thenReturn(Optional.of(profile));

        UUID templateId = UUID.randomUUID();
        DocumentGeneratorService.GenerationData data = documentDataLoader.load(10L, templateId, adminUser);

        assertThat(data).isNotNull();
        assertThat(data.context()).containsEntry("TASK_TITLE", "Консультация по НДС");
        assertThat(data.context()).containsEntry("TASK_SERVICE", "Налоговый аудит");
        assertThat(data.context()).containsEntry("CLIENT_NAME", "Client User");
        assertThat(data.context()).containsEntry("CLIENT_COMPANY", "ИП Иванов");
        assertThat(data.context()).containsEntry("DOC_NUMBER", "1042");

        verify(documentAccessService).assertCanCreateFor(eq(adminUser), eq(clientUser));
    }

    @Test
    @DisplayName("saveDocument() сохраняет документ в репозитории и возвращает DocumentDto")
    void testSaveDocument_SavesAndReturnsDto() {
        when(storageService.store(any(byte[].class), anyString(), anyString())).thenReturn("documents/avr_123.docx");

        Document savedDoc = new Document(clientUser, adminUser, "Акт.docx", "documents/avr_123.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 100L);
        savedDoc.setId(500L);
        savedDoc.setTask(task);
        savedDoc.setGeneratedFromTemplate(template);
        when(documentRepository.save(any(Document.class))).thenReturn(savedDoc);

        DocumentGeneratorService.GenerationData data = new DocumentGeneratorService.GenerationData(
                task, template, clientUser, Map.of("TASK_TITLE", "Консультация"), new byte[]{1, 2, 3}
        );

        DocumentDto dto = documentGeneratorService.saveDocument(data, new byte[]{1, 2, 3, 4}, adminUser);

        assertThat(dto).isNotNull();
        assertThat(dto.getId()).isEqualTo(500L);
        assertThat(dto.getFileName()).isEqualTo("Акт.docx");
        assertThat(dto.getTaskId()).isEqualTo(10L);
        assertThat(dto.getClientName()).isEqualTo("Client User");
        verify(documentRepository).save(any(Document.class));
    }
}
