package com.example.zhanfinancebackend.modules.documents.repository;

import com.example.zhanfinancebackend.modules.documents.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT d FROM Document d LEFT JOIN d.task t LEFT JOIN t.client c WHERE d.user.id = :userId OR d.uploadedBy.id = :userId OR c.id = :userId ORDER BY d.createdAt DESC")
    List<Document> findByUserIdOrTaskClientId(@org.springframework.data.repository.query.Param("userId") Long userId);
    
    List<Document> findByUser_AssignedEmployee_IdOrderByCreatedAtDesc(Long employeeId);
    
    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT d FROM Document d LEFT JOIN d.user u LEFT JOIN d.task t WHERE u.assignedEmployee.id = :employeeId OR d.uploadedBy.id = :employeeId OR t.assignedTo.id = :employeeId ORDER BY d.createdAt DESC")
    List<Document> findForEmployee(@org.springframework.data.repository.query.Param("employeeId") Long employeeId);
    List<Document> findAllByOrderByCreatedAtDesc();
    List<Document> findByTaskIdOrderByCreatedAtDesc(Long taskId);
    java.util.Optional<Document> findByStorageKey(String storageKey);
    
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE Document d SET d.generatedFromTemplate = null WHERE d.generatedFromTemplate.id = :templateId")
    void nullifyTemplateReference(@org.springframework.data.repository.query.Param("templateId") java.util.UUID templateId);
}
