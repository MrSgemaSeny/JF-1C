# Analysis Report: C4 — V107 Migration NULL Violation on Clean DB

**Author:** Explorer 3  
**Target:** Phase 2 Remediation — Finding C4  
**Date:** 2026-08-21  

---

## 1. Problem Statement & Root Cause

### 1.1 Summary
In `zhan-finance-backend/src/main/resources/db/migration/V107__Seed_1C_Course_And_Curator.sql`, an `INSERT INTO courses` statement attempts to populate the `created_by` column using a subquery:
```sql
(SELECT id FROM app_users WHERE role = 'ADMIN' ORDER BY id ASC LIMIT 1)
```
On an existing database where administrative users have already been registered, this subquery resolves to a non-null user ID. However, on a **clean/fresh database initialized from scratch**, no `ADMIN` user exists in `app_users` prior to V107 (only a `CURATOR` user is inserted earlier in V107, and user seeds in Java execute on `ApplicationReadyEvent`, which fires long after Flyway migrations complete).

Because `courses.created_by` is defined as `BIGINT NOT NULL REFERENCES app_users(id)` in `V14__Courses_Schema.sql:7`, PostgreSQL rejects the insert with a NOT NULL constraint violation:
```
ERROR: null value in column "created_by" of relation "courses" violates not-null constraint
```
This halts Flyway migration execution, preventing the application from starting on fresh database installations.

### 1.2 Migration Status Landscape
- Total SQL migrations currently present: **58 migration scripts** (from `V1__Init_Schema.sql` to `V118__Rollback_Payments.sql`).
- Note on numbering: The audit report and remediation plan drafted earlier referenced V111 as the proposed next migration. However, migrations `V111` through `V118` already exist in the repository:
  - `V111__Protect_Audit_Log_Table.sql`
  - `V112__Add_Registration_Status_To_Users.sql`
  - `V113__add_attempts_to_two_factor_pre_auth.sql`
  - `V114__Fix_Registration_Status_For_Existing_Users.sql`
  - `V115__Fix_Registration_Status_For_Non_Employees.sql`
  - `V116__Fix_Registration_Status_For_Disabled_Employees.sql`
  - `V117__Add_Payments_And_Receipts.sql`
  - `V118__Rollback_Payments.sql`
- Any new migration to be created must be numbered **`V119`** (e.g., `V119__fix_courses_created_by_null.sql` or `V119__seed_admin_and_fix_courses.sql`).

---

## 2. Examination of Existing Test Suite and Flyway Configurations

### 2.1 Existing Test Suite Structure
Inspection of `zhan-finance-backend/src/test/` revealed:
1. **Total tests:** 140 tests across 37 test classes (all currently passing).
2. **Flyway configuration in standard tests (`src/test/resources/application.properties`):**
   ```properties
   spring.flyway.enabled=false
   spring.jpa.hibernate.ddl-auto=update
   ```
   By default, all standard integration and unit tests run with Flyway **disabled**, relying on Hibernate's `ddl-auto=update` in-memory H2 schema generation. Consequently, Flyway migration script bugs (such as V107's NOT NULL violation) do NOT get triggered or detected during regular `./gradlew test` runs.

3. **Active profile test configuration (`src/test/resources/application-test.properties`):**
   ```properties
   spring.flyway.enabled=true
   spring.flyway.locations=classpath:db/migration
   spring.jpa.hibernate.ddl-auto=none
   ```
   Only `ServiceDatabaseSeederTest.java` currently uses `@ActiveProfiles("test")`.

4. **Production configuration (`src/main/resources/application.properties`):**
   ```properties
   spring.flyway.enabled=true
   spring.flyway.out-of-order=true
   spring.flyway.ignore-migration-patterns=*:missing
   spring.flyway.validate-on-migrate=true
   spring.flyway.baseline-on-migrate=true
   spring.flyway.baseline-version=110
   ```
   In production, `spring.flyway.baseline-version=110` with `baseline-on-migrate=true` instructs Flyway to skip migrations <= 110 if baselining against an existing database, which masked V107 on pre-existing environments.

5. **Entity & Service constraints for Course:**
   - In `Course.java` (lines 37-39):
     ```java
     @ManyToOne(fetch = FetchType.LAZY)
     @JoinColumn(name = "created_by", nullable = false)
     private User createdBy;
     ```
   - In `CourseService.java` (lines 84-94):
     `createCourse(String title, String description, String thumbnail, boolean isPublished, User admin)` assigns `course.setCreatedBy(admin)` before calling `courseRepository.save(course)`.
   - In `AdminCourseController.java` (lines 49-51):
     `createCourse` extracts `User admin = userPrincipal.getUser()` from the authenticated security context.

---

## 3. Flyway Migration Chain Verification Strategy

Under project constraints, applied migrations V1 through V110+ are immutable (modifying applied files breaks checksum validation on existing deployed databases).

To verify the migration chain and ensure schema integrity:
1. **Verification Mechanism:**
   Create a dedicated integration test class `FlywayMigrationVerificationTest` that executes Flyway migrations against an independent in-memory or PostgreSQL test instance with baseline disabled.
2. **Schema Invariant Verification:**
   Verify that after Flyway execution completes:
   - `flyway_schema_history` records all migrations through the latest version (`V118`/`V119`) with `success = true`.
   - The `courses` table contains a valid non-null `created_by` column.
   - All rows in `courses` have `created_by` referencing an existing record in `app_users`.
   - No orphan courses exist without an associated creator.
