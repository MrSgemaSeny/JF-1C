package com.example.zhanfinancebackend.modules.documents.controller;

import com.example.zhanfinancebackend.modules.documents.service.StorageService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class FileDownloadController {

    private final StorageService storageService;

    public FileDownloadController(StorageService storageService) {
        this.storageService = storageService;
    }

    @GetMapping("/uploads/{storageKey}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String storageKey) {
        Resource resource = storageService.loadAsResource(storageKey);
        
        // Try to determine content type from filename
        String contentType = "application/octet-stream";
        String filename = resource.getFilename();
        if (filename != null) {
            if (filename.endsWith(".pdf")) contentType = "application/pdf";
            else if (filename.endsWith(".png")) contentType = "image/png";
            else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) contentType = "image/jpeg";
            else if (filename.endsWith(".mp4")) contentType = "video/mp4";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
    
    @GetMapping("/uploads/avatars/{storageKey}")
    public ResponseEntity<Resource> downloadAvatar(@PathVariable String storageKey) {
        return downloadFile(storageKey);
    }
}
