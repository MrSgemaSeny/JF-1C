# Handoff Report: C6 (OfficialDocumentTemplateSeeder Remediation)

## 1. Observation

### 1.1 Trigger Mechanism & Interface Implementation
- **File:** `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/config/OfficialDocumentTemplateSeeder.java`
- **Lines 18, 41-45:**
```java
@Component
public class OfficialDocumentTemplateSeeder implements ApplicationRunner {
...
    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (templateRepository.count() >= 3) {
            log.info("Official document templates already exist, skipping DOCX generation.");
            return;
        }
```
- **Context:** AGENTS.md Critical Rule 4 states: *"DB seeding/startup operations strictly via @EventListener(ApplicationReadyEvent.class)"*. All other seeders (`PipelineSeederService.java:29`, `ServiceDatabaseSeeder.java:30`, `DatabaseMigrationRunner.java:19`) use `@EventListener(ApplicationReadyEvent.class)`.

### 1.2 Destructive Delete-Then-Insert Implementation
- **File:** `OfficialDocumentTemplateSeeder.java`
- **Lines 74-99:**
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

### 1.3 Eager Byte Array Generation in Memory
- **File:** `OfficialDocumentTemplateSeeder.java`
- **Lines 50-72:**
```java
        // 1. Act of Completed Works (Form R-1 RK)
        createTemplateIfAbsent(
                "Акт выполненных работ (Форма Р-1)",
                "Официальная форма Р-1 утверждена МФ РК для акта приём-передачи оказанных услуг",
                admin,
                generateFormR1Docx()
        );
        ...
```
`generateFormR1Docx()`, `generateServicesReportDocx()`, and `generateApprovalSheetDocx()` are evaluated eagerly prior to entering `createTemplateIfAbsent()`.

### 1.4 Database Schema & Repository Capabilities
- **File:** `zhan-finance-backend/src/main/resources/db/migration/V35__Create_Document_Templates.sql`
  - Table `document_templates` has `id UUID PRIMARY KEY`, `name VARCHAR(200) NOT NULL`, `file_path VARCHAR(500) NOT NULL`, `created_by UUID REFERENCES users(id)` (nullable).
  - Foreign key on documents: `ALTER TABLE documents ADD COLUMN generated_from_template_id UUID REFERENCES document_templates(id);`
- **File:** `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/repository/DocumentTemplateRepository.java`
  - Currently contains only `getNextDocNumber()`. Needs `boolean existsByNameIgnoreCase(String name)`.

---

## 2. Logic Chain

1. **Destructive Mutation on Startup:**
   - Observation: When `createTemplateIfAbsent` finds a template with a matching name, lines 79-82 invoke `documentRepository.nullifyTemplateReference(t.getId())` followed by `templateRepository.delete(t)`.
   - Inference: On any startup where `templateRepository.count() < 3`, any existing template matching standard names is permanently deleted and re-inserted with a brand new UUID and factory default description/file. All documents previously referencing this template have their `generated_from_template_id` set to `NULL`.
   - Consequence: In production, any customizations (updated templates, modified descriptions, or historical audit linkage) are wiped on application deployment.

2. **Faulty Global Guard:**
   - Observation: `if (templateRepository.count() >= 3) return;` at line 42 checks only the aggregate row count.
   - Inference: If an admin creates 3 custom templates with distinct names, `count()` becomes 3. The 3 standard official templates will never be seeded because the guard exits early.
   - Consequence: Checking aggregate table count rather than checking each specific standard template by name leads to false negatives and unseeded default templates.

3. **Lifecycle Inconsistency:**
   - Observation: `OfficialDocumentTemplateSeeder` implements `ApplicationRunner` instead of `@EventListener(ApplicationReadyEvent.class)`.
   - Inference: This diverges from the project-wide seeding standard established in `PipelineSeederService` and `ServiceDatabaseSeeder`, and violates AGENTS.md Critical Rule 4.
   - Consequence: Potential lifecycle timing divergence compared to other seeders.

4. **Resource Optimization (512MB RAM Constraint):**
   - Observation: `generateFormR1Docx()`, `generateServicesReportDocx()`, and `generateApprovalSheetDocx()` construct Apache POI document graphs in memory before checking if seeding is even required.
   - Inference: By checking `templateRepository.existsByNameIgnoreCase(name)` before generating POI byte arrays, memory allocation and CPU cycles on startup are eliminated when templates are already present.

