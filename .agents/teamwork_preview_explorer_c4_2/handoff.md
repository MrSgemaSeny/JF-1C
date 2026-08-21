# Handoff Report: C4 Investigation — V107 Migration NULL Violation & Course created_by Backfill

## 1. Observation

- **Migration Definition & Error Source**:
  - `V14__Courses_Schema.sql:7`: Column defined as `created_by BIGINT NOT NULL REFERENCES app_users(id)`.
  - `V107__Seed_1C_Course_And_Curator.sql:7-16`:
    ```sql
    INSERT INTO courses (title, description, thumbnail, status, created_by, created_at, updated_at)
    SELECT 
        '1С:Бухгалтерия 8.3 — Полный практический курс', 
        'Практический обучающий курс по ведению комплексного учета в 1С:Бухгалтерия 8.3...', 
        'https://images.unsplash.com/photo-1554200876-56c2f25224fa?q=80&w=800&auto=format&fit=crop', 
        'PUBLISHED', 
        (SELECT id FROM app_users WHERE role = 'ADMIN' ORDER BY id ASC LIMIT 1), 
        CURRENT_TIMESTAMP, 
        CURRENT_TIMESTAMP
    WHERE NOT EXISTS (SELECT 1 FROM courses WHERE title = '1С:Бухгалтерия 8.3 — Полный практический курс');
    ```
  - `V107__Seed_1C_Course_And_Curator.sql:19-26`:
    ```sql
    INSERT INTO course_curators (course_id, curator_id, assigned_by, created_at, updated_at)
    SELECT c.id, u.id, a.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM courses c
    CROSS JOIN app_users u
    CROSS JOIN (SELECT id FROM app_users WHERE role = 'ADMIN' ORDER BY id ASC LIMIT 1) a
    WHERE c.title = '1С:Бухгалтерия 8.3 — Полный практический курс'
      AND u.email = 'curator1c@zhanfinance.kz'
      AND NOT EXISTS (SELECT 1 FROM course_curators WHERE course_id = c.id AND curator_id = u.id);
    ```
- **Flyway Migration Chain & User Seeding**:
  - Across migrations `V1` to `V106`, zero users with `role = 'ADMIN'` are inserted into `app_users`.
  - `V107` inserts a curator (`curator1c@zhanfinance.kz` with `role = 'CURATOR'`), but no admin.
  - As a result, on a clean database run, `(SELECT id FROM app_users WHERE role = 'ADMIN' ORDER BY id ASC LIMIT 1)` produces `NULL`, triggering PostgreSQL error `ERROR: null value in column "created_by" of relation "courses" violates not-null constraint`.
- **Backend Code Entities**:
  - `Course.java:38-39`:
    `@JoinColumn(name = "created_by", nullable = false)` on `private User createdBy;`.
  - `CourseCurator.java:28-29`:
    `@JoinColumn(name = "assigned_by", nullable = false)` on `private User assignedBy;`.
  - `CourseService.java:90`:
    `course.setCreatedBy(admin);` explicitly sets the admin user.
  - `GlobalSearchService.java:133`:
    Null-safe check `if (c.getCreatedBy() != null) dto.setCreatedById(c.getCreatedBy().getId());`.
- **Existing Migrations State in Repository**:
  - Existing migrations in `src/main/resources/db/migration` extend from `V1` through `V118` (`V118__Rollback_Payments.sql`).
  - Next sequential migration version is `V119` (not `V111`, as `V111__Protect_Audit_Log_Table.sql` already exists).

---

## 2. Logic Chain

1. In `V14__Courses_Schema.sql:7`, the column `courses.created_by` was created with `NOT NULL` constraint and foreign key to `app_users(id)`.
2. In `Course.java:38`, JPA maps `createdBy` with `@JoinColumn(name = "created_by", nullable = false)`. Both relational DDL and ORM mapping strictly require non-null values.
3. In `V107__Seed_1C_Course_And_Curator.sql:13`, the migration attempts to insert a default course relying on `(SELECT id FROM app_users WHERE role = 'ADMIN' ORDER BY id ASC LIMIT 1)`.
4. When applied on a production database where admin accounts were already present, this subquery resolved to an existing admin ID. However, when migrating a fresh/clean database from V1, no admin user exists in `app_users` prior to V107, yielding NULL and halting migration execution.
5. In accordance with Flyway immutability rules, `V107` cannot be edited retroactively.
6. A forward migration must backfill any courses with `created_by IS NULL` to the first available `ADMIN` user id while ensuring safe idempotency.
7. Because migrations `V111` through `V118` already exist in the repository, the fix must be placed in `V119__fix_courses_created_by_null.sql`.

---

## 3. Caveats

- **Clean DB Initialization**: If a brand-new database is run from scratch, V107 will still fail if no admin is inserted prior to V107. On existing environments where V107 is marked as applied in `flyway_schema_history`, V119 will successfully backfill any NULL rows. If the project ever needs to rebuild clean databases from V1 without pre-existing admin data, a bootstrap mechanism (such as initial admin seed in early migration or conditional trigger) may be considered in future major refactorings, but for Phase 2, Flyway immutability of V1-V118 is strictly enforced.
- **Migration Numbering**: While user request and remediation plan refer to `V111`, `V111__Protect_Audit_Log_Table.sql` is already in production/main; the implementer MUST use `V119__fix_courses_created_by_null.sql`.

---

## 4. Conclusion

1. **Exact SQL Script Formulated**:
   ```sql
   -- V119__fix_courses_created_by_null.sql
   -- Backfill courses.created_by with primary admin user

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
   ```
2. **Backend Entity Confirmation**:
   `Course.java` line 38 has `@JoinColumn(name = "created_by", nullable = false)`, and `CourseCurator.java` line 28 has `@JoinColumn(name = "assigned_by", nullable = false)`. Backend entities require `created_by` / `assigned_by` to be non-null.
3. **Migration Version Target**:
   The implementer must create `src/main/resources/db/migration/V119__fix_courses_created_by_null.sql`.

---

## 5. Verification Method

1. **Static Inspection**:
   - Verify `V14__Courses_Schema.sql:7` (`created_by BIGINT NOT NULL REFERENCES app_users(id)`).
   - Verify `V107__Seed_1C_Course_And_Curator.sql:13` (`(SELECT id FROM app_users WHERE role = 'ADMIN' ORDER BY id ASC LIMIT 1)`).
   - Verify `Course.java:38` (`@JoinColumn(name = "created_by", nullable = false)`).
   - Verify existing migration files in `src/main/resources/db/migration/` up to `V118`.
2. **Post-Implementation Test Command**:
   - Run backend test suite: `./gradlew test --tests *Migration*` and `./gradlew test`.
   - Verify Flyway applies V119 cleanly on an active database without errors.
