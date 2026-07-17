package com.example.zhanfinancebackend.modules.landing.repository;

import com.example.zhanfinancebackend.modules.landing.entity.ContactRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;

public interface ContactRequestRepository extends JpaRepository<ContactRequest, Long> {
    long countByCreatedAtAfter(LocalDateTime date);
}
