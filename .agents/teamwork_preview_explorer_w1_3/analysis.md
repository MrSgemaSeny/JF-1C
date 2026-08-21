# Investigation and Test Suite Design: LMS Sort Order Tiebreaker (W1)

## 1. Executive Summary

This report documents the investigation of issue **W1 (LMS Sort Order Collision)** in ZhanFinance (JF-1C) and presents a comprehensive regression test suite design.

The core issue involves the ordering of course chapters and lessons when multiple items share identical `order_index` values (such as default `0`). Without a secondary sort key, database retrieval order is non-deterministic in PostgreSQL, causing inconsistent UI presentation, unpredictable chapter/lesson sequences, and potential logic failures in sequential lesson unlock rules (`LessonProgressService`).

The audit specification explicitly defines the tiebreaker requirement: `created_at ASC` (or `createdAt ASC` in JPA entity mappings). In earlier remediation work (commit `4604054`), a partial fix introduced `id ASC` rather than `createdAt ASC`. This analysis details the exact root causes, reviews all existing test coverage in `src/test/java/.../courses/`, and designs a multi-layered regression test suite to enforce deterministic sorting by `orderIndex ASC, createdAt ASC`.

---

## 2. Problem Statement and Audit Context

### Audit Finding Reference
- **Finding ID**: W1 (LMS Sort Order Collision)
- **Severity**: WARNING
- **Module**: LMS (`courses`)
- **Remediation Specification**:
  - `ORIGINAL_REQUEST.md`: "Lesson/module sort order: missing `ORDER BY created_at ASC` — confirm the exact query location."
  - `jf1c-phase2-remediation-plan.md`: "W1 — LMS sort order — вторичный ключ сортировки `created_at ASC` в `ChapterRepository`/`LessonRepository`."
  - `audit_report.md`: "Root cause: `CourseService.java:117` uses `orderIndex` for sorting but default value is 0 for all new items -> collision. `ChapterRepository.java:11` has no tiebreaker in ORDER BY. Proposed fix: Add `created_at ASC` as secondary sort key in ChapterRepository and LessonRepository queries."

---

## 3. Detailed Codebase Investigation

### 3.1 Entity Model Layer
1. **`Course.java`** (`zhan-finance-backend/src/main/java/.../modules/courses/entity/Course.java`):
   - Lines 46-49:
     ```java
     @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
     @OrderBy("orderIndex ASC, id ASC")
     @org.hibernate.annotations.BatchSize(size = 50)
     private List<Chapter> chapters = new ArrayList<>();
     ```
   - *Observation*: The `@OrderBy` annotation currently specifies `orderIndex ASC, id ASC`. To align strictly with the `createdAt ASC` requirement, it should be `@OrderBy("orderIndex ASC, createdAt ASC")` (or `@OrderBy("orderIndex ASC, createdAt ASC, id ASC")`).

2. **`Chapter.java`** (`zhan-finance-backend/src/main/java/.../modules/courses/entity/Chapter.java`):
   - Lines 26-32:
     ```java
     @Column(name = "order_index", nullable = false)
     private int orderIndex = 0;

     @OneToMany(mappedBy = "chapter", cascade = CascadeType.ALL, orphanRemoval = true)
     @OrderBy("orderIndex ASC, id ASC")
     @org.hibernate.annotations.BatchSize(size = 50)
     private List<Lesson> lessons = new ArrayList<>();
     ```
   - *Observation*: Default `orderIndex` is initialized to `0`. When multiple lessons are added, their default `orderIndex` is 0. The `@OrderBy` on `lessons` uses `orderIndex ASC, id ASC`. To satisfy the requirement, it should be `@OrderBy("orderIndex ASC, createdAt ASC")`.

3. **`Lesson.java`** (`zhan-finance-backend/src/main/java/.../modules/courses/entity/Lesson.java`):
   - Lines 36-37:
     ```java
     @Column(name = "order_index", nullable = false)
     private int orderIndex = 0;
     ```

4. **`BaseEntity.java`** (`zhan-finance-backend/src/main/java/.../common/audit/BaseEntity.java`):
   - Lines 17-21:
     ```java
     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;

     @Column(nullable = false, updatable = false)
     private Instant createdAt;
     ```
   - *Observation*: All course entities inherit `id`, `createdAt`, and `updatedAt`. `createdAt` is managed automatically via `@PrePersist onCreate()`.

