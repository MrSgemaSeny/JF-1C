package com.example.zhanfinancebackend.modules.courses.repository;

import com.example.zhanfinancebackend.modules.courses.entity.CourseCurator;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseCuratorRepository extends JpaRepository<CourseCurator, Long> {
    List<CourseCurator> findByCourseId(Long courseId);
    List<CourseCurator> findByCuratorId(Long curatorId);
    boolean existsByCourseIdAndCuratorId(Long courseId, Long curatorId);
    Optional<CourseCurator> findByCourseIdAndCuratorId(Long courseId, Long curatorId);
    void deleteByCourseIdAndCuratorId(Long courseId, Long curatorId);
}
