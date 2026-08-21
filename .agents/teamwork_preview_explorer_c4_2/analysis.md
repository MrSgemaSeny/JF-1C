# Comprehensive Analysis Report: C4 — V107 Migration NULL Violation & Course created_by Backfill

## 1. Executive Summary

This investigation analyzed issue C4 from Phase 1 Audit / Phase 2 Remediation:
- In `V107__Seed_1C_Course_And_Curator.sql`, an `INSERT INTO courses` statement uses a subquery `(SELECT id FROM app_users WHERE role = 'ADMIN' ORDER BY id ASC LIMIT 1)` to populate `created_by`.
- On an unseeded / clean database where no user with `role = 'ADMIN'` exists prior to V107, this subquery returns `NULL`.
- Because `courses.created_by` was defined with a `NOT NULL` constraint in `V14__Courses_Schema.sql:7`, PostgreSQL throws `ERROR: null value in column "created_by" of relation "courses" violates not-null constraint`.
- This report details the migration history, references to admin IDs across migrations, the backend `Course` entity and related classes, and formulates the exact idempotent SQL backfill script for remediation.

---

## 2. Examination of Admin User IDs and `created_by` References Across Migrations

### 2.1 Schema Definition & Table Naming
- The primary user table across all migrations is `app_users` (defined in `V2__Accounting_Schema.sql:1-13`).
- Column `role` in `app_users` holds user roles including `'ADMIN'`, `'EMPLOYEE'`, `'CLIENT'`, `'LEARNER'`, `'CURATOR'`, and `'ADVISOR'`.

### 2.2 Foreign Key Constraints on `created_by` / `created_by_id`
Across the 58 Flyway migration files:
1. `V2__Accounting_Schema.sql` (line 24, 27):
   `invoices.created_by_id BIGINT NOT NULL` with `CONSTRAINT fk_invoices_creator FOREIGN KEY (created_by_id) REFERENCES app_users (id) ON DELETE RESTRICT`.
2. `V3__Crm_Schema.sql` (line 21):
   `tasks.created_by_id BIGINT NOT NULL REFERENCES app_users(id)`.
3. `V14__Courses_Schema.sql` (line 7):
   `courses.created_by BIGINT NOT NULL REFERENCES app_users(id)`.
4. `V35__Create_Document_Templates.sql` (line 6):
   `created_by UUID REFERENCES users(id)` (historical anomaly, later adjusted/seeded via Java seeder).
5. `V106__Add_Curator_Role_And_Course_Curators.sql` (line 9):
   `course_curators.assigned_by BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE`.

### 2.3 Subquery References to `ADMIN` User
Across all migration scripts:
- The subquery `(SELECT id FROM app_users WHERE role = 'ADMIN' ORDER BY id ASC LIMIT 1)` is used in exactly one migration: `V107__Seed_1C_Course_And_Curator.sql` at:
  - Line 13: Value for `courses.created_by`.
  - Line 23: Value for `course_curators.assigned_by` via `CROSS JOIN`.
- In backend Java seeders: `DatabaseMigrationRunner.java` (line 49) also contained the identical query pattern prior to migration extraction.
- Crucially, NO Flyway migration prior to V107 inserts any user with `role = 'ADMIN'`. The only user inserted in Flyway migrations prior to V108 is `curator1c@zhanfinance.kz` (with `role = 'CURATOR'`) in V107 itself.

---

## 3. Backend Code Analysis: Course Entity and `created_by` Requirement

### 3.1 Course Entity (`Course.java`)
Location: `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/courses/entity/Course.java`
Lines 36-39:
```java
@JsonIgnore
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "created_by", nullable = false)
private User createdBy;
```
- The entity explicitly configures `@JoinColumn(name = "created_by", nullable = false)`.
- Hibernate enforces `nullable = false` mapping validation and expects a non-null foreign key reference to `app_users`.

### 3.2 Related LMS Entities
- `CourseCurator.java` (`zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/courses/entity/CourseCurator.java`):
  Lines 27-29:
  ```java
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "assigned_by", nullable = false)
  private User assignedBy;
  ```
- `Chapter.java`, `Lesson.java`, `LessonBlock.java`, `Certificate.java`, `Enrollment.java`:
  Do not have a direct `created_by` column; they reference `course_id`, `chapter_id`, `lesson_id`, or `user_id`.

