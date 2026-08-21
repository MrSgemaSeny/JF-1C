# Technical Analysis: C6 (OfficialDocumentTemplateSeeder Idempotency & Customization Protection)

## 1. Executive Summary

- **Issue ID**: C6 [CRITICAL]
- **Target Component**: `OfficialDocumentTemplateSeeder.java` in `com.example.zhanfinancebackend.modules.documents.config`
- **Related Files**:
  - `DocumentTemplateRepository.java`
  - `DocumentTemplate.java`
  - `DocumentRepository.java`
  - `DocumentTemplateService.java`
- **Core Defect**: `OfficialDocumentTemplateSeeder.createTemplateIfAbsent()` executes a destructive delete-then-insert routine (`templateRepository.delete(t)` and `documentRepository.nullifyTemplateReference(t.getId())`), wiping user customizations, custom uploaded files, and severing historical document linkages upon application restart whenever `templateRepository.count() < 3`.
- **Target State**: Non-destructive, idempotent seeding that checks template existence by name/code before generation, skips existing templates without modifying them, lazily generates DOCX binaries only when needed, and preserves custom templates, metadata, and foreign key relations.

---

## 2. Codebase Inventory & Current Architecture

### 2.1 Affected Files
1. `src/main/java/com/example/zhanfinancebackend/modules/documents/config/OfficialDocumentTemplateSeeder.java` (Lines 18-99)
2. `src/main/java/com/example/zhanfinancebackend/modules/documents/repository/DocumentTemplateRepository.java` (Lines 1-17)
3. `src/main/java/com/example/zhanfinancebackend/modules/documents/entity/DocumentTemplate.java` (Lines 1-55)
4. `src/main/java/com/example/zhanfinancebackend/modules/documents/repository/DocumentRepository.java` (Lines 24-26)

### 2.2 Current Seeder Implementation (`OfficialDocumentTemplateSeeder.java`)

```java
@Component
public class OfficialDocumentTemplateSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(OfficialDocumentTemplateSeeder.class);

    private final DocumentTemplateRepository templateRepository;
    private final StorageService storageService;
    private final UserRepository userRepository;
    private final com.example.zhanfinancebackend.modules.documents.repository.DocumentRepository documentRepository;
    private final org.springframework.transaction.support.TransactionTemplate transactionTemplate;

    // ... Constructor ...

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (templateRepository.count() >= 3) {
            log.info("Official document templates already exist, skipping DOCX generation.");
            return;
        }

        User admin = userRepository.findAll().stream().findFirst().orElse(null);

        // 1. Act of Completed Works (Form R-1 RK)
        createTemplateIfAbsent(
                "Акт выполненных работ (Форма Р-1)",
                "Официальная форма Р-1 утверждена МФ РК для акта приём-передачи оказанных услуг",
                admin,
                generateFormR1Docx()
        );

        // 2. Report of Rendered Services
        createTemplateIfAbsent(
                "Отчет об оказанных услугах (АВР)",
                "Подробный отчет о выполненных бухгалтерских и юридических работах по задаче",
                admin,
                generateServicesReportDocx()
        );

        // 3. Client Approval and Signature Sheet
        createTemplateIfAbsent(
                "Лист согласования и подписи",
                "Официальный протокол подтверждения приема оказанных услуг клиентом",
                admin,
                generateApprovalSheetDocx()
        );
    }

    private void createTemplateIfAbsent(String name, String description, User admin, byte[] docxBytes) {
        transactionTemplate.execute(status -> {
            templateRepository.findAll().stream()
                    .filter(t -> name.equalsIgnoreCase(t.getName()))
                    .findFirst()
                    .ifPresent(t -> {
                        documentRepository.nullifyTemplateReference(t.getId());
                        templateRepository.delete(t);
                    });
                    
            try {
                String storageKey = storageService.store(
                        docxBytes,
                        name.replaceAll("[^a-zA-Z0-9_-]", "_") + ".docx",
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                );
                DocumentTemplate template = new DocumentTemplate(name, description, storageKey, admin);
                templateRepository.save(template);
                log.info("Successfully seeded official document template: {}", name);
            } catch (Exception e) {
                log.error("Failed to seed document template {}: {}", name, e.getMessage());
                status.setRollbackOnly();
            }
            return null;
        });
    }
    // ... DOCX generation helper methods ...
}
```

---

## 3. Root Cause Analysis

### 3.1 Destructive Delete-Then-Insert Cycle
In `OfficialDocumentTemplateSeeder.java` lines 76-82:
```java
templateRepository.findAll().stream()
        .filter(t -> name.equalsIgnoreCase(t.getName()))
        .findFirst()
        .ifPresent(t -> {
            documentRepository.nullifyTemplateReference(t.getId());
            templateRepository.delete(t);
        });
```
When `createTemplateIfAbsent` finds an existing template with the target name, instead of skipping insertion, it performs:
1. `documentRepository.nullifyTemplateReference(t.getId())`: Sets `documents.generated_from_template_id = NULL` for all previously created documents pointing to this template.
2. `templateRepository.delete(t)`: Deletes the template entity from PostgreSQL / database table `document_templates`.
3. Creates a new `DocumentTemplate` with the default name, default description, and stores a new default DOCX file in storage.

