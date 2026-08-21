# Handoff Report: C6 Investigation (OfficialDocumentTemplateSeeder)

## 1. Observation

1. **Seeder Location & Implementation**:
   - File: `src/main/java/com/example/zhanfinancebackend/modules/documents/config/OfficialDocumentTemplateSeeder.java`
   - Lines 42-45:
     ```java
     if (templateRepository.count() >= 3) {
         log.info("Official document templates already exist, skipping DOCX generation.");
         return;
     }
     ```
   - Lines 74-99 (`createTemplateIfAbsent`):
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

2. **Template Repository**:
   - File: `src/main/java/com/example/zhanfinancebackend/modules/documents/repository/DocumentTemplateRepository.java`
   - Lines 10-16:
     ```java
     @Repository
     public interface DocumentTemplateRepository extends JpaRepository<DocumentTemplate, UUID> {
         @Query(value = "SELECT nextval('doc_number_seq')", nativeQuery = true)
         Long getNextDocNumber();
     }
     ```
   - Currently lacks `existsByNameIgnoreCase(String name)` and `findByNameIgnoreCase(String name)`.

3. **Document Nullification Hook**:
   - File: `src/main/java/com/example/zhanfinancebackend/modules/documents/repository/DocumentRepository.java`
   - Lines 24-26:
     ```java
     @org.springframework.data.jpa.repository.Modifying
     @org.springframework.data.jpa.repository.Query("UPDATE Document d SET d.generatedFromTemplate = null WHERE d.generatedFromTemplate.id = :templateId")
     void nullifyTemplateReference(@org.springframework.data.repository.query.Param("templateId") java.util.UUID templateId);
     ```

4. **Document Generation Association**:
   - File: `src/main/java/com/example/zhanfinancebackend/modules/documents/service/DocumentDataLoader.java`
   - Lines 51-52:
     ```java
     DocumentTemplate template = templateRepository.findById(templateId)
             .orElseThrow(() -> new ResourceNotFoundException("Template not found"));
     ```
   - When a template is deleted and recreated, its UUID (`id`) changes, causing any persistent links or bookmarks referencing the old UUID to fail.

5. **Existing Test Coverage**:
   - `src/test/java/com/example/zhanfinancebackend/modules/documents/` has unit tests for `DocumentService`, `DocumentTemplateService`, and `DocumentGeneratorService`, but contains zero tests for `OfficialDocumentTemplateSeeder`.

---

## 2. Logic Chain

1. **Step 1 (Trigger vulnerability)**:
   Observation 1 shows `if (templateRepository.count() >= 3) return;`.
   If a system has fewer than 3 templates (e.g. an admin deleted an unused default template, or created only 2 custom templates), `templateRepository.count() >= 3` is false. Consequently, on application startup/deploy, `OfficialDocumentTemplateSeeder.run()` executes the seeding logic.

2. **Step 2 (Destructive execution)**:
   Observation 1 lines 76-82 shows that `createTemplateIfAbsent` explicitly finds any existing template matching `name.equalsIgnoreCase(t.getName())`, executes `documentRepository.nullifyTemplateReference(t.getId())`, and executes `templateRepository.delete(t)`.

3. **Step 3 (Customization loss & data corruption)**:
   Because the existing template entity is deleted and replaced with a newly instantiated `DocumentTemplate` (with hardcoded description and freshly generated DOCX binary), all admin/user customizations to description and file content are wiped. Moreover, Observation 3 confirms all existing historical documents pointing to `t.getId()` have `generated_from_template_id` set to `NULL`, severing the historical audit link.

4. **Step 4 (Remediation mechanism)**:
   By introducing `boolean existsByNameIgnoreCase(String name)` to `DocumentTemplateRepository` (Observation 2) and refactoring `OfficialDocumentTemplateSeeder.createTemplateIfAbsent` to check existence and immediately return if `exists` is true, the delete-then-insert pattern is eliminated. Templates already present will never be deleted, modified, or re-saved, and `nullifyTemplateReference` will never be invoked by the seeder.

5. **Step 5 (Efficiency optimization)**:
   Passing a lazy supplier for the DOCX byte generation avoids running Apache POI document builds for templates that already exist in the database.

---

## 3. Caveats

1. **Admin Customization of Template Names**:
   If an administrator renames a default template (e.g., renames "Акт выполненных работ (Форма Р-1)" to "Акт оказанных услуг 2026"), the seeder will consider the official template name absent and seed the default "Акт выполненных работ (Форма Р-1)" alongside the renamed custom template. This is standard behavior for system seeders and does not delete or overwrite the renamed custom template.
2. **Flyway Migrations**:
   No Flyway migration is required because the `document_templates` table schema remains unchanged.
3. **No Caveats on Execution Scope**:
   Investigation is purely read-only on source code as required.

---

## 4. Conclusion

The C6 defect is a critical data-loss flaw caused by the explicit delete-then-insert implementation in `OfficialDocumentTemplateSeeder.createTemplateIfAbsent()`.

**Actionable Solution**:
1. Add `boolean existsByNameIgnoreCase(String name)` to `DocumentTemplateRepository`.
2. Refactor `OfficialDocumentTemplateSeeder`:
   - Remove the `count() >= 3` top-level check.
   - In `createTemplateIfAbsent()`, check `templateRepository.existsByNameIgnoreCase(name)`: if present, skip; if absent, lazily generate DOCX bytes and save new template.
   - Remove `templateRepository.delete(t)` and `documentRepository.nullifyTemplateReference(t.getId())` from the seeder.
   - Remove unused `DocumentRepository` dependency from `OfficialDocumentTemplateSeeder`.
3. Add regression tests in `src/test/java/com/example/zhanfinancebackend/modules/documents/config/OfficialDocumentTemplateSeederTest.java` verifying:
   - Full seeding on fresh DB.
   - Zero modifications / zero deletions on already seeded DB.
   - Preservation of customized templates across restarts.
   - Isolated seeding of missing templates when partially seeded.

---

## 5. Verification Method

To independently verify the diagnosis and fix:

1. **Inspect Code**:
   - View `src/main/java/com/example/zhanfinancebackend/modules/documents/config/OfficialDocumentTemplateSeeder.java` lines 74-99 to observe `nullifyTemplateReference` and `templateRepository.delete`.
2. **Execute Unit/Regression Test**:
   - Once implemented, run:
     ```powershell
     ./gradlew test --tests "com.example.zhanfinancebackend.modules.documents.config.OfficialDocumentTemplateSeederTest"
     ```
   - All 4 test cases (clean seed, idempotent skip, customization preservation, partial seeding) must pass with exit code 0.
3. **Full Build Check**:
   - Run:
     ```powershell
     ./gradlew test
     ```
   - Must exit with code 0 and zero test failures.
4. **Invalidation Conditions**:
   - If `templateRepository.delete(...)` is called under any circumstances during seeder execution, the fix is invalid.
   - If an existing customized template entity has its description, filePath, or ID modified upon re-running the seeder, the fix is invalid.