### 3.3 Services and DTOs
- `CourseService.java`:
  - `createCourse(...)` receives `User admin` and executes `course.setCreatedBy(admin)`.
  - `updateCourse(...)` does not mutate `createdBy`.
- `AdminCourseController.java`:
  - `createCourse(...)` extracts `@AuthenticationPrincipal UserPrincipal userPrincipal` and passes `userPrincipal.getUser()` as `admin`.
- `GlobalSearchService.java`:
  - Line 133 contains null-safe handling: `if (c.getCreatedBy() != null) dto.setCreatedById(c.getCreatedBy().getId());`.
- `CourseDto.java`:
  - Contains `private Long createdById;`.

---

## 4. Migration Numbering Assessment (V111 vs V119)

- The Phase 2 Remediation Plan originally referenced `V111__fix_courses_created_by_null.sql`.
- However, examination of the repository reveals that migrations `V111` through `V118` have already been committed:
  - `V111__Protect_Audit_Log_Table.sql`
  - `V112__Add_Registration_Status_To_Users.sql`
  - `V113__add_attempts_to_two_factor_pre_auth.sql`
  - `V114__Fix_Registration_Status_For_Existing_Users.sql`
  - `V115__Fix_Registration_Status_For_Non_Employees.sql`
  - `V116__Fix_Registration_Status_For_Disabled_Employees.sql`
  - `V117__Add_Payments_And_Receipts.sql`
  - `V118__Rollback_Payments.sql`
- Therefore, the new migration MUST be named `V119__fix_courses_created_by_null.sql` (or `V119__Fix_Courses_Created_By_Null.sql`) to prevent version conflicts with existing migrations and preserve Flyway checksum integrity.

---

## 5. Formulated SQL Migration Script

The proposed SQL migration ensures complete idempotency and safety across both clean and existing databases:

```sql
-- Migration: Fix courses created_by NULL values and backfill with first ADMIN user
-- File: V119__fix_courses_created_by_null.sql
-- Module: LMS (courses)
-- Rationale: Ensures any course records missing created_by are assigned to the primary admin user.

-- 1. Backfill created_by for any courses where created_by is NULL
UPDATE courses
SET created_by = (
    SELECT id
    FROM app_users
    WHERE role = 'ADMIN'
    ORDER BY id ASC
    LIMIT 1
)
WHERE created_by IS NULL
  AND EXISTS (
    SELECT 1
    FROM app_users
    WHERE role = 'ADMIN'
);

-- 2. Backfill assigned_by in course_curators if any unassigned curator records exist
UPDATE course_curators
SET assigned_by = (
    SELECT id
    FROM app_users
    WHERE role = 'ADMIN'
    ORDER BY id ASC
    LIMIT 1
)
WHERE assigned_by IS NULL
  AND EXISTS (
    SELECT 1
    FROM app_users
    WHERE role = 'ADMIN'
);

-- 3. Idempotent re-link of default 1C course curator if missing
INSERT INTO course_curators (course_id, curator_id, assigned_by, created_at, updated_at)
SELECT c.id, u.id, a.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM courses c
CROSS JOIN app_users u
CROSS JOIN (SELECT id FROM app_users WHERE role = 'ADMIN' ORDER BY id ASC LIMIT 1) a
WHERE c.title = '1С:Бухгалтерия 8.3 — Полный практический курс'
  AND u.email = 'curator1c@zhanfinance.kz'
  AND NOT EXISTS (SELECT 1 FROM course_curators WHERE course_id = c.id AND curator_id = u.id)
  AND EXISTS (SELECT 1 FROM app_users WHERE role = 'ADMIN');
```

### Script Invariants & Safety Guarantees:
1. **Idempotency**: If all courses already have non-null `created_by`, the `WHERE created_by IS NULL` clause matches 0 rows.
2. **Null Safety**: The `AND EXISTS (SELECT 1 FROM app_users WHERE role = 'ADMIN')` guard prevents updating `created_by` to NULL if no admin user is present.
3. **Immutability Compliance**: Does not touch or edit `V107__Seed_1C_Course_And_Curator.sql` or any earlier migration.
4. **Relational Integrity**: Uses `app_users(id)` and matches foreign key constraint `courses_created_by_fkey`.
