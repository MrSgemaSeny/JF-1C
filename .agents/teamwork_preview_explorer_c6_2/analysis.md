# Investigation Analysis: C6 — OfficialDocumentTemplateSeeder Remediation

## Executive Summary
This report presents the investigation and remediation design for issue **C6 (OfficialDocumentTemplateSeeder Deletes Templates on Every Start)** in JF-1C (ZhanFinance).

Currently, `OfficialDocumentTemplateSeeder` uses a destructive "delete-then-insert" pattern combined with an improper global `count() >= 3` guard check. On application startup, if the condition is met or if templates are being seeded, existing official document templates in PostgreSQL/H2 are deleted, any admin customizations (customized files, descriptions) are wiped, and foreign keys in `documents.generated_from_template_id` are permanently severed (`nullified`).

We propose replacing this destructive routine with a non-destructive, idempotent skip-if-present pattern, eliminating template deletions and reference nullifications, and adding full test coverage.

---

## 1. Codebase and Schema Inventory

### 1.1 Affected Files
- **Seeder**: `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/config/OfficialDocumentTemplateSeeder.java`
- **Entity**: `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/entity/DocumentTemplate.java`
- **Repository**: `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/repository/DocumentTemplateRepository.java`
- **Related Entities / Repositories**:
  - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/entity/Document.java` (column `generatedFromTemplate`)
  - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/repository/DocumentRepository.java` (`nullifyTemplateReference`)
  - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/service/StorageService.java`
  - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/auth/repository/UserRepository.java`
- **Database Migrations**:
  - `zhan-finance-backend/src/main/resources/db/migration/V35__Create_Document_Templates.sql`

---

## 2. Database Schema & Uniqueness Identification

### 2.1 Table Definition (`document_templates`)
Defined in Flyway migration `V35__Create_Document_Templates.sql`:
```sql
CREATE TABLE document_templates (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    file_path   VARCHAR(500) NOT NULL,
    created_by  UUID REFERENCES users(id),
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE SEQUENCE doc_number_seq START 1000;

ALTER TABLE documents ADD COLUMN generated_from_template_id UUID REFERENCES document_templates(id);
```

### 2.2 Uniqueness and Constraints Analysis
1. **Database Constraints**:
   - Primary Key: `id` (UUID).
   - Foreign Key: `created_by` references `users(id)`.
   - Dependent FK: `documents.generated_from_template_id` references `document_templates(id)`.
   - **No UNIQUE constraint** exists at the DB level on `name` or `file_path`.
   - No `code`, `type`, or `slug` column exists in `document_templates`.

2. **Domain Identification**:
   - Official document templates are identified exclusively by their canonical Russian names:
     1. `"Акт выполненных работ (Форма Р-1)"` (Act of Completed Works - Form R-1 RK)
     2. `"Отчет об оказанных услугах (АВР)"` (Report of Rendered Services)
     3. `"Лист согласования и подписи"` (Client Approval and Signature Sheet)
   - Uniqueness check in application logic must be performed via case-insensitive matching (`name.equalsIgnoreCase(t.getName())` or `existsByNameIgnoreCase(name)`).

---

## 3. Root Cause & Defect Breakdown

### 3.1 Defect 1: Destructive Deletion in `createTemplateIfAbsent`
In `OfficialDocumentTemplateSeeder.java` (lines 74-99):
```java
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
```
**Consequences**:
1. When a template with matching name is found, `documentRepository.nullifyTemplateReference(t.getId())` runs `UPDATE documents SET generated_from_template = null WHERE generated_from_template.id = :templateId`. All past documents generated from this template lose their template provenance.
2. `templateRepository.delete(t)` deletes the template row.
3. A brand-new template with a new random UUID is saved.
4. Any admin customizations to template contents, description, or files are overwritten with hardcoded defaults on deploy.

### 3.2 Defect 2: Flawed Global Count Check
In `OfficialDocumentTemplateSeeder.java` (lines 41-45):
```java
@Override
public void run(ApplicationArguments args) throws Exception {
    if (templateRepository.count() >= 3) {
        log.info("Official document templates already exist, skipping DOCX generation.");
        return;
    }
    ...
```
**Consequences**:
1. If an admin creates 3 custom templates (e.g. "Contract", "NDA", "Invoice Custom"), `templateRepository.count()` is 3. The seeder exits early, and none of the 3 official templates are ever seeded.
2. If total template count is < 3 (e.g. 2 templates exist), the check passes, causing `createTemplateIfAbsent` to execute for all 3 official templates, deleting whichever official templates already existed.

### 3.3 Defect 3: Lifecycle Inconsistency
`OfficialDocumentTemplateSeeder` implements `ApplicationRunner`. Project architecture guidelines (Critical Rule 4 in AGENTS.md) mandate:
`DB Operations: DB seeding/startup operations strictly via @EventListener(ApplicationReadyEvent.class).`
Standardizing to `@EventListener(ApplicationReadyEvent.class)` ensures consistency with `PipelineSeederService` and `ServiceDatabaseSeeder`.

---

## 4. Proposed Remediation Design

