package com.example.zhanfinancebackend.modules.courses.repository;

import com.example.zhanfinancebackend.modules.courses.entity.LessonBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonBlockRepository extends JpaRepository<LessonBlock, Long> {
    List<LessonBlock> findAllByLessonIdOrderByOrderIndexAsc(Long lessonId);
}
