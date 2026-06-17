package com.example.zhanfinancebackend.modules.user.service;

import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.user.dto.UserProfileDto;
import com.example.zhanfinancebackend.modules.user.dto.UserProfileUpdateRequest;
import com.example.zhanfinancebackend.modules.user.entity.UserProfile;
import com.example.zhanfinancebackend.modules.user.repository.UserProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    public UserService(UserRepository userRepository, UserProfileRepository userProfileRepository) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
    }

    @Transactional
    public UserProfileDto getProfile(User user) {
        UserProfile profile = getOrCreate(user);
        return toDto(profile);
    }

    @Transactional
    public UserProfileDto updateProfile(User user, UserProfileUpdateRequest request) {
        User managedUser = userRepository.getReferenceById(user.getId());
        UserProfile profile = getOrCreate(managedUser);
        if (request.fullName() != null && !request.fullName().isBlank()) {
            managedUser.setFullName(request.fullName());
        }
        profile.setPhone(request.phone());
        profile.setCompanyName(request.companyName());
        return toDto(profile);
    }

    private UserProfile getOrCreate(User user) {
        return userProfileRepository.findByUser(user)
                .orElseGet(() -> userProfileRepository.save(new UserProfile(user)));
    }

    private UserProfileDto toDto(UserProfile profile) {
        User user = profile.getUser();
        return new UserProfileDto(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                profile.getPhone(),
                profile.getCompanyName()
        );
    }
}
