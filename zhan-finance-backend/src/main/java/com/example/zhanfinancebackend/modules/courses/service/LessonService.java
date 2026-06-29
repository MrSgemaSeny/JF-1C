package com.example.zhanfinancebackend.modules.courses.service;

import com.example.zhanfinancebackend.modules.courses.entity.CourseSection;
import com.example.zhanfinancebackend.modules.courses.entity.Lesson;
import com.example.zhanfinancebackend.modules.courses.entity.LessonType;
import com.example.zhanfinancebackend.modules.courses.repository.CourseSectionRepository;
import com.example.zhanfinancebackend.modules.courses.repository.LessonRepository;
import com.example.zhanfinancebackend.modules.documents.service.StorageService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class LessonService {

    private final LessonRepository lessonRepository;
    private final CourseSectionRepository sectionRepository;
    private final StorageService storageService;

    public LessonService(LessonRepository lessonRepository, CourseSectionRepository sectionRepository, StorageService storageService) {
        this.lessonRepository = lessonRepository;
        this.sectionRepository = sectionRepository;
        this.storageService = storageService;
    }

    public Lesson getLessonById(Long id) {
        return lessonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lesson not found"));
    }

    @Transactional
    public Lesson createLesson(Long sectionId, String title, String description, LessonType type, int orderIndex, MultipartFile file) {
        CourseSection section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new RuntimeException("Section not found"));

        Lesson lesson = new Lesson();
        lesson.setSection(section);
        lesson.setTitle(title);
        lesson.setDescription(description);
        lesson.setType(type);
        lesson.setOrderIndex(orderIndex);

        if (file != null && !file.isEmpty()) {
            String filePath = storageService.store(file);
            lesson.setFilePath(filePath);
            lesson.setFileName(file.getOriginalFilename());
            lesson.setContentType(file.getContentType());
            lesson.setFileSize(file.getSize());
        }

        return lessonRepository.save(lesson);
    }

    @Transactional
    public Lesson updateLesson(Long id, String title, String description, Integer orderIndex, MultipartFile file) {
        Lesson lesson = getLessonById(id);
        if (title != null) lesson.setTitle(title);
        if (description != null) lesson.setDescription(description);
        if (orderIndex != null) lesson.setOrderIndex(orderIndex);

        if (file != null && !file.isEmpty()) {
            if (lesson.getFilePath() != null) {
                storageService.delete(lesson.getFilePath());
            }
            String filePath = storageService.store(file);
            lesson.setFilePath(filePath);
            lesson.setFileName(file.getOriginalFilename());
            lesson.setContentType(file.getContentType());
            lesson.setFileSize(file.getSize());
        }

        return lessonRepository.save(lesson);
    }

    @Transactional
    public void deleteLesson(Long id) {
        Lesson lesson = getLessonById(id);
        if (lesson.getFilePath() != null) {
            storageService.delete(lesson.getFilePath());
        }
        lessonRepository.deleteById(id);
    }
}
