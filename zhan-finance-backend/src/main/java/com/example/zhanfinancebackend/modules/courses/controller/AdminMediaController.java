package com.example.zhanfinancebackend.modules.courses.controller;

import com.example.zhanfinancebackend.common.response.ApiResponse;
import com.example.zhanfinancebackend.modules.documents.service.StorageService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/media")
@PreAuthorize("hasRole('ADMIN')")
public class AdminMediaController {

    private final StorageService storageService;

    public AdminMediaController(StorageService storageService) {
        this.storageService = storageService;
    }

    @PostMapping("/upload")
    public ApiResponse<Map<String, String>> uploadMedia(@RequestParam("file") MultipartFile file) {
        String storageKey = storageService.store(file);
        Map<String, String> result = new HashMap<>();
        result.put("url", "/api/courses/media/" + storageKey);
        return ApiResponse.success(result);
    }
}
