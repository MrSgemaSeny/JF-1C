package com.example.zhanfinancebackend.modules.auth.service;

import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.common.exception.ErrorCode;
import com.example.zhanfinancebackend.modules.auth.dto.user.UpdatePasswordRequest;
import com.example.zhanfinancebackend.modules.auth.dto.user.UpdateProfileRequest;
import com.example.zhanfinancebackend.modules.auth.dto.user.UserProfileDto;
import com.example.zhanfinancebackend.modules.auth.entity.AuthProvider;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.crm.entity.ClientProfile;
import com.example.zhanfinancebackend.modules.crm.repository.ClientProfileRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.example.zhanfinancebackend.modules.documents.service.StorageService storageService;

    public UserService(UserRepository userRepository, ClientProfileRepository clientProfileRepository, PasswordEncoder passwordEncoder, com.example.zhanfinancebackend.modules.documents.service.StorageService storageService) {
        this.userRepository = userRepository;
        this.clientProfileRepository = clientProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.storageService = storageService;
    }

    @Transactional(readOnly = true)
    public UserProfileDto getMyProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "User not found"));

        String phone = null;
        String companyName = null;

        if (user.getRole() == Role.CLIENT) {
            Optional<ClientProfile> profileOpt = clientProfileRepository.findByUser(user);
            if (profileOpt.isPresent()) {
                ClientProfile p = profileOpt.get();
                phone = p.getPhone();
                companyName = p.getCompanyName();
            }
        }

        Long assignedEmployeeId = null;
        String assignedEmployeeName = null;
        if (user.getAssignedEmployee() != null) {
            assignedEmployeeId = user.getAssignedEmployee().getId();
            assignedEmployeeName = user.getAssignedEmployee().getFullName();
        }

        return new UserProfileDto(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                phone,
                companyName,
                user.getAvatarUrl(),
                user.getAuthProvider(),
                assignedEmployeeId,
                assignedEmployeeName
        );
    }

    @Transactional
    public UserProfileDto updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "User not found"));

        if (request.fullName() != null && !request.fullName().isBlank()) {
            user.setFullName(request.fullName());
        }

        user = userRepository.save(user);

        if (user.getRole() == Role.CLIENT) {
            Optional<ClientProfile> profileOpt = clientProfileRepository.findByUser(user);
            if (profileOpt.isPresent()) {
                ClientProfile p = profileOpt.get();
                if (request.phone() != null) p.setPhone(request.phone());
                if (request.companyName() != null) p.setCompanyName(request.companyName());
                clientProfileRepository.save(p);
            }
        }

        return getMyProfile(userId);
    }

    @Transactional
    public void updatePassword(Long userId, UpdatePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "User not found"));

        if (user.getAuthProvider() == AuthProvider.GOOGLE && user.getPasswordHash() == null) {
            throw new ApiException(ErrorCode.BAD_REQUEST, "Пользователи Google не могут менять пароль таким образом");
        }

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ApiException(ErrorCode.BAD_REQUEST, "Неверный текущий пароль");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    @Transactional
    public UserProfileDto uploadAvatar(Long userId, MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "User not found"));

        if (user.getAuthProvider() == AuthProvider.GOOGLE) {
            throw new ApiException(ErrorCode.BAD_REQUEST, "Пользователи Google не могут менять аватарку локально");
        }

        if (file.isEmpty()) {
            throw new ApiException(ErrorCode.BAD_REQUEST, "Файл пуст");
        }

        String contentType = file.getContentType();
        if (contentType == null || (!contentType.startsWith("image/"))) {
            throw new ApiException(ErrorCode.BAD_REQUEST, "Допустимы только изображения");
        }

        // Remove old avatar if exists
        if (user.getAvatarUrl() != null && user.getAvatarUrl().startsWith("/uploads/avatars/")) {
            String oldStorageKey = user.getAvatarUrl().substring("/uploads/avatars/".length());
            storageService.delete(oldStorageKey);
        }

        String storageKey = storageService.store(file);
        String fileUrl = "/uploads/avatars/" + storageKey;
        
        user.setAvatarUrl(fileUrl);
        userRepository.save(user);

        return getMyProfile(userId);
    }
}
