package com.example.zhanfinancebackend.modules.services.repository;

import com.example.zhanfinancebackend.modules.services.entity.ServiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceRepository extends JpaRepository<ServiceEntity, Long> {

    List<ServiceEntity> findByIsActiveTrue();

    List<ServiceEntity> findByIsActiveTrueAndIsHighlightedTrue();
}
