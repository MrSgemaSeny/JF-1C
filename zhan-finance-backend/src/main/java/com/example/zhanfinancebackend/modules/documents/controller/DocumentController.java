package com.example.zhanfinancebackend.modules.documents.controller;

import com.example.zhanfinancebackend.common.response.ApiResponse;
import com.example.zhanfinancebackend.modules.auth.security.UserPrincipal;
import com.example.zhanfinancebackend.modules.documents.dto.DocumentDto;
import com.example.zhanfinancebackend.modules.documents.dto.DocumentUploadResponse;
import com.example.zhanfinancebackend.modules.documents.entity.Document;
import com.example.zhanfinancebackend.modules.documents.service.DocumentService;
import com.example.zhanfinancebackend.modules.documents.service.StorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
@Tag(name = "Documents", description = "Endpoints for document management")
@SecurityRequirement(name = "bearerAuth")
public class DocumentController {

    private final DocumentService documentService;
    private final StorageService storageService;

    public DocumentController(DocumentService documentService, StorageService storageService) {
        this.documentService = documentService;
        this.storageService = storageService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a document")
    public ApiResponse<DocumentUploadResponse> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "userId", required = false) Long targetUserId,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        Long finalTargetUserId = targetUserId != null ? targetUserId : principal.getUser().getId();
        DocumentDto dto = documentService.uploadDocument(finalTargetUserId, file, principal.getUser());
        return ApiResponse.success(new DocumentUploadResponse(dto.getId(), dto.getFileName()));
    }

    @GetMapping
    @Operation(summary = "Get list of documents for a user")
    public ApiResponse<List<DocumentDto>> getDocuments(
            @RequestParam(value = "userId", required = false) Long targetUserId,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        Long finalTargetUserId = targetUserId != null ? targetUserId : principal.getUser().getId();
        return ApiResponse.success(documentService.getUserDocuments(finalTargetUserId, principal.getUser()));
    }

    @GetMapping("/{id}/download")
    @Operation(summary = "Download a document")
    public ResponseEntity<Resource> downloadDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        Document document = documentService.getDocumentWithAccessCheck(id, principal.getUser());
        Resource resource = storageService.loadAsResource(document.getStorageKey());
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + document.getFileName() + "\"")
                .contentType(MediaType.parseMediaType(document.getContentType()))
                .body(resource);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a document")
    public ApiResponse<Void> deleteDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        documentService.deleteDocument(id, principal.getUser());
        return ApiResponse.success(null);
    }
}
