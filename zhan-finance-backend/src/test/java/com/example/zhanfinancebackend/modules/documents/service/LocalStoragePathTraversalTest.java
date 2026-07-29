package com.example.zhanfinancebackend.modules.documents.service;

import com.example.zhanfinancebackend.common.exception.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class LocalStoragePathTraversalTest {

    private LocalStorageService localStorageService;

    @BeforeEach
    void setUp(@TempDir Path tempDir) {
        localStorageService = new LocalStorageService(tempDir.toString());
    }

    @Test
    @DisplayName("Попытка загрузки файла с выходом из rootLocation выбрасывает BadRequestException")
    void testPathTraversal_LoadAsResource_ThrowsException() {
        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> localStorageService.loadAsResource("../../../etc/passwd")
        );

        assertTrue(exception.getMessage().contains("Cannot access file outside current directory"));
    }

    @Test
    @DisplayName("Попытка удаления файла вне rootLocation выбрасывает BadRequestException")
    void testPathTraversal_Delete_ThrowsException() {
        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> localStorageService.delete("../../../config/secret.txt")
        );

        assertTrue(exception.getMessage().contains("Cannot access file outside current directory"));
    }
}
