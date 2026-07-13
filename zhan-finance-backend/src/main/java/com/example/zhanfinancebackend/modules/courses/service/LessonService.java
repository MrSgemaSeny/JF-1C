package com.example.zhanfinancebackend.modules.courses.service;

import com.example.zhanfinancebackend.modules.courses.entity.BlockType;
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

    @Transactional(readOnly = true)
    public Lesson getLessonById(Long id) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Lesson not found"));
        if (lesson.getBlocks() != null) {
            lesson.getBlocks().size();
        }
        return lesson;
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

        return createLessonForChapter(chapter.getId(), title, description, type, orderIndex);
    }

    @Transactional
    public Lesson createLessonForChapter(Long chapterId, String title, String description, LessonType type, int orderIndex) {
        com.example.zhanfinancebackend.modules.courses.entity.Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Chapter not found"));

        Lesson lesson = new Lesson();
        lesson.setChapter(chapter);
        lesson.setTitle(title);
        lesson.setDescription(description);
        lesson.setType(type);
        lesson.setOrderIndex(orderIndex);

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

    @Transactional
    public com.example.zhanfinancebackend.modules.courses.entity.LessonBlock addLessonBlock(Long lessonId, com.example.zhanfinancebackend.modules.courses.entity.BlockType type, String content, MultipartFile file) {
        Lesson lesson = getLessonById(lessonId);
        com.example.zhanfinancebackend.modules.courses.entity.LessonBlock block = new com.example.zhanfinancebackend.modules.courses.entity.LessonBlock();
        block.setLesson(lesson);
        block.setType(type);
        block.setOrderIndex(lesson.getBlocks() != null ? lesson.getBlocks().size() : 0);

        if (file != null && !file.isEmpty()) {
            String filePath = storageService.store(file);
            String fileUrl = "/api/documents/files/" + filePath;
            
            if (type == com.example.zhanfinancebackend.modules.courses.entity.BlockType.VIDEO) {
                block.setContent("{\"url\":\"" + fileUrl + "\"}");
            } else if (type == com.example.zhanfinancebackend.modules.courses.entity.BlockType.FILE) {
                block.setContent("{\"url\":\"" + fileUrl + "\",\"name\":\"" + file.getOriginalFilename() + "\"}");
            }
        } else {
            block.setContent(content);
        }

        lesson.getBlocks().add(block);
        lessonRepository.save(lesson);
        return block;
    }
}
