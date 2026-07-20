package com.example.zhanfinancebackend.modules.documents.service;

import com.deepoove.poi.XWPFTemplate;
import com.example.zhanfinancebackend.common.exception.ResourceNotFoundException;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.crm.entity.Task;
import com.example.zhanfinancebackend.modules.crm.repository.TaskRepository;
import com.example.zhanfinancebackend.modules.documents.dto.DocumentDto;
import com.example.zhanfinancebackend.modules.documents.entity.Document;
import com.example.zhanfinancebackend.modules.documents.entity.DocumentTemplate;
import com.example.zhanfinancebackend.modules.documents.repository.DocumentRepository;
import com.example.zhanfinancebackend.modules.documents.repository.DocumentTemplateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import com.example.zhanfinancebackend.modules.crm.entity.ClientProfile;
import com.example.zhanfinancebackend.modules.crm.repository.ClientProfileRepository;
import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.common.exception.ErrorCode;
import java.io.IOException;

@Service
public class DocumentGeneratorService {

    private final DocumentTemplateRepository templateRepository;
    private final TaskRepository taskRepository;
    private final DocumentRepository documentRepository;
    private final StorageService storageService;
    private final DocumentAccessService documentAccessService;
    private final ClientProfileRepository clientProfileRepository;

    public DocumentGeneratorService(DocumentTemplateRepository templateRepository,
                                    TaskRepository taskRepository,
                                    DocumentRepository documentRepository,
                                    StorageService storageService,
                                    DocumentAccessService documentAccessService,
                                    ClientProfileRepository clientProfileRepository) {
        this.templateRepository = templateRepository;
        this.taskRepository = taskRepository;
        this.documentRepository = documentRepository;
        this.storageService = storageService;
        this.documentAccessService = documentAccessService;
        this.clientProfileRepository = clientProfileRepository;
    }

    @Transactional
    public DocumentDto generateFromTemplate(Long taskId, UUID templateId, User actor) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        DocumentTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template not found"));

        User client = task.getClient();
        
        documentAccessService.assertCanCreateFor(actor, client != null ? client : actor);

        Map<String, Object> context = buildContext(task, client);

        byte[] templateBytes = storageService.loadAsBytes(template.getFilePath());

        try {
            XWPFTemplate xwpf = XWPFTemplate.compile(new ByteArrayInputStream(templateBytes))
                    .render(context);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            xwpf.write(out);
            xwpf.close();

            String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            String clientName = client != null ? client.getFullName() : "Без клиента";
            
            String randomHash = UUID.randomUUID().toString().substring(0, 4);
            String fileName = template.getName() + " - " + clientName + " - " + date + "_" + randomHash + ".docx";

            String storageKey = storageService.store(out.toByteArray(), fileName, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

            Document doc = new Document(
                    client != null ? client : actor,
                    actor,
                    fileName,
                    storageKey,
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    (long) out.size()
            );
            doc.setTask(task);
            doc.setGeneratedFromTemplate(template);
            
            doc = documentRepository.save(doc);

            return new DocumentDto(
                    doc.getId(),
                    doc.getUser().getId(),
                    doc.getUser().getFullName(),
                    doc.getTask() != null ? doc.getTask().getId() : null,
                    doc.getFileName(),
                    doc.getContentType(),
                    doc.getFileSize(),
                    doc.getStatus(),
                    doc.getCreatedAt()
            );

        } catch (IOException e) {
            throw new ApiException(ErrorCode.INTERNAL_ERROR, "Ошибка при генерации документа: " + e.getMessage());
        }
    }

    private Map<String, Object> buildContext(Task task, User client) {
        String blank = "______";
        Map<String, Object> ctx = new HashMap<>();

        if (client != null) {
            ctx.put("CLIENT_NAME", safe(client.getFullName(), blank));
            ctx.put("CLIENT_EMAIL", safe(client.getEmail(), blank));
            
            ClientProfile profile = clientProfileRepository.findByUser(client).orElse(null);
            
            ctx.put("CLIENT_IIN", blank);
            ctx.put("CLIENT_PHONE", profile != null ? safe(profile.getPhone(), blank) : blank);
            ctx.put("CLIENT_COMPANY", profile != null ? safe(profile.getCompanyName(), blank) : blank);
        } else {
            ctx.put("CLIENT_NAME", blank);
            ctx.put("CLIENT_IIN", blank);
            ctx.put("CLIENT_EMAIL", blank);
            ctx.put("CLIENT_PHONE", blank);
            ctx.put("CLIENT_COMPANY", blank);
        }

        ctx.put("TASK_TITLE", safe(task.getTitle(), blank));
        ctx.put("TASK_AMOUNT", task.getAmount() != null ? task.getAmount().toString() : blank);
        ctx.put("TASK_DEADLINE", task.getDueDate() != null ? task.getDueDate().toString() : blank);
        ctx.put("TASK_DESCRIPTION", safe(task.getDescription(), blank));
        ctx.put("TASK_SERVICE", !task.getServices().isEmpty() ? task.getServices().get(0).getTitle() : blank);

        ctx.put("DATE_TODAY", LocalDate.now().format(DateTimeFormatter.ofPattern("d MMMM yyyy", new Locale("ru"))));
        ctx.put("DATE_TODAY_SHORT", LocalDate.now().format(DateTimeFormatter.ofPattern("dd.MM.yyyy")));
        ctx.put("YEAR", String.valueOf(LocalDate.now().getYear()));
        Long docNumber = templateRepository.getNextDocNumber();
        ctx.put("DOC_NUMBER", docNumber != null ? docNumber.toString() : blank);

        return ctx;
    }

    private String safe(String value, String fallback) {
        return (value != null && !value.isBlank()) ? value : fallback;
    }
}
