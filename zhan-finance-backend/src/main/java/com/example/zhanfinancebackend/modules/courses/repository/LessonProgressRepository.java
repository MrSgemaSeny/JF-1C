package com.example.zhanfinancebackend.modules.courses.repository;

import com.example.zhanfinancebackend.modules.courses.entity.LessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LessonProgressRepository extends JpaRepository<LessonProgress, Long> {
    Optional<LessonProgress> findByLessonIdAndUserId(Long lessonId, Long userId);
    
    @org.springframework.data.jpa.repository.Query("select lp from LessonProgress lp join fetch lp.lesson l join fetch l.chapter c where c.course.id = :courseId and lp.user.id = :userId")
    List<LessonProgress> findAllByCourseIdAndUserId(@org.springframework.data.repository.query.Param("courseId") Long courseId, @org.springframework.data.repository.query.Param("userId") Long userId);
}
