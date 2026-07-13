package com.example.zhanfinancebackend.modules.courses.service;

import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.courses.entity.Course;
import com.example.zhanfinancebackend.modules.courses.repository.CourseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CourseService {

    private final CourseRepository courseRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    public CourseService(CourseRepository courseRepository, org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        this.courseRepository = courseRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @jakarta.annotation.PostConstruct
    public void dropOldColumns() {
        try {
            jdbcTemplate.execute("ALTER TABLE courses DROP COLUMN IF EXISTS is_published;");
        } catch (Exception e) {
            // Ignore
        }
    }

    @Transactional(readOnly = true)
    public List<Course> getAllCourses() {
        List<Course> courses = courseRepository.findAll();
        courses.forEach(this::initializeCourse);
        return courses;
    }

    @Transactional(readOnly = true)
    public List<Course> getPublishedCourses() {
        List<Course> courses = courseRepository.findAllByStatus(com.example.zhanfinancebackend.modules.courses.entity.CourseStatus.PUBLISHED);
        courses.forEach(this::initializeCourse);
        return courses;
    }

    @Transactional(readOnly = true)
    public Course getCourseById(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Course not found"));
        initializeCourse(course);
        return course;
    }

    @Transactional(readOnly = true)
    public Course getPublishedCourseById(Long id) {
        Course course = getCourseById(id);
        if (course.getStatus() != com.example.zhanfinancebackend.modules.courses.entity.CourseStatus.PUBLISHED) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Course is not published");
        }
        return course;
    }

    private void initializeCourse(Course course) {
        if (course.getChapters() != null) {
            course.getChapters().size();
            for (com.example.zhanfinancebackend.modules.courses.entity.Chapter chapter : course.getChapters()) {
                if (chapter.getLessons() != null) {
                    chapter.getLessons().size();
                    for (com.example.zhanfinancebackend.modules.courses.entity.Lesson lesson : chapter.getLessons()) {
                        if (lesson.getBlocks() != null) {
                            lesson.getBlocks().size();
                        }
                    }
                }
            }
        }
    }

    @Transactional
    public Course createCourse(String title, String description, String thumbnail, boolean isPublished, User admin) {
        Course course = new Course();
        course.setTitle(title);
        course.setDescription(description);
        course.setThumbnail(thumbnail);
        course.setStatus(isPublished ? com.example.zhanfinancebackend.modules.courses.entity.CourseStatus.PUBLISHED : com.example.zhanfinancebackend.modules.courses.entity.CourseStatus.DRAFT);
        course.setCreatedBy(admin);
        course = courseRepository.save(course);
        initializeCourse(course);
        return course;
    }

    @Transactional
    public Course updateCourse(Long id, String title, String description, String thumbnail, boolean isPublished) {
        Course course = getCourseById(id);
        if (title != null) course.setTitle(title);
        if (description != null) course.setDescription(description);
        if (thumbnail != null) course.setThumbnail(thumbnail);
        course.setStatus(isPublished ? com.example.zhanfinancebackend.modules.courses.entity.CourseStatus.PUBLISHED : com.example.zhanfinancebackend.modules.courses.entity.CourseStatus.DRAFT);
        return courseRepository.save(course);
    }

    @Transactional
    public void deleteCourse(Long id) {
        courseRepository.deleteById(id);
    }

    @Transactional
    public com.example.zhanfinancebackend.modules.courses.entity.Chapter createChapter(Long courseId, String title, int orderIndex) {
        Course course = getCourseById(courseId);
        com.example.zhanfinancebackend.modules.courses.entity.Chapter chapter = new com.example.zhanfinancebackend.modules.courses.entity.Chapter();
        chapter.setCourse(course);
        chapter.setTitle(title);
        chapter.setOrderIndex(orderIndex);
        course.getChapters().add(chapter);
        courseRepository.save(course);
        // We might want to save chapter directly if there's a ChapterRepository, but CascadeType.ALL should handle it.
        return chapter;
    }
}