### 3.2 Failure Modes in Production
1. **User Customization Loss**: If an administrator or employee edits a default template (e.g., changes the description or uploads a revised corporate `.docx` template with official headers and stamp placeholders), any restart where the seeder runs wipes out the customized entity and replaces it with code-generated defaults.
2. **Data Integrity Severing**: All previously generated documents lose their template association (`generatedFromTemplate` becomes `null`), breaking audit trails and reporting.
3. **Fragile Trigger Condition (`count() >= 3`)**:
   - If an administrator deletes one default template because their business does not use it (leaving 2 templates), `templateRepository.count() >= 3` evaluates to `false` on the next server reboot or deployment.
   - The seeder executes for all 3 templates, discovers the 2 remaining customized templates, deletes them, nullifies their document references, and recreates all 3 templates from defaults.
   - If a partial failure occurs during first-run seeding, restarting the application wipes whatever partial seeds were successfully persisted.
4. **Eager Binary Generation Overhead**:
   - `generateFormR1Docx()`, `generateServicesReportDocx()`, and `generateApprovalSheetDocx()` are evaluated eagerly in the `run()` method before `createTemplateIfAbsent` even checks the database, allocating memory and burning CPU for Apache POI document builds even if seeding is unnecessary.
5. **Inefficient Full Table Scans**:
   - `templateRepository.findAll().stream().filter(...)` loads the full table into JVM memory rather than using an indexed query `existsByNameIgnoreCase(name)`.

---

## 4. Remediation Strategy

### 4.1 Step 1: Update `DocumentTemplateRepository.java`
Add query methods to enable existence checks and single-record retrieval without in-memory filtering:

```java
package com.example.zhanfinancebackend.modules.documents.repository;

import com.example.zhanfinancebackend.modules.documents.entity.DocumentTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentTemplateRepository extends JpaRepository<DocumentTemplate, UUID> {

    @Query(value = "SELECT nextval('doc_number_seq')", nativeQuery = true)
    Long getNextDocNumber();

    boolean existsByNameIgnoreCase(String name);

    Optional<DocumentTemplate> findByNameIgnoreCase(String name);
}
```

### 4.2 Step 2: Refactor `OfficialDocumentTemplateSeeder.java`
1. Remove `if (templateRepository.count() >= 3) return;` magic number check.
2. Remove `templateRepository.delete(t)` and `documentRepository.nullifyTemplateReference(t.getId())`.
3. Check `templateRepository.existsByNameIgnoreCase(name)`. If `true`, log at debug/info level and return immediately without doing any work.
4. Use a functional supplier (`DocxGenerator` or `Supplier<byte[]>`) to generate DOCX bytes lazily only when the template is missing.
5. Remove unused `DocumentRepository` dependency from `OfficialDocumentTemplateSeeder`.
6. Retrieve the admin user specifically using `userRepository.findAllByRole(Role.ADMIN)` with graceful fallback.

### 4.3 Proposed Implementation Code Sketch

```java
package com.example.zhanfinancebackend.modules.documents.config;

import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.documents.entity.DocumentTemplate;
import com.example.zhanfinancebackend.modules.documents.repository.DocumentTemplateRepository;
import com.example.zhanfinancebackend.modules.documents.service.StorageService;
import org.apache.poi.xwpf.usermodel.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.io.ByteArrayOutputStream;

@Component
public class OfficialDocumentTemplateSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(OfficialDocumentTemplateSeeder.class);

    private final DocumentTemplateRepository templateRepository;
    private final StorageService storageService;
    private final UserRepository userRepository;
    private final TransactionTemplate transactionTemplate;

    public OfficialDocumentTemplateSeeder(DocumentTemplateRepository templateRepository,
                                         StorageService storageService,
                                         UserRepository userRepository,
                                         TransactionTemplate transactionTemplate) {
        this.templateRepository = templateRepository;
        this.storageService = storageService;
        this.userRepository = userRepository;
        this.transactionTemplate = transactionTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        User admin = userRepository.findAllByRole(Role.ADMIN).stream().findFirst()
                .or(() -> userRepository.findAll().stream().findFirst())
                .orElse(null);

        // 1. Act of Completed Works (Form R-1 RK)
        createTemplateIfAbsent(
                "Акт выполненных работ (Форма Р-1)",
                "Официальная форма Р-1 утверждена МФ РК для акта приём-передачи оказанных услуг",
                admin,
                this::generateFormR1Docx
        );

        // 2. Report of Rendered Services
        createTemplateIfAbsent(
                "Отчет об оказанных услугах (АВР)",
                "Подробный отчет о выполненных бухгалтерских и юридических работах по задаче",
                admin,
                this::generateServicesReportDocx
        );

        // 3. Client Approval and Signature Sheet
        createTemplateIfAbsent(
                "Лист согласования и подписи",
                "Официальный протокол подтверждения приема оказанных услуг клиентом",
                admin,
                this::generateApprovalSheetDocx
        );
    }

    private void createTemplateIfAbsent(String name, String description, User admin, DocxGenerator docxGenerator) {
        if (templateRepository.existsByNameIgnoreCase(name)) {
            log.debug("Document template '{}' already exists, skipping.", name);
            return;
        }

        transactionTemplate.execute(status -> {
            if (templateRepository.existsByNameIgnoreCase(name)) {
                return null;
            }
            try {
                byte[] docxBytes = docxGenerator.generate();
                String storageKey = storageService.store(
                        docxBytes,
                        name.replaceAll("[^a-zA-Z0-9_-]", "_") + ".docx",
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                );
                DocumentTemplate template = new DocumentTemplate(name, description, storageKey, admin);
                templateRepository.save(template);
                log.info("Successfully seeded official document template: {}", name);
            } catch (Exception e) {
                log.error("Failed to seed document template {}: {}", name, e.getMessage());
                status.setRollbackOnly();
            }
            return null;
        });
    }

    @FunctionalInterface
    private interface DocxGenerator {
        byte[] generate() throws Exception;
    }

    // ... Helper and DOCX building methods (addParagraph, generateFormR1Docx, etc.) remain intact ...
}
```

