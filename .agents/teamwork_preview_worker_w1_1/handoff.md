# Handoff Report: W1 LMS Sort Order Tiebreaker (createdAt ASC)

## 1. Observation

1. **Entities and JPA Annotations**:
   - `Course.java` (`zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/courses/entity/Course.java`):
     - Line 46-49:
       ```java
       @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
       @OrderBy("orderIndex ASC, createdAt ASC, id ASC")
       @org.hibernate.annotations.BatchSize(size = 50)
       private List<Chapter> chapters = new ArrayList<>();
       ```
   - `Chapter.java` (`zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/courses/entity/Chapter.java`):
     - Line 29-32:
       ```java
       @OneToMany(mappedBy = "chapter", cascade = CascadeType.ALL, orphanRemoval = true)
       @OrderBy("orderIndex ASC, createdAt ASC, id ASC")
       @org.hibernate.annotations.BatchSize(size = 50)
       private List<Lesson> lessons = new ArrayList<>();
       ```

2. **Repository Query Methods**:
   - `ChapterRepository.java` (`zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/courses/repository/ChapterRepository.java`):
     - Lines 11-14:
       ```java
       List<Chapter> findAllByCourseIdOrderByOrderIndexAscCreatedAtAsc(Long courseId);
       List<Chapter> findAllByCourseIdOrderByOrderIndexAscCreatedAtAscIdAsc(Long courseId);
       List<Chapter> findAllByCourseIdOrderByOrderIndexAscIdAsc(Long courseId);
       List<Chapter> findAllByCourseIdOrderByOrderIndexAsc(Long courseId);
       ```
   - `LessonRepository.java` (`zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/courses/repository/LessonRepository.java`):
     - Lines 11-13:
       ```java
       List<Lesson> findAllByChapterIdOrderByOrderIndexAscCreatedAtAsc(Long chapterId);
       List<Lesson> findAllByChapterIdOrderByOrderIndexAscCreatedAtAscIdAsc(Long chapterId);
       List<Lesson> findAllByChapterIdOrderByOrderIndexAscIdAsc(Long chapterId);
       ```

3. **Regression Tests**:
   - `LmsSortOrderRegressionTest.java` (`zhan-finance-backend/src/test/java/com/example/zhanfinancebackend/modules/courses/LmsSortOrderRegressionTest.java`):
     - `entities_haveDeterministicOrderBy`: asserts `@OrderBy("orderIndex ASC, createdAt ASC, id ASC")` on `Course.chapters` and `Chapter.lessons`.
     - `repositories_haveDeterministicSortMethods`: asserts reflection existence of `findAllByCourseIdOrderByOrderIndexAscCreatedAtAsc` and `findAllByChapterIdOrderByOrderIndexAscCreatedAtAsc`.
     - `sorting_ordersByCreatedAtAscWhenOrderIndexIdentical`: asserts comparator sorting by `createdAt ASC` when `orderIndex` is identical (0).
     - `sorting_orderIndexTakesPrecedenceOverCreatedAt`: asserts `orderIndex` takes precedence over `createdAt`.

4. **Test & Build Execution**:
   - `./gradlew test --tests "com.example.zhanfinancebackend.modules.courses.LmsSortOrderRegressionTest"` exited 0 (`BUILD SUCCESSFUL in 25s`).
   - `./gradlew test --tests "com.example.zhanfinancebackend.modules.courses.*"` exited 0 (`BUILD SUCCESSFUL in 48s`).
   - `./gradlew test` (full backend test suite) exited 0 (`BUILD SUCCESSFUL in 1m 30s`, 165 tests passed, 0 failures).

5. **Git Commits & Pushes**:
   - Commit on branch `audit/pre-release`: `6de0c2f` (`fix(lms): add secondary sort key createdAt ASC to chapters and lessons (W1)`)
   - Commit on branch `audit/pre-release`: `e44c227` (`docs(epic-04): document deterministic sort order secondary tiebreaker for chapters and lessons`)
   - Pushed to `origin/audit/pre-release`.
   - Second Brain commit: `33e5517` on `main` branch of `new_world`.

## 2. Logic Chain

1. In relational databases and JPA Hibernate mappings, when records share the same primary sort key (`orderIndex = 0`), the SQL standard does not guarantee deterministic row ordering without explicit secondary/tertiary order clauses.
2. In JF-1C, `LessonProgressService` relies on the collection order of `course.getChapters()` and `chapter.getLessons()` for drip-feed unlocking, prerequisite sequence calculations, and course progress percentage computation.
3. Adding `createdAt ASC` as the secondary sort key and `id ASC` as the tertiary sort key ensures that chapters and lessons created first are consistently served first when `orderIndex` values are equal.
4. Adding `findAllByCourseIdOrderByOrderIndexAscCreatedAtAsc` and `findAllByChapterIdOrderByOrderIndexAscCreatedAtAsc` to `ChapterRepository` and `LessonRepository` provides deterministic query execution paths for repository clients while preserving backwards compatibility with existing methods.
5. All regression tests in `LmsSortOrderRegressionTest.java` and all other module integration/unit tests pass with 0 failures.

## 3. Caveats

- No caveats. All changes are backward compatible and tested against both reflection metadata and runtime comparator behavior.

## 4. Conclusion

Remediation for issue W1 is complete:
- Secondary sort key `createdAt ASC` (with `id ASC` tertiary tiebreaker) is active on `Course.chapters` and `Chapter.lessons`.
- Repository methods with secondary sort order are present and available.
- Regression tests verify `@OrderBy` annotations, repository method signatures, and sorting priority.
- Branch `audit/pre-release` and Second Brain journal are updated and pushed.

## 5. Verification Method

To independently verify:
1. Run target regression test:
   `./gradlew test --tests "com.example.zhanfinancebackend.modules.courses.LmsSortOrderRegressionTest"`
2. Run all LMS module tests:
   `./gradlew test --tests "com.example.zhanfinancebackend.modules.courses.*"`
3. Run full test suite:
   `./gradlew test`
4. Inspect source files:
   - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/courses/entity/Course.java`
   - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/courses/entity/Chapter.java`
   - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/courses/repository/ChapterRepository.java`
   - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/courses/repository/LessonRepository.java`
   - `zhan-finance-backend/src/test/java/com/example/zhanfinancebackend/modules/courses/LmsSortOrderRegressionTest.java`