---

## 3. Caveats

- **No Schema Changes Required:** `V35__Create_Document_Templates.sql` already provides the necessary columns and types. No Flyway migration is required for C6.
- **Admin User Availability:** If the application starts on a fresh database without any registered users, `userRepository.findAll()` returns empty and `admin` is `null`. `DocumentTemplate` entity and DB schema allow `created_by` to be `null`, so this is handled gracefully without failure.
- **Custom Admin Renames:** If an admin renames an official template to a custom name (e.g., "Акт выполненных работ (версия 2026)"), the seeder will notice that "Акт выполненных работ (Форма Р-1)" is missing and re-seed the default one. The admin's renamed template will NOT be touched or deleted. This is expected and safe behavior.
- **No Source Code Modified:** In accordance with the Explorer role, no production or test source code was modified during this investigation.

---

## 4. Conclusion

1. **Remediation Action Items:**
   - **`DocumentTemplateRepository.java`**: Add `boolean existsByNameIgnoreCase(String name)`.
   - **`OfficialDocumentTemplateSeeder.java`**:
     - Remove `implements ApplicationRunner` and replace `run(ApplicationArguments)` with `@EventListener(ApplicationReadyEvent.class)`.
     - Remove `DocumentRepository` field and constructor parameter (no longer needed).
     - Remove the `if (templateRepository.count() >= 3)` global check.
     - In `createTemplateIfAbsent(name, description, admin, supplier)`:
       - Check `if (templateRepository.existsByNameIgnoreCase(name)) { log.debug(...); return; }`
       - If absent: evaluate supplier to get byte array, store via `storageService.store(...)`, save new `DocumentTemplate`.
       - Eliminate `documentRepository.nullifyTemplateReference` and `templateRepository.delete`.
2. **Impact Assessment:**
   - Fix eliminates template deletion, preserves admin edits, prevents historical document FK disconnection, saves startup memory on 512MB VM, and aligns with project seeder conventions.

---

## 5. Verification Method

### 5.1 Unit Verification (Mockito)
Create unit test `OfficialDocumentTemplateSeederTest.java` in `src/test/java/com/example/zhanfinancebackend/modules/documents/config/`:
- **Test 1:** When DB is empty (`existsByNameIgnoreCase` returns false) -> seeder saves 3 templates and stores 3 files. `delete()` is never called.
- **Test 2:** When DB already has all templates (`existsByNameIgnoreCase` returns true) -> seeder calls 0 stores, 0 saves, 0 deletes.
- **Test 3:** When 1 template exists -> seeder stores and saves exactly the 2 missing templates without modifying the existing one.
- **Test 4:** When no admin user exists -> seeder seeds templates with `createdBy = null` without error.

Command to run unit tests:
```bash
./gradlew test --tests "com.example.zhanfinancebackend.modules.documents.config.OfficialDocumentTemplateSeederTest"
```

### 5.2 Integration / Regression Verification (Spring Boot Test)
Create integration test `OfficialDocumentTemplateSeederIntegrationTest.java`:
- Test flow:
  1. Context initializes and initial seed runs.
  2. Test retrieves Form R-1 template, updates description to `"Custom Admin Text"`, updates `filePath` to `"custom/path/r1.docx"`, saves to database.
  3. Test creates a `Document` entity linked to this template (`document.setGeneratedFromTemplate(template)`).
  4. Test invokes seeder method (`seedTemplates()`) simulating application reboot.
  5. Assertions:
     - Total template count remains 3.
     - Form R-1 `description` is still `"Custom Admin Text"`.
     - Form R-1 `filePath` is still `"custom/path/r1.docx"`.
     - Form R-1 `id` is unchanged.
     - Document's `generatedFromTemplate` reference is NOT null and equals the template ID.

Command to run full backend tests:
```bash
./gradlew test
```

### 5.3 Invalidation Conditions
The fix is invalid if:
- `templateRepository.delete(...)` or `documentRepository.nullifyTemplateReference(...)` is called anywhere in the seeding path.
- Existing templates in the database are overwritten, deleted, or assigned new UUIDs upon application restart.
- An exception is thrown when starting with an empty database or without an admin user.