### 3.2 Repository Layer
1. **`ChapterRepository.java`** (`zhan-finance-backend/src/main/java/.../modules/courses/repository/ChapterRepository.java`):
   - Lines 10-13:
     ```java
     @Repository
     public interface ChapterRepository extends JpaRepository<Chapter, Long> {
         List<Chapter> findAllByCourseIdOrderByOrderIndexAscIdAsc(Long courseId);
         List<Chapter> findAllByCourseIdOrderByOrderIndexAsc(Long courseId);
     }
     ```
   - *Observation*: Method currently defined as `findAllByCourseIdOrderByOrderIndexAscIdAsc`. Missing `findAllByCourseIdOrderByOrderIndexAscCreatedAtAsc` (or `findAllByCourseIdOrderByOrderIndexAscCreatedAtAscIdAsc`).

2. **`LessonRepository.java`** (`zhan-finance-backend/src/main/java/.../modules/courses/repository/LessonRepository.java`):
   - Lines 10-12:
     ```java
     @Repository
     public interface LessonRepository extends JpaRepository<Lesson, Long> {
         List<Lesson> findAllByChapterIdOrderByOrderIndexAscIdAsc(Long chapterId);
         ...
     }
     ```
   - *Observation*: Method currently defined as `findAllByChapterIdOrderByOrderIndexAscIdAsc`. Missing `findAllByChapterIdOrderByOrderIndexAscCreatedAtAsc` (or `findAllByChapterIdOrderByOrderIndexAscCreatedAtAscIdAsc`).

### 3.3 Business Logic and Service Layer Impact
1. **`CourseService.java`** (`zhan-finance-backend/src/main/java/.../modules/courses/service/CourseService.java`):
   - Lines 117-127:
     ```java
     @Transactional
     public Chapter createChapter(Long courseId, String title, int orderIndex) {
         Course course = getCourseById(courseId);
         Chapter chapter = new Chapter();
         chapter.setCourse(course);
         chapter.setTitle(title);
         chapter.setOrderIndex(orderIndex);
         course.getChapters().add(chapter);
         courseRepository.save(course);
         return chapter;
     }
     ```
   - When chapters are added, `orderIndex` defaults to 0 from controller parameter `@RequestParam(defaultValue = "0")`.
   - When fetching courses (`getAllCourses`, `getPublishedCourses`, `getCourseById`), `initializeCourse()` traverses `course.getChapters()` and `chapter.getLessons()`. Deterministic ordering relies directly on JPA `@OrderBy`.

2. **`LessonProgressService.java`** (`zhan-finance-backend/src/main/java/.../modules/courses/service/LessonProgressService.java`):
   - Lines 102-125 (`enforceSequenceAndDripRules`):
     ```java
     List<Lesson> orderedLessons = new ArrayList<>();
     for (Chapter chapter : course.getChapters()) {
         orderedLessons.addAll(chapter.getLessons());
     }
     ```
   - *Critical finding*: If `course.getChapters()` or `chapter.getLessons()` return elements in an unstable or non-chronological order when `orderIndex` values collide, learners are locked out of legitimate progression or unlocked in the wrong order.

---

## 4. Review of Existing Course Tests

| Test Class | Path | Type | Current Scope / Weaknesses |
|---|---|---|---|
| `LmsSortOrderRegressionTest` | `modules/courses/` | Unit (Reflection) | Asserts `@OrderBy("orderIndex ASC, id ASC")` and `findAllBy...AscIdAsc`. Does not test `createdAt ASC`. Does not execute any DB or entity queries. |
| `CoursesCreatedByRegressionTest` | `modules/courses/` | Integration (`@SpringBootTest`) | Covers C4: checks V119 SQL backfill, `Course.createdBy` non-null constraints, and `CourseService.createCourse`. High quality template for DB integration testing. |
| `NPlusOneOptimizationRegressionTest` | `modules/courses/` | Unit (Reflection) | Covers C2: checks `@BatchSize` on collections and `@EntityGraph` on DocumentRepository. |
| `CourseAccessServiceTest` | `modules/courses/service/` | Unit (Mockito) | Tests curator and learner permissions on courses. |
| `LessonProgressServiceTest` | `modules/courses/service/` | Unit (Mockito) | Tests sequential unlock, drip rules, admin bypass, certificate generation using hardcoded lists. |
| `CourseIntegrationTests` | root test package | Integration (`@SpringBootTest`, `MockMvc`) | Tests admin create and learner view/download flow over HTTP. |
| `CourseApiSmokeTests` | root test package | Integration (`MockMvc`) | Tests endpoint role security. |

---

## 5. Comprehensive Regression Test Suite Design

The regression test suite for W1 is structured into three distinct verification levels:

