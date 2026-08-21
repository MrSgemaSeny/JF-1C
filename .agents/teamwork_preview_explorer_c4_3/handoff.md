# Handoff Report: C4 — V107 Migration NULL Violation on Clean DB

**Author:** Explorer 3  
**Target:** Phase 2 Remediation — Finding C4  
**Date:** 2026-08-21  

---

## 1. Observation

1. **V107 Migration SQL Code (`zhan-finance-backend/src/main/resources/db/migration/V107__Seed_1C_Course_And_Curator.sql`):**
   - Lines 7-16:
     ```sql
     INSERT INTO courses (title, description, thumbnail, status, created_by, created_at, updated_at)
     SELECT 
         '1С:Бухгалтерия 8.3 — Полный практический курс', 
         'Практический обучающий курс по ведению комплексного учета в 1С:Бухгалтерия 8.3. Изучение настройки учетной политики, работы с документами, банка и кассы, расчета зарплаты и формирования налоговой отчетности.', 
         'https://images.unsplash.com/photo-1554200876-56c2f25224fa?q=80&w=800&auto=format&fit=crop', 
         'PUBLISHED', 
         (SELECT id FROM app_users WHERE role = 'ADMIN' ORDER BY id ASC LIMIT 1), 
         CURRENT_TIMESTAMP, 
         CURRENT_TIMESTAMP
     WHERE NOT EXISTS (SELECT 1 FROM courses WHERE title = '1С:Бухгалтерия 8.3 — Полный практический курс');
     ```
2. **Schema Definition (`zhan-finance-backend/src/main/resources/db/migration/V14__Courses_Schema.sql`):**
   - Line 7: `created_by BIGINT NOT NULL REFERENCES app_users(id),`
3. **Absence of ADMIN in Prior Migrations:**
   - Grep search across `zhan-finance-backend/src/main/resources/db/migration/*.sql` for `INSERT INTO app_users` revealed only 1 insert statement in `V107:2` inserting a `CURATOR` (`curator1c@zhanfinance.kz`). No `ADMIN` user is seeded in migrations V1 through V107.
4. **Current Migration Count and Highest Version:**
   - There are 58 SQL migration files present.
   - The highest migration currently in the repository is `V118__Rollback_Payments.sql`.
   - Therefore, any new Flyway migration must be numbered `V119__*.sql`.
5. **Existing Flyway Test Configuration:**
   - In `zhan-finance-backend/src/test/resources/application.properties` (lines 15-17):
     ```properties
     # отключить Flyway в тестах
     spring.flyway.enabled=false
     spring.flyway.locations=classpath:db/migration
     ```
   - In `zhan-finance-backend/src/main/resources/application.properties` (lines 31-37):
     ```properties
     spring.flyway.enabled=true
     spring.flyway.out-of-order=true
     spring.flyway.ignore-migration-patterns=*:missing
     spring.flyway.validate-on-migrate=true
     spring.flyway.baseline-on-migrate=true
     spring.flyway.baseline-version=110
     ```
   - Running `./gradlew test` passes 140/140 tests because Flyway is disabled during standard test execution.

---

## 2. Logic Chain

1. In `V14__Courses_Schema.sql:7`, `courses.created_by` was defined with a strict `NOT NULL` constraint and foreign key to `app_users(id)`.
2. When Flyway runs on a fresh database from scratch (starting at version 1), migrations V1 through V106 do not insert any user with `role = 'ADMIN'`.
3. In `V107__Seed_1C_Course_And_Curator.sql:13`, the insert statement executes subquery `(SELECT id FROM app_users WHERE role = 'ADMIN' ORDER BY id ASC LIMIT 1)`.
4. On a clean DB, this subquery returns `NULL`.
5. Inserting `NULL` into `courses.created_by` violates the column's `NOT NULL` constraint on PostgreSQL, halting Flyway execution.
6. The reason this issue did not break production is because `application.properties` specifies `spring.flyway.baseline-version=110` with `baseline-on-migrate=true`, so existing environments that baselined at 110 skipped V107.
7. Modifying applied migration files V1–V110 is strictly forbidden by project constraints (immutable migrations to preserve checksums).
8. Therefore, remediation requires:
   - Creating a new Flyway migration `V119__fix_courses_created_by_null.sql` that backfills `created_by` on any existing or newly inserted courses with a valid admin/curator ID.
   - Adding a regression test `CoursesCreatedByRegressionTest.java` verifying that all courses have valid non-null `created_by` values referencing existing records in `app_users`.

---

## 3. Caveats

- In-memory H2 tests may exhibit slight dialect differences compared to PostgreSQL regarding certain PostgreSQL-specific PL/pgSQL syntax (e.g. `V111__Protect_Audit_Log_Table.sql`).
- Existing migrations V1–V110 cannot be modified in place.
- If a future deployment runs from clean baseline 0 directly against raw PostgreSQL without baseline=110, an initial admin user or baseline adjustment is needed in the deployment configuration.

---

## 4. Conclusion

The root cause of C4 is the subquery `(SELECT id FROM app_users WHERE role = 'ADMIN' ORDER BY id ASC LIMIT 1)` in `V107__Seed_1C_Course_And_Curator.sql:13` evaluating to `NULL` on an unpopulated database, violating `courses.created_by NOT NULL`.

The fix consists of:
1. Creating `V119__fix_courses_created_by_null.sql` to backfill and guarantee `created_by` validity.
2. Adding `CoursesCreatedByRegressionTest.java` to test DB foreign key invariants and JPA entity validation.

---

## 5. Verification Method

1. **Inspect Migration Sequence:**
   Verify presence of `V119` after `V118` in `zhan-finance-backend/src/main/resources/db/migration/`.
2. **Execute Regression Test:**
   Run `./gradlew test --tests com.example.zhanfinancebackend.modules.courses.CoursesCreatedByRegressionTest`
   Ensure 3 test cases pass:
   - `allCoursesMustHaveNonNullCreatedBy`: Direct SQL assertion that `COUNT(*) WHERE created_by IS NULL` is 0 and orphaned courses is 0.
   - `savingCourseWithNullCreatedByThrowsException`: Confirms JPA/DB rejects null `createdBy`.
   - `courseServiceSetsCreatedByCorrectly`: Confirms `CourseService.createCourse` assigns and persists creator.
3. **Full Test Suite:**
   Run `./gradlew test` and confirm 0 errors.
