package com.example.zhanfinancebackend.modules.crm.repository;

import com.example.zhanfinancebackend.modules.crm.entity.Stage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StageRepository extends JpaRepository<Stage, Long> {
    List<Stage> findByPipelineIdOrderByOrderIndexAsc(Long pipelineId);
    Optional<Stage> findByPipelineIdAndIsDefaultTrue(Long pipelineId);
}