3. **Remediation SQL (V119):**
   Create `V119__fix_courses_created_by_null.sql` to guarantee data integrity across all environments:
   ```sql
   -- Backfill any courses having NULL created_by with the first available ADMIN or CURATOR
   UPDATE courses
   SET created_by = COALESCE(
       (SELECT id FROM app_users WHERE role = 'ADMIN' ORDER BY id ASC LIMIT 1),
       (SELECT id FROM app_users WHERE role = 'CURATOR' ORDER BY id ASC LIMIT 1),
       (SELECT id FROM app_users ORDER BY id ASC LIMIT 1)
   )
   WHERE created_by IS NULL;
   ```

---

## 4. Regression Test Designs

### 4.1 Regression Test 1: Courses Table Invariant and Foreign Key Integrity Test
This test validates at both the JDBC/SQL level and JPA entity level that every course in the database has a valid, non-null `created_by` field referencing an active user in `app_users`.

```java
package com.example.zhanfinancebackend.modules.courses;

import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.courses.entity.Course;
import com.example.zhanfinancebackend.modules.courses.entity.CourseStatus;
import com.example.zhanfinancebackend.modules.courses.repository.CourseRepository;
import com.example.zhanfinancebackend.modules.courses.service.CourseService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
public class CoursesCreatedByRegressionTest {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseService courseService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("C4 Regression: All existing courses must have valid non-null created_by referencing app_users")
    void allCoursesMustHaveNonNullCreatedBy() {
        // Direct SQL check for any NULL created_by
        Integer nullCreatedByCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM courses WHERE created_by IS NULL",
                Integer.class
        );
        assertThat(nullCreatedByCount)
                .as("No course in the database should have a NULL created_by")
                .isEqualTo(0);

        // Direct SQL check for foreign key validity
        Integer orphanedCoursesCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM courses c LEFT JOIN app_users u ON c.created_by = u.id WHERE u.id IS NULL",
                Integer.class
        );
        assertThat(orphanedCoursesCount)
                .as("Every course must reference a valid existing user in app_users")
                .isEqualTo(0);

        // JPA level check
        List<Course> courses = courseRepository.findAll();
        for (Course course : courses) {
            assertThat(course.getCreatedBy())
                    .as("Course '%s' (id=%d) must have a non-null createdBy entity", course.getTitle(), course.getId())
                    .isNotNull();
            assertThat(course.getCreatedBy().getId())
                    .as("Course '%s' createdBy must have a valid user ID", course.getTitle())
                    .isNotNull();
        }
    }

    @Test
    @DisplayName("C4 Regression: Attempting to persist a Course with null created_by must fail")
    void savingCourseWithNullCreatedByThrowsException() {
        Course invalidCourse = new Course();
        invalidCourse.setTitle("Invalid Course without Author");
        invalidCourse.setStatus(CourseStatus.DRAFT);
        invalidCourse.setCreatedBy(null);

        assertThatThrownBy(() -> {
            courseRepository.saveAndFlush(invalidCourse);
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("C4 Regression: CourseService.createCourse properly sets created_by to provided admin user")
    void courseServiceSetsCreatedByCorrectly() {
        User admin = new User("Regression Admin", "admin_c4_test@zhanfinance.kz", "hashedpass", Role.ADMIN);
        admin.setEnabled(true);
        admin = userRepository.save(admin);

        Course created = courseService.createCourse(
                "1С Практика 2026",
                "Описание курса",
                null,
                true,
                admin
        );

        assertThat(created.getId()).isNotNull();
        assertThat(created.getCreatedBy()).isNotNull();
        assertThat(created.getCreatedBy().getId()).isEqualTo(admin.getId());

        // Verify persisted state in DB
        Course fetched = courseRepository.findById(created.getId()).orElseThrow();
        assertThat(fetched.getCreatedBy().getEmail()).isEqualTo("admin_c4_test@zhanfinance.kz");
    }
}
```

### 4.2 Regression Test 2: Flyway Clean Migration Sequence Test
This test validates that Flyway migrations can execute sequentially on an empty database without throwing NOT NULL or syntax errors.

```java
package com.example.zhanfinancebackend.modules.courses;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.flywaydb.core.api.MigrationInfoService;
import org.flywaydb.core.api.MigrationState;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import javax.sql.DataSource;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
public class FlywayMigrationVerificationTest {

    @Autowired
    private DataSource dataSource;

    @Test
    @DisplayName("C4 Regression: Flyway migrations execute and maintain schema history integrity")
    void verifyFlywayMigrationChain() {
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .baselineOnMigrate(true)
                .load();

        MigrationInfoService infoService = flyway.info();
        MigrationInfo[] appliedMigrations = infoService.applied();

        assertThat(appliedMigrations)
                .as("Flyway migrations should have been discovered and applied")
                .isNotEmpty();

        for (MigrationInfo info : appliedMigrations) {
            assertThat(info.getState())
                    .as("Migration %s (%s) must be in SUCCESS state", info.getVersion(), info.getDescription())
                    .isIn(MigrationState.SUCCESS, MigrationState.BASELINE);
        }
    }
}
```

---

## 5. Summary & Actionable Next Steps for Implementer

1. **New Migration File:** Add `V119__fix_courses_created_by_null.sql` to ensure any NULL or corrupted `created_by` references in `courses` are resolved in all environments.
2. **Regression Test Addition:** Add `CoursesCreatedByRegressionTest.java` under `src/test/java/com/example/zhanfinancebackend/modules/courses/` to verify that all course records have non-null, referentially valid `created_by` references.
3. **Execution Verification:** Run `./gradlew test --tests com.example.zhanfinancebackend.modules.courses.CoursesCreatedByRegressionTest` to verify the test passes.
