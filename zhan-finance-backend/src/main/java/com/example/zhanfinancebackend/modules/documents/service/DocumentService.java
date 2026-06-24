package com.example.zhanfinancebackend.modules.documents.service;

import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.common.exception.ErrorCode;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.documents.dto.DocumentDto;
import com.example.zhanfinancebackend.modules.documents.entity.Document;
import com.example.zhanfinancebackend.modules.documents.repository.DocumentRepository;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
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
    private final StorageService storageService;
    private final DocumentAccessService documentAccessService;

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
                           StorageService storageService,
                           DocumentAccessService documentAccessService) {
        this.documentRepository = documentRepository;
        this.userRepository = userRepository;
        this.storageService = storageService;
        this.documentAccessService = documentAccessService;
    }

    @Transactional
    public DocumentDto uploadDocument(Long targetUserId, MultipartFile file, User actor) {
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Target user not found"));

        documentAccessService.assertCanCreateFor(actor, targetUser);

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new ApiException(ErrorCode.BAD_REQUEST, "File type not allowed: " + contentType);
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

        document = documentRepository.save(document);
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
                document.getFileName(),
                document.getContentType(),
                document.getFileSize(),
                document.getCreatedAt()
        );
    }
}
