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
                           NotificationService notificationService) {
        this.documentRepository = documentRepository;
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.storageService = storageService;
        this.documentAccessService = documentAccessService;
        this.notificationService = notificationService;
    }

    @Transactional
    public DocumentDto uploadDocument(Long targetUserId, Long taskId, MultipartFile file, User actor) {
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Target user not found"));

        documentAccessService.assertCanCreateFor(actor, targetUser);

        String contentType = file.getContentType();
        if (contentType == null) {
            throw new ApiException(ErrorCode.BAD_REQUEST, "File type not recognized");
        }
        
        // Relaxing content type checks to allow common image formats and standard documents
        // For production, maybe use a more robust detection like Apache Tika.
        if (contentType.contains("exe") || contentType.contains("javascript")) {
            throw new ApiException(ErrorCode.BAD_REQUEST, "Executable files are not allowed");
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
                    .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Task not found"));
            document.setTask(task);
        }

        document = documentRepository.save(document);

        // --- Notification Logic ---
        if (actor.getRole() == com.example.zhanfinancebackend.modules.auth.entity.Role.CLIENT) {
            // Notify Assigned Employee if exists
            User employee = targetUser.getAssignedEmployee();
            if (employee != null) {
                String link = taskId != null ? "/employee/tasks/" + taskId : "/employee/documents";
                notificationService.createNotification(
                        employee,
                        "New Document Uploaded",
                        "Client " + targetUser.getFullName() + " uploaded a new file: " + document.getFileName(),
                        link
                );
            }
        } else {
            // Notify the Client
            String link = "/client/documents";
            notificationService.createNotification(
                    targetUser,
                    "New Document Available",
                    "A new document has been uploaded for you: " + document.getFileName(),
                    link
            );
        }

        return mapToDto(document);
    }

    @Transactional(readOnly = true)
    public List<DocumentDto> getUserDocuments(Long targetUserId, User actor) {
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Target user not found"));

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
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Task not found"));
        
        // Assert can read task user
        documentAccessService.assertCanCreateFor(actor, task.getClient());

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
                    "Document Status Updated",
                    "The status of your document '" + document.getFileName() + "' is now: " + status,
                    "/client/documents"
            );
        }

        return mapToDto(document);
    }

    @Transactional(readOnly = true)
    public Document getDocumentWithAccessCheck(Long documentId, User actor) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Document not found"));

        documentAccessService.assertCanRead(actor, document);
        return document;
    }

    @Transactional
    public void deleteDocument(Long documentId, User actor) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Document not found"));

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