### 4.1 Repository Enhancements
Add `existsByNameIgnoreCase(String name)` to `DocumentTemplateRepository`:
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

    boolean existsByNameIgnoreCase(String name);

    Optional<DocumentTemplate> findByNameIgnoreCase(String name);

    @Query(value = "SELECT nextval('doc_number_seq')", nativeQuery = true)
    Long getNextDocNumber();
}
```

### 4.2 Seeder Logic Overhaul
In `OfficialDocumentTemplateSeeder`:
1. Remove the global `count() >= 3` check.
2. For each official template definition, check `templateRepository.existsByNameIgnoreCase(name)`:
   - **If exists**: Log info and skip. Do NOT delete, do NOT nullify references, do NOT store new DOCX.
   - **If absent**: Generate DOCX, store in `StorageService`, save new `DocumentTemplate`.
3. Admin user resolution: Safely query `userRepository.findAllByRole(Role.ADMIN).stream().findFirst().or(() -> userRepository.findAll().stream().findFirst()).orElse(null)`.
4. Remove `documentRepository.nullifyTemplateReference` call from the seeder. `DocumentRepository` is no longer needed in the seeder.

### 4.3 Proposed Implementation Code
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
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.io.ByteArrayOutputStream;
import java.util.function.Supplier;

@Component
public class OfficialDocumentTemplateSeeder {

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

    @EventListener(ApplicationReadyEvent.class)
    public void seedOfficialTemplates() {
        User admin = userRepository.findAllByRole(Role.ADMIN).stream().findFirst()
                .or(() -> userRepository.findAll().stream().findFirst())
                .orElse(null);

        // 1. Act of Completed Works (Form R-1 RK)
        seedTemplateIfAbsent(
                "Акт выполненных работ (Форма Р-1)",
                "Официальная форма Р-1 утверждена МФ РК для акта приём-передачи оказанных услуг",
                admin,
                this::generateFormR1DocxSafe
        );

        // 2. Report of Rendered Services
        seedTemplateIfAbsent(
                "Отчет об оказанных услугах (АВР)",
                "Подробный отчет о выполненных бухгалтерских и юридических работах по задаче",
                admin,
                this::generateServicesReportDocxSafe
        );

        // 3. Client Approval and Signature Sheet
        seedTemplateIfAbsent(
                "Лист согласования и подписи",
                "Официальный протокол подтверждения приема оказанных услуг клиентом",
                admin,
                this::generateApprovalSheetDocxSafe
        );
    }

    private void seedTemplateIfAbsent(String name, String description, User admin, Supplier<byte[]> docxSupplier) {
        if (templateRepository.existsByNameIgnoreCase(name)) {
            log.info("Official document template '{}' already exists, skipping.", name);
            return;
        }

        transactionTemplate.execute(status -> {
            // Double-check inside transaction to avoid race conditions
            if (templateRepository.existsByNameIgnoreCase(name)) {
                return null;
            }

            try {
                byte[] docxBytes = docxSupplier.get();
                if (docxBytes == null || docxBytes.length == 0) {
                    log.error("Failed to generate DOCX bytes for template: {}", name);
                    return null;
                }

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

    private byte[] generateFormR1DocxSafe() {
        try {
            return generateFormR1Docx();
        } catch (Exception e) {
            log.error("Error generating Form R-1 DOCX", e);
            return null;
        }
    }

    private byte[] generateServicesReportDocxSafe() {
        try {
            return generateServicesReportDocx();
        } catch (Exception e) {
            log.error("Error generating Services Report DOCX", e);
            return null;
        }
    }

    private byte[] generateApprovalSheetDocxSafe() {
        try {
            return generateApprovalSheetDocx();
        } catch (Exception e) {
            log.error("Error generating Approval Sheet DOCX", e);
            return null;
        }
    }

    // DOCX generation methods (addParagraph, generateFormR1Docx, generateServicesReportDocx, generateApprovalSheetDocx) remain intact
    ...
}
```

---

## 5. Test Strategy & Plan

### 5.1 Current Test Assessment
- `DocumentTemplateServiceTest.java` tests template CRUD operations in the service layer.
- Zero tests currently exist for `OfficialDocumentTemplateSeeder`.

### 5.2 Required Test Class
Create `zhan-finance-backend/src/test/java/com/example/zhanfinancebackend/modules/documents/config/OfficialDocumentTemplateSeederTest.java`.

### 5.3 Test Cases Matrix

| Test Method | Setup Condition | Expected Behavior | Acceptance Criteria |
|---|---|---|---|
| `seed_onEmptyDatabase_seedsAllThreeTemplates` | DB has 0 templates | All 3 templates generated and saved in DB | `templateRepository.save()` called 3 times; 3 storage keys stored |
| `seed_whenAllTemplatesExist_skipsAllAndPreservesData` | DB has all 3 templates existing | 0 templates saved, 0 storage calls, 0 deletes | `storageService.store()` NEVER called; `templateRepository.delete()` NEVER called; existing templates unchanged |
| `seed_whenPartialTemplatesExist_seedsOnlyMissing` | 1 of 3 templates exists in DB | Only the 2 missing templates are generated and saved | Existing template preserved; exactly 2 new templates saved |
| `seed_preservesAdminCustomization` | Admin modified description/file of an official template | Re-running seeder does not delete or overwrite custom properties | Custom description/file path remains identical before and after seeder execution |
| `seed_whenCustomTemplatesExist_stillSeedsOfficial` | 3 custom non-official templates exist (total count = 3) | All 3 official templates are seeded (total becomes 6) | Overcomes old `count() >= 3` bug |

---

## 6. Implementation Risk Assessment
- **Breaking Changes**: None. The public API and DTO contracts remain completely unchanged.
- **Data Safety**: Eliminates the only data-loss defect on application restart in the documents module.
- **Performance**: Skips Apache POI DOCX generation entirely when templates are present, saving CPU and memory during server boot.
