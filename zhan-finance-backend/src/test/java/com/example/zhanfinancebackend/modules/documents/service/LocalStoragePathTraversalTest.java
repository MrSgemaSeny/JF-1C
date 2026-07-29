package com.example.zhanfinancebackend.modules.documents.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class LocalStoragePathTraversalTest {

    private LocalStorageService localStorageService;

    @BeforeEach
    void setUp(@TempDir Path tempDir) {
        localStorageService = new LocalStorageService(tempDir.toString());
    }

    @Test
    @DisplayName("Попытка загрузки файла с выходом из rootLocation выбрасывает 400 Bad Request")
    void testPathTraversal_LoadAsResource_ThrowsException() {
        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> localStorageService.loadAsResource("../../../etc/passwd")
        );

        assertTrue(exception.getMessage().contains("Invalid file path"));
    }

    @Test
    @DisplayName("Попытка удаления файла вне rootLocation выбрасывает 400 Bad Request")
    void testPathTraversal_Delete_ThrowsException() {
        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> localStorageService.delete("../../../config/secret.txt")
        );

        assertTrue(exception.getMessage().contains("Invalid file path"));
    }
}
