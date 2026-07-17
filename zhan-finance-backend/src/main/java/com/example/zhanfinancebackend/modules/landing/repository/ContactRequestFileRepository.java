package com.example.zhanfinancebackend.modules.landing.repository;

import com.example.zhanfinancebackend.modules.landing.entity.ContactRequestFile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ContactRequestFileRepository extends JpaRepository<ContactRequestFile, Long> {
    List<ContactRequestFile> findByContactRequestId(Long contactRequestId);
}
