# C6 Investigation Analysis: OfficialDocumentTemplateSeeder

## 1. Overview & Problem Definition

- **Target Component:** `OfficialDocumentTemplateSeeder.java` (`src/main/java/com/example/zhanfinancebackend/modules/documents/config/OfficialDocumentTemplateSeeder.java`)
- **Finding ID:** C6 (CRITICAL)
- **Problem Statement:** `OfficialDocumentTemplateSeeder` implements a destructive delete-then-insert pattern on every application startup. When a template matching a default name is found, it nullifies all historical references in the `documents` table (`documentRepository.nullifyTemplateReference`), deletes the existing `DocumentTemplate` row, and re-inserts a freshly generated default template. If an admin customized templates, descriptions, or file contents in production, they are erased on every deployment/restart.

---

## 2. Code Inspection & Current Implementation Analysis

### 2.1 Trigger Mechanism
Currently:
```java
@Component
public class OfficialDocumentTemplateSeeder implements ApplicationRunner {
    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (templateRepository.count() >= 3) {
            log.info("Official document templates already exist, skipping DOCX generation.");
            return;
        }
        ...
    }
}
```
**Findings:**
1. **Violation of Architectural Standards:** AGENTS.md Critical Rule 4 states: *"DB seeding/startup operations strictly via @EventListener(ApplicationReadyEvent.class)"*. All other seeders (`PipelineSeederService`, `ServiceDatabaseSeeder`, `DatabaseMigrationRunner`) adhere to `@EventListener(ApplicationReadyEvent.class)`. `OfficialDocumentTemplateSeeder` is the only seeder implementing `ApplicationRunner`.
2. **Flawed Global Guard (`templateRepository.count() >= 3`):**
   - If an admin uploads 3 custom templates with arbitrary names before official templates are seeded (or in an environment with custom templates), `count() >= 3` evaluates to `true`, and official templates are **never** seeded.
   - If 1 official template was deleted or missing, but 2 custom templates exist (`count() == 3`), the missing official template will never be seeded.
   - If total templates count is `< 3`, the seeder proceeds to inspect all 3 default templates and executes the destructive delete-and-recreate logic on any existing ones.

### 2.2 Destructive Delete-Then-Insert Logic in `createTemplateIfAbsent`
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
**Findings:**
1. **Data Loss & Disconnection:**
   - Line 80: `documentRepository.nullifyTemplateReference(t.getId())` sets `generated_from_template_id = NULL` on all documents previously generated from this template.
   - Line 81: `templateRepository.delete(t)` deletes the existing database entity, discarding its UUID, creation date, admin creator, and any modifications.
   - Line 85: A new file is written to storage, orphaning any previously uploaded custom DOCX files.
   - Line 90-91: A new `DocumentTemplate` entity is persisted with a newly generated UUID.
2. **Unnecessary POI Document Generation (Memory/CPU Waste):**
   - `generateFormR1Docx()`, `generateServicesReportDocx()`, and `generateApprovalSheetDocx()` are eagerly executed in `run()` (lines 54, 62, 70) BEFORE checking whether the specific template exists in `createTemplateIfAbsent`. On a 512MB RAM VM, building 3 DOCX files with Apache POI on startup wastes valuable memory and heap headroom.
3. **Inefficient Full Table Scan:**
   - `templateRepository.findAll().stream().filter(...)` loads all template rows into JVM memory instead of executing a targeted repository query (e.g. `existsByNameIgnoreCase`).
4. **Unneeded Dependency:**
   - `DocumentRepository` was injected solely to nullify references prior to deletion. Once the delete logic is removed, `OfficialDocumentTemplateSeeder` no longer needs `DocumentRepository`.

---

## 3. Comprehensive Edge Case Analysis

| Edge Case | Scenario | Current Behavior (Buggy) | Proposed Behavior (Remediated) |
|---|---|---|---|
| **EC-1: Clean DB (Empty database)** | Application boots on empty DB | Seeds 3 templates, but eager POI generation occurs before checking. | Checks `existsByNameIgnoreCase` for each, generates DOCX lazily, stores and persists 3 templates. |
| **EC-2: Reboot / Redeploy (Idempotency)** | Application restarts with all 3 templates present | If `count >= 3`, skips at top; if `count < 3` (e.g. 2 templates), deletes and recreates existing templates, breaking FK links. | For each template, `existsByNameIgnoreCase` returns `true` -> skips immediately without POI generation, file I/O, or DB writes. |
| **EC-3: Admin Custom Edits (Core C6)** | Admin edited template description, uploaded customized DOCX, or generated 100+ documents linked to template | If `count < 3`, deletes template, wipes document links (`nullifyTemplateReference`), replaces file with default DOCX. | Template already exists -> seeder skips. Admin file, description, UUID, and document foreign key references remain 100% intact. |
| **EC-4: Partial Existing Templates** | 1 or 2 official templates exist (e.g. Form R-1 exists, but Approval Sheet missing) | If total templates `< 3`, deletes Form R-1 and recreates it along with missing ones. | Checks each template individually: skips Form R-1 (untouched), generates and inserts only the missing Approval Sheet. |
| **EC-5: Renamed Official Template** | Admin renamed "Лист согласования и подписи" to "Лист согласования (v2)" | If `count < 3`, recreates default "Лист согласования и подписи". | Checks for standard name: seeds missing standard template without touching or deleting "Лист согласования (v2)". |
| **EC-6: Custom Non-Default Templates** | Admin created 3 custom templates ("Custom NDA", "Contract", "Invoice") | `templateRepository.count() >= 3` evaluates `true` -> official templates are NEVER seeded. | Individual `existsByNameIgnoreCase` checks ensure all 3 official templates are seeded; the 3 custom templates remain untouched. Total templates = 6. |
| **EC-7: Case-Insensitive Matching** | Admin created "акт выполненных работ (форма р-1)" with different case | Name comparison in stream was case-insensitive, but delete wiped it. | `existsByNameIgnoreCase` returns `true` and skips without duplicate creation or deletion. |
| **EC-8: Empty Users Table (No Admin User)** | Application boots before any admin user is registered | `userRepository.findAll()` returns empty list -> `admin = null`. | `DocumentTemplate` allows `createdBy` to be `null` (`@JoinColumn` is nullable). Saved safely without `NullPointerException`. |
| **EC-9: Storage Failure / Error Handling** | Storage directory full / unwritable | Exception caught inside transaction, logged as error, transaction rolled back. | Try-catch per template logged as error without breaking entire application context startup. |

