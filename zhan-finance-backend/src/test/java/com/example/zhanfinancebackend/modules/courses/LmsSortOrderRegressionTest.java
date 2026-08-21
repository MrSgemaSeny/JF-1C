package com.example.zhanfinancebackend.modules.courses;

import com.example.zhanfinancebackend.modules.courses.entity.Chapter;
import com.example.zhanfinancebackend.modules.courses.entity.Course;
import com.example.zhanfinancebackend.modules.courses.repository.ChapterRepository;
import com.example.zhanfinancebackend.modules.courses.repository.LessonRepository;
import jakarta.persistence.OrderBy;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.*;

class LmsSortOrderRegressionTest {

    @Test
    @DisplayName("W1 Regression: Course.chapters and Chapter.lessons have deterministic secondary sort tiebreaker in @OrderBy")
    void entities_haveDeterministicOrderBy() throws Exception {
        Field chaptersField = Course.class.getDeclaredField("chapters");
        Field lessonsField = Chapter.class.getDeclaredField("lessons");

        assertTrue(chaptersField.isAnnotationPresent(OrderBy.class));
        assertTrue(lessonsField.isAnnotationPresent(OrderBy.class));

        assertEquals("orderIndex ASC, id ASC", chaptersField.getAnnotation(OrderBy.class).value());
        assertEquals("orderIndex ASC, id ASC", lessonsField.getAnnotation(OrderBy.class).value());
    }

    @Test
    @DisplayName("W1 Regression: ChapterRepository and LessonRepository provide methods with secondary tiebreakers")
    void repositories_haveDeterministicSortMethods() throws Exception {
        Method chapterSortMethod = ChapterRepository.class.getMethod("findAllByCourseIdOrderByOrderIndexAscIdAsc", Long.class);
        Method lessonSortMethod = LessonRepository.class.getMethod("findAllByChapterIdOrderByOrderIndexAscIdAsc", Long.class);

        assertNotNull(chapterSortMethod);
        assertNotNull(lessonSortMethod);
    }
}
