package com.example.zhanfinancebackend.modules.courses.service;

import com.example.zhanfinancebackend.modules.courses.entity.Course;
import com.example.zhanfinancebackend.modules.courses.entity.Lesson;
import com.example.zhanfinancebackend.modules.courses.entity.LessonType;
import com.example.zhanfinancebackend.modules.courses.repository.CourseRepository;
import com.example.zhanfinancebackend.modules.courses.repository.LessonRepository;
import com.example.zhanfinancebackend.modules.documents.service.StorageService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class LessonService {

    private final LessonRepository lessonRepository;
    private final com.example.zhanfinancebackend.modules.courses.repository.ChapterRepository chapterRepository;
    private final CourseRepository courseRepository;
    private final StorageService storageService;

    public LessonService(LessonRepository lessonRepository, com.example.zhanfinancebackend.modules.courses.repository.ChapterRepository chapterRepository, CourseRepository courseRepository, StorageService storageService) {
        this.lessonRepository = lessonRepository;
        this.chapterRepository = chapterRepository;
        this.courseRepository = courseRepository;
        this.storageService = storageService;
    }

    public Lesson getLessonById(Long id) {
        return lessonRepository.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Lesson not found"));
    }

    @Transactional
    public Lesson createLesson(Long courseId, String title, String description, LessonType type, int orderIndex, MultipartFile file) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Course not found"));

        com.example.zhanfinancebackend.modules.courses.entity.Chapter chapter;
        if (course.getChapters().isEmpty()) {
            chapter = new com.example.zhanfinancebackend.modules.courses.entity.Chapter();
            chapter.setCourse(course);
            chapter.setTitle("Default Chapter");
            chapter.setOrderIndex(0);
            chapter = chapterRepository.save(chapter);
            course.getChapters().add(chapter);
        } else {
            chapter = course.getChapters().get(0);
        }

        Lesson lesson = new Lesson();
        lesson.setChapter(chapter);
        lesson.setTitle(title);
        lesson.setDescription(description);
        lesson.setType(type);
        lesson.setOrderIndex(orderIndex);

        if (file != null && !file.isEmpty()) {
            // TODO: Phase 2 - Implement LessonBlock upload
        }

        chapter.getLessons().add(lesson);
        return lessonRepository.save(lesson);
    }

    @Transactional
    public Lesson updateLesson(Long id, String title, String description, String content, Integer orderIndex, MultipartFile file) {
        Lesson lesson = getLessonById(id);
        if (title != null) lesson.setTitle(title);
        if (description != null) lesson.setDescription(description);
        if (orderIndex != null) lesson.setOrderIndex(orderIndex);

        if (file != null && !file.isEmpty()) {
            // TODO: Phase 2 - Implement LessonBlock upload
        }

        return lessonRepository.save(lesson);
    }

    @Transactional
    public void deleteLesson(Long id) {
        Lesson lesson = getLessonById(id);
        // TODO: Phase 2 - delete files from LessonBlocks
        lessonRepository.deleteById(id);
    }
}