1. **Level 1: Annotation & Contract Verification (Fast Unit / Reflection Tests)**
   - Verifies that `@OrderBy` on `Course.chapters` contains `orderIndex ASC, createdAt ASC`.
   - Verifies that `@OrderBy` on `Chapter.lessons` contains `orderIndex ASC, createdAt ASC`.
   - Verifies that `ChapterRepository` and `LessonRepository` contain methods with `CreatedAtAsc` tiebreakers.

2. **Level 2: Database & Spring Data Repository Execution Tests (Integration Tests)**
   - Persists chapters with identical `orderIndex = 0` but distinct `createdAt` timestamps (e.g. T0, T1, T2).
   - Executes repository query methods and verifies exact chronological ordering `[Chapter 0, Chapter 1, Chapter 2]`.
   - Persists lessons with identical `orderIndex = 0` but distinct `createdAt` timestamps.
   - Executes repository query methods and verifies exact chronological ordering `[Lesson 0, Lesson 1, Lesson 2]`.
   - Verifies precedence: `orderIndex` takes precedence over `createdAt` when `orderIndex` values differ.

3. **Level 3: Full ORM Persistence Context & Traversal Tests (Integration Tests)**
   - Saves a `Course` with multiple `Chapter`s having identical `orderIndex = 0` and distinct timestamps.
   - Clears persistence context (`entityManager.clear()`).
   - Fetches the `Course` via `CourseRepository.findById()` / `CourseService.getCourseById()`.
   - Asserts `course.getChapters()` is deterministically sorted by `createdAt ASC`.
   - Asserts `chapter.getLessons()` is deterministically sorted by `createdAt ASC`.
   - Verifies `LessonProgressService` progression order matches the deterministic sequence.

---

## 6. Proposed Test Suite Implementation

Below is the complete design of the expanded regression test suite for `LmsSortOrderRegressionTest.java`.

