package com.example.zhanfinancebackend.modules.auth.service;

import com.example.zhanfinancebackend.modules.auth.dto.user.UpdatePasswordRequest;
import com.example.zhanfinancebackend.modules.auth.entity.AuthProvider;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.crm.repository.ClientProfileRepository;
import com.example.zhanfinancebackend.modules.crm.repository.TaskRepository;
import com.example.zhanfinancebackend.modules.documents.service.StorageService;
import com.example.zhanfinancebackend.modules.auth.mapper.UserMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class UserServiceTest {

    private UserService userService;
    private UserRepository userRepository;
    private ClientProfileRepository clientProfileRepository;
    private PasswordEncoder passwordEncoder;
    private StorageService storageService;
    private UserMapper userMapper;
    private TaskRepository taskRepository;
    private RefreshTokenService refreshTokenService;
    private User testUser;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        clientProfileRepository = mock(ClientProfileRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        storageService = mock(StorageService.class);
        userMapper = mock(UserMapper.class);
        taskRepository = mock(TaskRepository.class);
        refreshTokenService = mock(RefreshTokenService.class);

        userService = new UserService(
                userRepository,
                clientProfileRepository,
                passwordEncoder,
                storageService,
                userMapper,
                taskRepository,
                refreshTokenService
        );

        testUser = new User("Test User", "test@example.com", "encoded-old-pass", Role.CLIENT);
        testUser.setId(1L);
        testUser.setAuthProvider(AuthProvider.LOCAL);
    }

    @Test
    @DisplayName("updatePassword() обновляет пароль и отзывет все активные refresh токены пользователя")
    void updatePassword_shouldRevokeAllSessions() {
        UpdatePasswordRequest request = new UpdatePasswordRequest("old-pass", "new-pass");

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("old-pass", "encoded-old-pass")).thenReturn(true);
        when(passwordEncoder.encode("new-pass")).thenReturn("encoded-new-pass");

        userService.updatePassword(1L, request);

        verify(userRepository).save(testUser);
        verify(refreshTokenService).revokeAll(testUser);
    }

    @Test
    @DisplayName("softDeleteUser() помечает пользователя удаленным и отзывет все его сессии")
    void softDeleteUser_shouldRevokeAllSessions() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(taskRepository.findAllByEmployeeWithDetails(testUser)).thenReturn(Collections.emptyList());

        userService.softDeleteUser(1L);

        verify(userRepository).save(testUser);
        verify(refreshTokenService).revokeAll(testUser);
    }
}
