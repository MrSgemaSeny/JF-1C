package com.example.zhanfinancebackend.modules.courses.repository;

import com.example.zhanfinancebackend.modules.courses.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Long> {
    @org.springframework.data.jpa.repository.Query("select l from Lesson l join fetch l.course c where lower(l.title) like lower(concat('%', :query, '%')) or lower(l.content) like lower(concat('%', :query, '%'))")
    java.util.List<Lesson> searchLessons(@org.springframework.data.repository.query.Param("query") String query);
}