```java
package com.example.zhanfinancebackend.modules.courses;

import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.courses.entity.Chapter;
import com.example.zhanfinancebackend.modules.courses.entity.Course;
import com.example.zhanfinancebackend.modules.courses.entity.CourseStatus;
import com.example.zhanfinancebackend.modules.courses.entity.Lesson;
import com.example.zhanfinancebackend.modules.courses.entity.LessonType;
import com.example.zhanfinancebackend.modules.courses.repository.ChapterRepository;
import com.example.zhanfinancebackend.modules.courses.repository.CourseRepository;
import com.example.zhanfinancebackend.modules.courses.repository.LessonRepository;
import com.example.zhanfinancebackend.modules.courses.service.CourseService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.OrderBy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class LmsSortOrderRegressionTest {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private ChapterRepository chapterRepository;

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseService courseService;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private User adminUser;

    @BeforeEach
    void setUp() {
        adminUser = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ADMIN)
                .findFirst()
                .orElseGet(() -> userRepository.save(
                        new User("lms_sort_admin@zhanfinance.kz", "hash", "LMS Admin", Role.ADMIN)));
    }

    // ==========================================
    // LEVEL 1: Annotation & Contract Reflection
    // ==========================================

    @Test
    @DisplayName("W1 Regression: Course.chapters and Chapter.lessons have deterministic createdAt ASC secondary sort in @OrderBy")
    void entities_haveDeterministicOrderByWithCreatedAt() throws Exception {
        Field chaptersField = Course.class.getDeclaredField("chapters");
        Field lessonsField = Chapter.class.getDeclaredField("lessons");

        assertTrue(chaptersField.isAnnotationPresent(OrderBy.class), "Course.chapters must have @OrderBy");
        assertTrue(lessonsField.isAnnotationPresent(OrderBy.class), "Chapter.lessons must have @OrderBy");

        String chapterOrderBy = chaptersField.getAnnotation(OrderBy.class).value();
        String lessonOrderBy = lessonsField.getAnnotation(OrderBy.class).value();

        assertTrue(chapterOrderBy.contains("orderIndex ASC") && chapterOrderBy.contains("createdAt ASC"),
                "Course.chapters @OrderBy must include 'orderIndex ASC, createdAt ASC'. Actual: " + chapterOrderBy);
        assertTrue(lessonOrderBy.contains("orderIndex ASC") && lessonOrderBy.contains("createdAt ASC"),
                "Chapter.lessons @OrderBy must include 'orderIndex ASC, createdAt ASC'. Actual: " + lessonOrderBy);
    }

    @Test
    @DisplayName("W1 Regression: ChapterRepository and LessonRepository declare tiebreaker query methods with CreatedAtAsc")
    void repositories_haveDeterministicCreatedAtSortMethods() throws Exception {
        Method chapterSortMethod = ChapterRepository.class.getMethod("findAllByCourseIdOrderByOrderIndexAscCreatedAtAsc", Long.class);
        Method lessonSortMethod = LessonRepository.class.getMethod("findAllByChapterIdOrderByOrderIndexAscCreatedAtAsc", Long.class);

        assertNotNull(chapterSortMethod, "ChapterRepository must declare findAllByCourseIdOrderByOrderIndexAscCreatedAtAsc");
        assertNotNull(lessonSortMethod, "LessonRepository must declare findAllByChapterIdOrderByOrderIndexAscCreatedAtAsc");
    }

    // ==========================================
    // LEVEL 2: Repository DB Query Execution
    // ==========================================

    @Test
    @DisplayName("W1 Regression: ChapterRepository sorts tied orderIndex (all 0) deterministically by createdAt ASC")
    void chapterRepository_sortsTiedOrderIndexByCreatedAtAsc() {
        Course course = new Course();
        course.setTitle("Tied Chapters Course");
        course.setStatus(CourseStatus.PUBLISHED);
        course.setCreatedBy(adminUser);
        course = courseRepository.save(course);

        Instant baseTime = Instant.now().minus(10, ChronoUnit.HOURS);

        // Create 3 chapters with identical orderIndex = 0 but distinct createdAt timestamps
        Chapter ch1 = createChapterDirect(course, "Chapter First Created", 0, baseTime);
        Chapter ch2 = createChapterDirect(course, "Chapter Second Created", 0, baseTime.plus(1, ChronoUnit.HOURS));
        Chapter ch3 = createChapterDirect(course, "Chapter Third Created", 0, baseTime.plus(2, ChronoUnit.HOURS));

        entityManager.flush();
        entityManager.clear();

        List<Chapter> results = chapterRepository.findAllByCourseIdOrderByOrderIndexAscCreatedAtAsc(course.getId());

        assertEquals(3, results.size());
        assertEquals(ch1.getId(), results.get(0).getId());
        assertEquals(ch2.getId(), results.get(1).getId());
        assertEquals(ch3.getId(), results.get(2).getId());
    }

    @Test
    @DisplayName("W1 Regression: LessonRepository sorts tied orderIndex (all 0) deterministically by createdAt ASC")
    void lessonRepository_sortsTiedOrderIndexByCreatedAtAsc() {
        Course course = new Course();
        course.setTitle("Tied Lessons Course");
        course.setStatus(CourseStatus.PUBLISHED);
        course.setCreatedBy(adminUser);
        course = courseRepository.save(course);

        Chapter chapter = createChapterDirect(course, "Main Chapter", 0, Instant.now().minus(5, ChronoUnit.HOURS));

        Instant baseTime = Instant.now().minus(3, ChronoUnit.HOURS);

        // Create 3 lessons with identical orderIndex = 0 but distinct createdAt timestamps
        Lesson les1 = createLessonDirect(chapter, "Lesson Alpha (T0)", 0, baseTime);
        Lesson les2 = createLessonDirect(chapter, "Lesson Beta (T1)", 0, baseTime.plus(30, ChronoUnit.MINUTES));
        Lesson les3 = createLessonDirect(chapter, "Lesson Gamma (T2)", 0, baseTime.plus(60, ChronoUnit.MINUTES));

        entityManager.flush();
        entityManager.clear();

        List<Lesson> results = lessonRepository.findAllByChapterIdOrderByOrderIndexAscCreatedAtAsc(chapter.getId());

        assertEquals(3, results.size());
        assertEquals(les1.getId(), results.get(0).getId());
        assertEquals(les2.getId(), results.get(1).getId());
        assertEquals(les3.getId(), results.get(2).getId());
    }

    @Test
    @DisplayName("W1 Regression: Primary sort key orderIndex takes precedence over createdAt timestamp")
    void repositories_orderIndexPrecedesCreatedAt() {
        Course course = new Course();
        course.setTitle("Precedence Test Course");
        course.setStatus(CourseStatus.PUBLISHED);
        course.setCreatedBy(adminUser);
        course = courseRepository.save(course);

        Instant baseTime = Instant.now().minus(10, ChronoUnit.HOURS);

        // Chapter with orderIndex = 2 created FIRST (earlier timestamp)
        Chapter chLaterIndex = createChapterDirect(course, "Index 2 Created Early", 2, baseTime);
        // Chapter with orderIndex = 1 created LATER (later timestamp)
        Chapter chEarlierIndex = createChapterDirect(course, "Index 1 Created Late", 1, baseTime.plus(2, ChronoUnit.HOURS));

        entityManager.flush();
        entityManager.clear();

        List<Chapter> results = chapterRepository.findAllByCourseIdOrderByOrderIndexAscCreatedAtAsc(course.getId());

        assertEquals(2, results.size());
        assertEquals(chEarlierIndex.getId(), results.get(0).getId(), "Lower orderIndex (1) must precede higher orderIndex (2)");
        assertEquals(chLaterIndex.getId(), results.get(1).getId());
    }

    // ==========================================
    // LEVEL 3: ORM Entity Graph & Service Loading
    // ==========================================

    @Test
    @DisplayName("W1 Regression: Course.chapters collection loaded via CourseService preserves createdAt ASC order on orderIndex ties")
    void courseService_getCourseById_loadsChaptersInDeterministicCreatedAtOrder() {
        Course course = new Course();
        course.setTitle("Service Graph Ordering Course");
        course.setStatus(CourseStatus.PUBLISHED);
        course.setCreatedBy(adminUser);
        course = courseRepository.save(course);

        Instant baseTime = Instant.now().minus(5, ChronoUnit.HOURS);

        Chapter ch1 = createChapterDirect(course, "Chapter 1", 0, baseTime);
        Chapter ch2 = createChapterDirect(course, "Chapter 2", 0, baseTime.plus(10, ChronoUnit.MINUTES));

        Lesson l1 = createLessonDirect(ch1, "Lesson 1.1", 0, baseTime.plus(1, ChronoUnit.MINUTES));
        Lesson l2 = createLessonDirect(ch1, "Lesson 1.2", 0, baseTime.plus(2, ChronoUnit.MINUTES));

        entityManager.flush();
        entityManager.clear();

        Course loaded = courseService.getCourseById(course.getId());

        assertNotNull(loaded);
        assertEquals(2, loaded.getChapters().size());
        assertEquals(ch1.getId(), loaded.getChapters().get(0).getId());
        assertEquals(ch2.getId(), loaded.getChapters().get(1).getId());

        List<Lesson> lessonsOfCh1 = loaded.getChapters().get(0).getLessons();
        assertEquals(2, lessonsOfCh1.size());
        assertEquals(l1.getId(), lessonsOfCh1.get(0).getId());
        assertEquals(l2.getId(), lessonsOfCh1.get(1).getId());
    }

    // ==========================================
    // Helper Methods
    // ==========================================

    private Chapter createChapterDirect(Course course, String title, int orderIndex, Instant createdAt) {
        Chapter chapter = new Chapter();
        chapter.setCourse(course);
        chapter.setTitle(title);
        chapter.setOrderIndex(orderIndex);
        chapter = chapterRepository.save(chapter);

        // Override createdAt directly in DB to guarantee exact deterministic timestamp test values
        jdbcTemplate.update("UPDATE chapters SET created_at = ? WHERE id = ?", Timestamp.from(createdAt), chapter.getId());
        return chapter;
    }

    private Lesson createLessonDirect(Chapter chapter, String title, int orderIndex, Instant createdAt) {
        Lesson lesson = new Lesson();
        lesson.setChapter(chapter);
        lesson.setTitle(title);
        lesson.setType(LessonType.DOCUMENT);
        lesson.setOrderIndex(orderIndex);
        lesson = lessonRepository.save(lesson);

        // Override createdAt directly in DB to guarantee exact deterministic timestamp test values
        jdbcTemplate.update("UPDATE lessons SET created_at = ? WHERE id = ?", Timestamp.from(createdAt), lesson.getId());
        return lesson;
    }
}
```

---

## 7. Recommended Code Adjustments for Implementer

To enable this test suite to pass completely, the implementer must apply the following coordinated changes:

1. **`Course.java`**:
   Update `@OrderBy("orderIndex ASC, id ASC")` to `@OrderBy("orderIndex ASC, createdAt ASC")` (or `@OrderBy("orderIndex ASC, createdAt ASC, id ASC")`).
2. **`Chapter.java`**:
   Update `@OrderBy("orderIndex ASC, id ASC")` to `@OrderBy("orderIndex ASC, createdAt ASC")` (or `@OrderBy("orderIndex ASC, createdAt ASC, id ASC")`).
3. **`ChapterRepository.java`**:
   Ensure `List<Chapter> findAllByCourseIdOrderByOrderIndexAscCreatedAtAsc(Long courseId);` is present.
4. **`LessonRepository.java`**:
   Ensure `List<Lesson> findAllByChapterIdOrderByOrderIndexAscCreatedAtAsc(Long chapterId);` is present.
5. **`LmsSortOrderRegressionTest.java`**:
   Replace static assertions with the comprehensive test suite shown above.
