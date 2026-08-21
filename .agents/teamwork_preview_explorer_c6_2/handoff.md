# Handoff Report: C6 — OfficialDocumentTemplateSeeder Remediation

## 1. Observation

1. **Target File**: `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/config/OfficialDocumentTemplateSeeder.java`
   - Lines 42-45:
     ```java
     if (templateRepository.count() >= 3) {
         log.info("Official document templates already exist, skipping DOCX generation.");
         return;
     }
     ```
   - Lines 74-98:
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

2. **Entity & Repository**:
   - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/entity/DocumentTemplate.java`:
     - `@Table(name = "document_templates")`
     - `@Id @GeneratedValue(strategy = GenerationType.AUTO) private UUID id;`
     - `@Column(nullable = false, length = 200) private String name;`
     - `@Column(name = "file_path", nullable = false, length = 500) private String filePath;`
   - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/repository/DocumentTemplateRepository.java`:
     - Contains only `Long getNextDocNumber()`. No finder or existence methods by name exist.

3. **Database Migration**:
   - `zhan-finance-backend/src/main/resources/db/migration/V35__Create_Document_Templates.sql`:
     - Table `document_templates` has primary key `id UUID`, foreign key `created_by UUID REFERENCES users(id)`.
     - `documents` has column `generated_from_template_id UUID REFERENCES document_templates(id)`.
     - No database UNIQUE constraint exists on `name` or `file_path`.
     - Templates are logically identified by Russian canonical titles:
       1. `"Акт выполненных работ (Форма Р-1)"`
       2. `"Отчет об оказанных услугах (АВР)"`
       3. `"Лист согласования и подписи"`

4. **Existing Tests**:
   - `grep_search` in `src/test` for `OfficialDocumentTemplateSeeder` returned 0 matches.
   - Zero unit or integration tests exist for `OfficialDocumentTemplateSeeder`.

---

## 2. Logic Chain

1. **Step 1: Destructive Deletion Mechanism**
   - Direct observation of lines 76-82 shows that whenever `createTemplateIfAbsent` executes and finds a template matching the official name, it unconditionally calls `documentRepository.nullifyTemplateReference(t.getId())` followed by `templateRepository.delete(t)`.
   - Inference: This wipes the existing `DocumentTemplate` record, generates a new random UUID for the template, wipes any user-uploaded DOCX or customized metadata, and nullifies the foreign key on all existing `documents` rows linked to this template.

2. **Step 2: Flawed Count Gate Mechanism**
   - Direct observation of line 42 shows `if (templateRepository.count() >= 3) return;`.
   - Inference:
     - If an admin uploaded 3 custom templates, total count is 3. The check exits early without seeding the 3 official templates.
     - If total count is < 3 (e.g. 1 or 2 templates exist), the check passes, and all 3 official templates are processed, deleting any existing official template.

3. **Step 3: Root Cause Formulation**
   - The seeder erroneously combines a coarse global count check with a delete-before-insert operation rather than a fine-grained, per-template idempotency check (`existsByNameIgnoreCase`).

4. **Step 4: Remediation Logic**
   - Add `boolean existsByNameIgnoreCase(String name)` to `DocumentTemplateRepository`.
   - Remove the `count() >= 3` check from `OfficialDocumentTemplateSeeder`.
   - Transition lifecycle trigger to `@EventListener(ApplicationReadyEvent.class)`.
   - For each official template: if `existsByNameIgnoreCase(name)` is true, log and skip; if false, generate DOCX and insert.
   - Remove `documentRepository.nullifyTemplateReference()` and `templateRepository.delete()` calls entirely.

---

## 3. Caveats

1. **Admin Customization Scope**:
   - If an admin intentionally renames an official template to a completely different name (e.g. "My Custom Act"), the seeder on next start will detect that the official name is missing and recreate the standard official template. This is intended behavior for missing system seeds.
2. **Flyway Migrations**:
   - As per project rules, existing Flyway migrations (V1-V110) are immutable. No DB constraint changes are required for this fix because application-level existence checking (`existsByNameIgnoreCase`) guarantees idempotency.

---

## 4. Conclusion

- **Finding C6 is verified and confirmed**: The delete-then-insert pattern in `OfficialDocumentTemplateSeeder` poses a direct data-loss threat on every application boot/deploy.
- **Proposed Solution**:
  1. Update `DocumentTemplateRepository.java` to add `boolean existsByNameIgnoreCase(String name)`.
  2. Refactor `OfficialDocumentTemplateSeeder.java` to:
     - Remove `count() >= 3` guard.
     - Remove `delete` and `nullifyTemplateReference` calls.
     - Use `@EventListener(ApplicationReadyEvent.class)`.
     - Perform non-destructive `if (templateRepository.existsByNameIgnoreCase(name)) return;` per template.
  3. Create `OfficialDocumentTemplateSeederTest.java` in `src/test/java/com/example/zhanfinancebackend/modules/documents/config/` with 5 targeted test cases verifying clean seeding, idempotency, partial seeding, customization preservation, and immunity to existing custom templates.

---

## 5. Verification Method

1. **Test Execution**:
   - Run Gradle tests for the documents module:
     ```powershell
     ./gradlew test --tests com.example.zhanfinancebackend.modules.documents.*
     ```
2. **Regression Scenarios to Execute in `OfficialDocumentTemplateSeederTest`**:
   - `testCleanSeed`: Verify 3 official templates inserted on empty DB.
   - `testIdempotency`: Run seeder twice on the same DB; verify 0 deletions, 0 storage writes on second run, and all UUIDs remain stable.
   - `testPreserveCustomization`: Manually alter description of template 1; run seeder; assert description remains modified.
   - `testCustomTemplatesPresent`: Insert 3 custom non-official templates; run seeder; assert all 3 official templates are also created (total count = 6).
