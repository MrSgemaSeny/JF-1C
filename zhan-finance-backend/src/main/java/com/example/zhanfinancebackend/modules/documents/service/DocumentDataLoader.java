package com.example.zhanfinancebackend.modules.documents.service;

import com.example.zhanfinancebackend.common.exception.ResourceNotFoundException;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.crm.entity.ClientProfile;
import com.example.zhanfinancebackend.modules.crm.entity.Task;
import com.example.zhanfinancebackend.modules.crm.repository.ClientProfileRepository;
import com.example.zhanfinancebackend.modules.crm.repository.TaskRepository;
import com.example.zhanfinancebackend.modules.documents.entity.DocumentTemplate;
import com.example.zhanfinancebackend.modules.documents.repository.DocumentTemplateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Отдельный сервис для чтения данных, необходимых при генерации документа.
 * Вынесен из DocumentGeneratorService чтобы Spring AOP Proxy корректно
 * открывал readOnly транзакцию без self-invocation проблемы.
 */
@Service
public class DocumentDataLoader {

    private final TaskRepository taskRepository;
    private final DocumentTemplateRepository templateRepository;
    private final StorageService storageService;
    private final DocumentAccessService documentAccessService;
    private final ClientProfileRepository clientProfileRepository;

    public DocumentDataLoader(TaskRepository taskRepository,
                              DocumentTemplateRepository templateRepository,
                              StorageService storageService,
                              DocumentAccessService documentAccessService,
                              ClientProfileRepository clientProfileRepository) {
        this.taskRepository = taskRepository;
        this.templateRepository = templateRepository;
        this.storageService = storageService;
        this.documentAccessService = documentAccessService;
        this.clientProfileRepository = clientProfileRepository;
    }

    @Transactional(readOnly = true)
    public DocumentGeneratorService.GenerationData load(Long taskId, UUID templateId, User actor) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        DocumentTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template not found"));

        User rawClient = task.getClient();
        User client = rawClient != null ? (User) org.hibernate.Hibernate.unproxy(rawClient) : null;
        User realActor = actor != null ? (User) org.hibernate.Hibernate.unproxy(actor) : null;

        documentAccessService.assertCanCreateFor(realActor, client != null ? client : realActor);

        Map<String, Object> context = buildContext(task, client);
        byte[] templateBytes = storageService.loadAsBytes(template.getFilePath());

        return new DocumentGeneratorService.GenerationData(task, template, client, context, templateBytes);
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
        ctx.put("TASK_SERVICE", (task.getServices() != null && !task.getServices().isEmpty()) ? task.getServices().get(0).getTitle() : blank);

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