---

## 4. Proposed Fix Specification

### 4.1 Changes in `DocumentTemplateRepository.java`
Add derived query method:
```java
boolean existsByNameIgnoreCase(String name);
```

### 4.2 Changes in `OfficialDocumentTemplateSeeder.java`
1. Replace `implements ApplicationRunner` with `@EventListener(ApplicationReadyEvent.class)`.
2. Remove `DocumentRepository` injection.
3. Remove top-level `if (templateRepository.count() >= 3) return;` check.
4. Refactor `createTemplateIfAbsent` to check `templateRepository.existsByNameIgnoreCase(name)`:
   - If `true`: log debug/info and return immediately (do not delete, do not nullify references, do not store file).
   - If `false`: invoke lazy generator supplier, store file via `storageService.store(...)`, save new `DocumentTemplate`.
5. Wrap seeding execution in `@Transactional` or maintain per-template transaction for isolation.

---

## 5. Regression Test Strategy

### 5.1 Unit Tests (`OfficialDocumentTemplateSeederTest.java`)
Using JUnit 5 + Mockito (`@ExtendWith(MockitoExtension.class)`):

1. **`seedData_whenDatabaseEmpty_seedsAllThreeTemplates`**
   - Mock: `templateRepository.existsByNameIgnoreCase(anyString())` returns `false`.
   - Mock: `storageService.store(any(), anyString(), anyString())` returns unique storage keys.
   - Act: call seeder method (`seedTemplates()` / `seedData()`).
   - Assert: `templateRepository.save(any(DocumentTemplate.class))` invoked exactly 3 times. `storageService.store(...)` invoked 3 times. No deletes or nullifications called.

2. **`seedData_whenAllTemplatesExist_skipsAllAndNeverDeletesOrStores`**
   - Mock: `templateRepository.existsByNameIgnoreCase(anyString())` returns `true`.
   - Act: call seeder method.
   - Assert: `storageService.store(...)` NEVER invoked (0 times). `templateRepository.save(...)` NEVER invoked (0 times). `templateRepository.delete(...)` NEVER invoked (0 times).

3. **`seedData_whenOneTemplateExists_seedsOnlyMissingTwo`**
   - Mock: `existsByNameIgnoreCase("Акт выполненных работ (Форма Р-1)")` returns `true`, others return `false`.
   - Act: call seeder method.
   - Assert: `storageService.store(...)` invoked 2 times. `templateRepository.save(...)` invoked 2 times. Existing template untouched.

4. **`seedData_whenAdminUserAbsent_seedsWithNullCreatedBy`**
   - Mock: `userRepository.findAll()` returns empty list.
   - Mock: `existsByNameIgnoreCase(anyString())` returns `false`.
   - Act: call seeder method.
   - Assert: saves 3 templates where `template.getCreatedBy() == null`, no NPE.

5. **`seedData_whenStorageFails_logsErrorAndContinues`**
   - Mock: `storageService.store(...)` throws `RuntimeException` for the first template and succeeds for the other two.
   - Act: call seeder method.
   - Assert: does not throw exception out of seeder; remaining 2 templates are processed.

### 5.2 Spring Boot Integration Test (`OfficialDocumentTemplateSeederIntegrationTest.java`)
Using `@SpringBootTest` + `@ActiveProfiles("test")`:

1. **`testSeederPreservesCustomizedTemplatesAndDocumentLinksOnRestart`**
   - Step 1: Boot context (initial seed creates 3 templates).
   - Step 2: Retrieve "Акт выполненных работ (Форма Р-1)", modify its description to `"Кастомное описание админа"`, update its `storageKey` to `"custom/path/r1.docx"`, save to `templateRepository`.
   - Step 3: Create a `Document` entity linked to this template (`document.setGeneratedFromTemplate(customizedTemplate)`), save to `documentRepository`.
   - Step 4: Manually invoke seeder `seedTemplates()` (simulating application restart).
   - Step 5: Assert:
     - Total templates count in DB is 3.
     - The template's description is still `"Кастомное описание админа"`.
     - The template's `filePath` is still `"custom/path/r1.docx"`.
     - The template's `id` (UUID) has not changed.
     - The `Document` entity's `generatedFromTemplate` is still non-null and points to the same template ID.