---

## 5. Regression Test Specification

### 5.1 Test Class: `OfficialDocumentTemplateSeederTest`
Location: `src/test/java/com/example/zhanfinancebackend/modules/documents/config/OfficialDocumentTemplateSeederTest.java`

#### Test Case 1: Fresh Database Seeding (All Absent)
- **Objective**: Verify that on a clean database with 0 templates, all 3 official templates are generated, stored, and persisted.
- **Setup**:
  - `templateRepository.existsByNameIgnoreCase(anyString())` returns `false`.
  - `storageService.store(any(byte[].class), anyString(), anyString())` returns `"storage/key.docx"`.
- **Action**: Invoke `seeder.run(null)`.
- **Assertions**:
  - `storageService.store(...)` called exactly 3 times.
  - `templateRepository.save(...)` called exactly 3 times with expected names.
  - `templateRepository.delete(...)` is NEVER called.

#### Test Case 2: Idempotent Skip on Existing Database (All Present)
- **Objective**: Verify that when all 3 templates already exist, no files are stored, no templates are saved or deleted, and no DOCX generation occurs.
- **Setup**:
  - `templateRepository.existsByNameIgnoreCase(anyString())` returns `true`.
- **Action**: Invoke `seeder.run(null)`.
- **Assertions**:
  - `storageService.store(...)` called 0 times (`never()`).
  - `templateRepository.save(...)` called 0 times (`never()`).
  - `templateRepository.delete(...)` called 0 times (`never()`).

#### Test Case 3: Preservation of Customized Templates
- **Objective**: Verify that if an administrator customized an existing template (custom description, custom file storage path), re-running the seeder does not overwrite or delete the template.
- **Setup**:
  - Existing `DocumentTemplate` in DB with name `"Акт выполненных работ (Форма Р-1)"`, description `"Custom Corporate Act v2"`, filePath `"custom/storage/custom_act.docx"`.
  - `templateRepository.existsByNameIgnoreCase("Акт выполненных работ (Форма Р-1)")` returns `true`.
- **Action**: Invoke `seeder.run(null)`.
- **Assertions**:
  - `templateRepository.delete(...)` is NEVER called.
  - `templateRepository.save(...)` is not called for `"Акт выполненных работ (Форма Р-1)"`.
  - The customized template remains intact.

#### Test Case 4: Partial Absence Seeding
- **Objective**: Verify that if only 1 of the 3 templates is absent (e.g. 2 already exist), only the single missing template is seeded, without affecting the other 2.
- **Setup**:
  - `existsByNameIgnoreCase("Акт выполненных работ (Форма Р-1)")` returns `true`.
  - `existsByNameIgnoreCase("Отчет об оказанных услугах (АВР)")` returns `false`.
  - `existsByNameIgnoreCase("Лист согласования и подписи")` returns `true`.
- **Action**: Invoke `seeder.run(null)`.
- **Assertions**:
  - `storageService.store(...)` called exactly 1 time for `"Отчет об оказанных услугах (АВР)"`.
  - `templateRepository.save(...)` called exactly 1 time.
  - The other 2 templates are not touched.

---

## 6. Risk Assessment and Non-Interference Verification

1. **Database Schema**: No migration required. Table `document_templates` already has `name`, `description`, `file_path`, `created_by`, and `created_at`.
2. **Backward Compatibility**: Any templates already in production remain completely unaffected. Future boots will detect their existence and skip cleanly.
3. **No Side Effects on Document Generation**: `DocumentDataLoader` and `DocumentGeneratorService` look up templates by UUID `templateId`. By ensuring template IDs are never deleted and recreated, template IDs remain stable for the entire lifecycle of the application.
