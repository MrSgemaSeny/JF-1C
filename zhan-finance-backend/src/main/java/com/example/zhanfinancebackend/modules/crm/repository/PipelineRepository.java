package com.example.zhanfinancebackend.modules.crm.repository;

import com.example.zhanfinancebackend.modules.crm.entity.Pipeline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

@Repository
public interface PipelineRepository extends JpaRepository<Pipeline, Long> {
    Optional<Pipeline> findByIsDefaultTrue();

    @Query("SELECT DISTINCT p FROM Pipeline p LEFT JOIN FETCH p.stages")
    List<Pipeline> findAllWithStages();
}
