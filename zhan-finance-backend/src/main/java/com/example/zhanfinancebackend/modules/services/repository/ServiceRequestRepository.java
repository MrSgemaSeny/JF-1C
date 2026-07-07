package com.example.zhanfinancebackend.modules.services.repository;

import com.example.zhanfinancebackend.modules.services.entity.ServiceRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {

    List<ServiceRequest> findByClientIdOrderByCreatedAtDesc(Long clientId);

    List<ServiceRequest> findAllByOrderByCreatedAtDesc();

    java.util.Optional<ServiceRequest> findByLinkedTaskId(Long taskId);
}
