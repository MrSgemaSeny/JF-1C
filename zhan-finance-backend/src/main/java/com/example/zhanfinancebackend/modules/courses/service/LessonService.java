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

import com.example.zhanfinancebackend.modules.courses.entity.Chapter;
import com.example.zhanfinancebackend.modules.courses.repository.ChapterRepository;

@Service
public class LessonService {

    private final LessonRepository lessonRepository;
    private final ChapterRepository chapterRepository;
    private final CourseRepository courseRepository;
    private final StorageService storageService;

    public LessonService(LessonRepository lessonRepository, ChapterRepository chapterRepository, CourseRepository courseRepository, StorageService storageService) {
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
        return lesson;
    }

    @Transactional
    public Lesson createLesson(Long courseId, String title, String description, LessonType type, int orderIndex, MultipartFile file) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Course not found"));

        Chapter chapter;
        if (course.getChapters().isEmpty()) {
            chapter = new Chapter();
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
        Chapter chapter = chapterRepository.findById(chapterId)
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
    public Lesson updateLesson(Long id, String title, String description, String content, Integer orderIndex, MultipartFile videoFile, MultipartFile documentFile) {
        Lesson lesson = getLessonById(id);
        if (title != null) lesson.setTitle(title);
        if (description != null) lesson.setDescription(description);
        if (content != null) lesson.setContent(content);
        if (orderIndex != null) lesson.setOrderIndex(orderIndex);

        if (videoFile != null && !videoFile.isEmpty()) {
            String filePath = storageService.store(videoFile);
            lesson.setMediaUrl("/uploads/" + filePath);
        }

        if (documentFile != null && !documentFile.isEmpty()) {
            String filePath = storageService.store(documentFile);
            lesson.setFileUrl("/uploads/" + filePath);
        }

        return lessonRepository.save(lesson);
    }

    @Transactional
    public void deleteLesson(Long id) {
        Lesson lesson = getLessonById(id);
        lessonRepository.deleteById(id);
    }
}
