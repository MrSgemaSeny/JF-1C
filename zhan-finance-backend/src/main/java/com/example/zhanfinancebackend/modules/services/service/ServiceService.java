package com.example.zhanfinancebackend.modules.services.service;

import com.example.zhanfinancebackend.modules.services.dto.ServiceDto;
import com.example.zhanfinancebackend.modules.services.entity.ServiceEntity;
import com.example.zhanfinancebackend.modules.services.repository.ServiceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneOffset;
import java.util.List;

@Service
public class ServiceService {

    private final ServiceRepository serviceRepository;

    public ServiceService(ServiceRepository serviceRepository) {
        this.serviceRepository = serviceRepository;
    }

    @Transactional(readOnly = true)
    public List<ServiceDto> getAllActiveServices() {
        return serviceRepository.findByIsActiveTrue().stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ServiceDto> getHighlightedServices() {
        return serviceRepository.findByIsActiveTrueAndIsHighlightedTrue().stream()
                .map(this::mapToDto)
                .toList();
    }

    public ServiceDto mapToDto(ServiceEntity entity) {
        return new ServiceDto(
                entity.getId(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getPrice(),
                entity.getImageUrl(),
                entity.getIsHighlighted(),
                entity.getFeatures(),
                entity.getCreatedAt() != null ? entity.getCreatedAt().atZone(ZoneOffset.UTC) : null
        );
    }
}
