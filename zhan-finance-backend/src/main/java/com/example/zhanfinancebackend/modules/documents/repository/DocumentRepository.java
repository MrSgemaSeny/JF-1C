package com.example.zhanfinancebackend.modules.documents.repository;

import com.example.zhanfinancebackend.modules.documents.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByUserIdOrderByCreatedAtDesc(Long userId);
}
