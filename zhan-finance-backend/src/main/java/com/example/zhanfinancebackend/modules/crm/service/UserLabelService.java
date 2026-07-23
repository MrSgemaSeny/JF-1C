package com.example.zhanfinancebackend.modules.crm.service;

import com.example.zhanfinancebackend.common.exception.ResourceNotFoundException;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.crm.dto.UserLabelCreateRequest;
import com.example.zhanfinancebackend.modules.crm.dto.UserLabelDto;
import com.example.zhanfinancebackend.modules.crm.entity.UserLabel;
import com.example.zhanfinancebackend.modules.crm.repository.UserLabelRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserLabelService {

    private final UserLabelRepository userLabelRepository;

    public UserLabelService(UserLabelRepository userLabelRepository) {
        this.userLabelRepository = userLabelRepository;
    }

    @Transactional(readOnly = true)
    public List<UserLabelDto> getUserLabels(Long userId) {
        return userLabelRepository.findByUserIdOrderByIdAsc(userId).stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional
    public UserLabelDto createLabel(User user, UserLabelCreateRequest request) {
        long currentCount = userLabelRepository.countByUserId(user.getId());
        if (currentCount >= 5) {
            throw new IllegalArgumentException("Максимум 5 меток на одного пользователя");
        }

        UserLabel label = new UserLabel(user, request.name().trim(), request.color().trim());
        UserLabel saved = userLabelRepository.save(label);
        return mapToDto(saved);
    }

    @Transactional
    public void deleteLabel(User user, Long labelId) {
        UserLabel label = userLabelRepository.findById(labelId)
                .orElseThrow(() -> new ResourceNotFoundException("Label not found"));
        if (!label.getUser().getId().equals(user.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied");
        }
        userLabelRepository.delete(label);
    }

    public UserLabelDto mapToDto(UserLabel label) {
        return new UserLabelDto(
                label.getId(),
                label.getUser().getId(),
                label.getName(),
                label.getColor()
        );
    }
}
