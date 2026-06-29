package com.example.zhanfinancebackend.modules.documents.repository;

import com.example.zhanfinancebackend.modules.documents.entity.StoredFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StoredFileRepository extends JpaRepository<StoredFile, String> {
}
