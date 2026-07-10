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
    private final StorageService storageService;

    public LessonService(LessonRepository lessonRepository, com.example.zhanfinancebackend.modules.courses.repository.ChapterRepository chapterRepository, StorageService storageService) {
        this.lessonRepository = lessonRepository;
        this.chapterRepository = chapterRepository;
        this.storageService = storageService;
    }

    public Lesson getLessonById(Long id) {
        return lessonRepository.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Lesson not found"));
    }

    @Transactional
    public Lesson createLesson(Long chapterId, String title, String description, LessonType type, int orderIndex, MultipartFile file) {
        com.example.zhanfinancebackend.modules.courses.entity.Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Chapter not found"));

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
