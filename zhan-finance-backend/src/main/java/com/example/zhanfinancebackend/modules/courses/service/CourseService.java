package com.example.zhanfinancebackend.modules.courses.service;

import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.courses.entity.Course;
import com.example.zhanfinancebackend.modules.courses.entity.CourseSection;
import com.example.zhanfinancebackend.modules.courses.repository.CourseRepository;
import com.example.zhanfinancebackend.modules.courses.repository.CourseSectionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CourseService {

    private final CourseRepository courseRepository;
    private final CourseSectionRepository sectionRepository;

    public CourseService(CourseRepository courseRepository, CourseSectionRepository sectionRepository) {
        this.courseRepository = courseRepository;
        this.sectionRepository = sectionRepository;
    }

    @Transactional(readOnly = true)
    public List<Course> getAllCourses() {
        List<Course> courses = courseRepository.findAll();
        courses.forEach(this::initializeCourse);
        return courses;
    }

    @Transactional(readOnly = true)
    public List<Course> getPublishedCourses() {
        List<Course> courses = courseRepository.findAllByIsPublishedTrue();
        courses.forEach(this::initializeCourse);
        return courses;
    }

    @Transactional(readOnly = true)
    public Course getCourseById(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        initializeCourse(course);
        return course;
    }

    private void initializeCourse(Course course) {
        if (course.getSections() != null) {
            course.getSections().size();
            course.getSections().forEach(section -> {
                if (section.getLessons() != null) {
                    section.getLessons().size();
                }
            });
        }
    }

    @Transactional
    public Course createCourse(String title, String description, String thumbnail, boolean isPublished, User admin) {
        Course course = new Course();
        course.setTitle(title);
        course.setDescription(description);
        course.setThumbnail(thumbnail);
        course.setPublished(isPublished);
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
        course.setPublished(isPublished);
        return courseRepository.save(course);
    }

    @Transactional
    public void deleteCourse(Long id) {
        courseRepository.deleteById(id);
    }

    @Transactional
    public CourseSection createSection(Long courseId, String title, int orderIndex) {
        Course course = getCourseById(courseId);
        CourseSection section = new CourseSection();
        section.setCourse(course);
        section.setTitle(title);
        section.setOrderIndex(orderIndex);
        section = sectionRepository.save(section);
        if (section.getLessons() != null) section.getLessons().size();
        return section;
    }

    @Transactional
    public CourseSection updateSection(Long sectionId, String title, Integer orderIndex) {
        CourseSection section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new RuntimeException("Section not found"));
        if (title != null) section.setTitle(title);
        if (orderIndex != null) section.setOrderIndex(orderIndex);
        if (section.getLessons() != null) section.getLessons().size();
        return sectionRepository.save(section);
    }

    @Transactional
    public void deleteSection(Long sectionId) {
        sectionRepository.deleteById(sectionId);
    }
}
