package com.example.zhanfinancebackend.modules.documents.service;

import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.common.exception.ErrorCode;
import com.example.zhanfinancebackend.modules.auth.entity.User;

import com.example.zhanfinancebackend.modules.documents.dto.DocumentDto;
import com.example.zhanfinancebackend.modules.documents.entity.Document;
import com.example.zhanfinancebackend.modules.documents.repository.DocumentRepository;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.crm.repository.TaskRepository;
import com.example.zhanfinancebackend.modules.crm.entity.Task;
import com.example.zhanfinancebackend.modules.notifications.service.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final StorageService storageService;
    private final DocumentAccessService documentAccessService;
    private final NotificationService notificationService;
    private final com.example.zhanfinancebackend.modules.crm.service.CrmAccessService crmAccessService;

    // MVP allowed types
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
            "application/xml",
            "text/xml",
            "text/csv",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // docx
    );

    public DocumentService(DocumentRepository documentRepository,
                           UserRepository userRepository,
                           TaskRepository taskRepository,
                           StorageService storageService,
                           DocumentAccessService documentAccessService,
                           NotificationService notificationService,
                           com.example.zhanfinancebackend.modules.crm.service.CrmAccessService crmAccessService) {
        this.documentRepository = documentRepository;
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.storageService = storageService;
        this.documentAccessService = documentAccessService;
        this.notificationService = notificationService;
        this.crmAccessService = crmAccessService;
    }

    @Transactional
    public DocumentDto uploadDocument(Long targetUserId, Long taskId, MultipartFile file, User actor) {
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new com.example.zhanfinancebackend.common.exception.ResourceNotFoundException("Target user not found"));

        documentAccessService.assertCanCreateFor(actor, targetUser);

        String contentType = file.getContentType();
        if (contentType == null) {
            throw new com.example.zhanfinancebackend.common.exception.BadRequestException("File type not recognized");
        }
        
        java.util.Set<String> ALLOWED_CONTENT_TYPES = java.util.Set.of(
                "application/pdf", "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "image/png", "image/jpeg"
        );

        if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new com.example.zhanfinancebackend.common.exception.BadRequestException("Недопустимый тип файла: " + contentType);
        }

        String storageKey = storageService.store(file);

        Document document = new Document(
                targetUser,
                actor,
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown",
                storageKey,
                contentType,
                file.getSize()
        );

        if (taskId != null) {
            Task task = taskRepository.findById(taskId)
                    .orElseThrow(() -> new com.example.zhanfinancebackend.common.exception.ResourceNotFoundException("Task not found"));
            document.setTask(task);
        }

        document = documentRepository.save(document);

        // --- Notification Logic ---
        if (actor.getRole() == com.example.zhanfinancebackend.modules.auth.entity.Role.CLIENT) {
            // Notify Assigned Employee if exists
            User employee = targetUser.getAssignedEmployee();
            if (employee != null) {
                String link = taskId != null ? "/employee/tasks" : "/employee/documents";
                notificationService.createNotification(
                        employee,
                        "Новый документ",
                        "Клиент " + targetUser.getFullName() + " загрузил файл: " + document.getFileName(),
                        link
                );
            }
            String taskLink = document.getTask() != null
                ? "/admin/tasks/" + document.getTask().getId()
                : "/admin/documents";

        notificationService.notifyAdmins(
                "Новый документ",
                actor.getFullName() + " загрузил файл: " + document.getFileName(),
                taskLink
        );
        } else {
            // Notify the Client
            String link = "/client";
            notificationService.createNotification(
                    targetUser,
                    "Новый документ",
                    "Сотрудник загрузил для вас файл: " + document.getFileName(),
                    link
            );
            
            if (actor.getRole() != com.example.zhanfinancebackend.modules.auth.entity.Role.ADMIN) {
                notificationService.notifyAdmins(
                        "Загружен документ",
                        actor.getFullName() + " загрузил файл: " + document.getFileName() + " для клиента " + targetUser.getFullName(),
                        "/dashboard/documents"
                );
            }
        }

        return mapToDto(document);
    }

    @Transactional(readOnly = true)
    public List<DocumentDto> getUserDocuments(Long targetUserId, User actor) {
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new com.example.zhanfinancebackend.common.exception.ResourceNotFoundException("Target user not found"));

        // If you can create for them, you can generally read their list
        documentAccessService.assertCanCreateFor(actor, targetUser);

        return documentRepository.findByUserIdOrderByCreatedAtDesc(targetUserId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DocumentDto> getAllVisibleDocuments(User actor) {
        if (actor.getRole() == com.example.zhanfinancebackend.modules.auth.entity.Role.ADMIN) {
            return documentRepository.findAllByOrderByCreatedAtDesc().stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
        } else if (actor.getRole() == com.example.zhanfinancebackend.modules.auth.entity.Role.EMPLOYEE) {
            return documentRepository.findByUser_AssignedEmployee_IdOrderByCreatedAtDesc(actor.getId()).stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
        } else {
            return getUserDocuments(actor.getId(), actor);
        }
    }

    @Transactional(readOnly = true)
    public List<DocumentDto> getTaskDocuments(Long taskId, User actor) {
        // Technically anyone who can read the task should be able to read its documents.
        // For simplicity, we just fetch them. Ideally we check task access here.
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new com.example.zhanfinancebackend.common.exception.ResourceNotFoundException("Task not found"));
        
        crmAccessService.assertCanReadTask(actor, task);

        return documentRepository.findByTaskIdOrderByCreatedAtDesc(taskId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public DocumentDto updateDocumentStatus(Long documentId, String status, User actor) {
        Document document = getDocumentWithAccessCheck(documentId, actor);
        document.setStatus(status);
        document = documentRepository.save(document);

        // --- Notification Logic ---
        if (actor.getRole() != com.example.zhanfinancebackend.modules.auth.entity.Role.CLIENT) {
            notificationService.createNotification(
                    document.getUser(),
                    "Статус документа изменен",
                    "Статус документа '" + document.getFileName() + "' изменен на: " + status,
                    "/client"
            );
        }
        
        if (actor.getRole() != com.example.zhanfinancebackend.modules.auth.entity.Role.ADMIN) {
            notificationService.notifyAdmins(
                 "Статус документа изменен",
                 actor.getFullName() + " изменил статус документа '" + document.getFileName() + "' на: " + status,
                 "/employee/documents"
            );
        }

        return mapToDto(document);
    }

    @Transactional(readOnly = true)
    public Document getDocumentWithAccessCheck(Long documentId, User actor) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new com.example.zhanfinancebackend.common.exception.ResourceNotFoundException("Document not found"));

        documentAccessService.assertCanRead(actor, document);
        return document;
    }

    @Transactional
    public void deleteDocument(Long documentId, User actor) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new com.example.zhanfinancebackend.common.exception.ResourceNotFoundException("Document not found"));

        documentAccessService.assertCanWrite(actor, document);
        
        storageService.delete(document.getStorageKey());
        documentRepository.delete(document);
    }

    private DocumentDto mapToDto(Document document) {
        return new DocumentDto(
                document.getId(),
                document.getUser().getId(),
                document.getUser().getFullName(),
                document.getTask() != null ? document.getTask().getId() : null,
                document.getFileName(),
                document.getContentType(),
                document.getFileSize(),
                document.getStatus(),
                document.getCreatedAt()
        );
    }
}

