# Handoff Report: Issue C6 Remediation (OfficialDocumentTemplateSeeder)

## 1. Observation

1. **Previous Implementation in `OfficialDocumentTemplateSeeder.java`**:
   - Class implemented `ApplicationRunner` instead of `@EventListener(ApplicationReadyEvent.class)`.
   - Used a coarse check `if (templateRepository.count() >= 3) return;`.
   - Contained destructive delete-then-insert logic in `createTemplateIfAbsent`:
     ```java
     templateRepository.findAll().stream()
             .filter(t -> name.equalsIgnoreCase(t.getName()))
             .findFirst()
             .ifPresent(t -> {
                 documentRepository.nullifyTemplateReference(t.getId());
                 templateRepository.delete(t);
             });
     ```
   - Eagerly generated all 3 POI DOCX byte arrays in memory on application startup.
   - Held an unneeded dependency on `DocumentRepository`.

2. **Modified Files**:
   - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/repository/DocumentTemplateRepository.java`
   - `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/config/OfficialDocumentTemplateSeeder.java`
   - `zhan-finance-backend/src/test/java/com/example/zhanfinancebackend/modules/documents/config/OfficialDocumentTemplateSeederTest.java`

3. **Test Results**:
   - Unit tests: `./gradlew test --tests "com.example.zhanfinancebackend.modules.documents.config.OfficialDocumentTemplateSeederTest"` passed (5 tests, 0 failures, 0 errors).
   - Full test suite: `./gradlew test` passed (BUILD SUCCESSFUL, exit code 0).

---

## 2. Logic Chain

1. **Step 1 (Eliminating Destructive Deletion)**:
   - Observation: Previous logic wiped existing templates and nullified foreign keys from historical documents whenever `createTemplateIfAbsent` matched an official template name.
   - Remediation: Removed `documentRepository.nullifyTemplateReference(t.getId())` and `templateRepository.delete(t)`. Removed `DocumentRepository` dependency.

2. **Step 2 (Fine-grained Idempotency via `existsByNameIgnoreCase`)**:
   - Observation: Previous `count() >= 3` check failed when custom templates existed or when individual official templates were missing.
   - Remediation: Added `boolean existsByNameIgnoreCase(String name)` to `DocumentTemplateRepository`. In `OfficialDocumentTemplateSeeder`, each official template is checked individually. If `existsByNameIgnoreCase(name)` is true, execution immediately returns without any file storage or database operations.

3. **Step 3 (Lazy Generation for Low Memory Footprint)**:
   - Observation: Eager POI generation wasted CPU cycles and heap on startup on 512MB RAM VM even when templates already existed.
   - Remediation: DOCX binary generation is now invoked lazily via `DocxGenerator` only when `existsByNameIgnoreCase` returns false.

4. **Step 4 (Standardized Seeder Lifecycle)**:
   - Observation: AGENTS.md rule 4 requires seeding on `ApplicationReadyEvent.class`.
   - Remediation: Switched `run(ApplicationArguments)` to `@EventListener(ApplicationReadyEvent.class) void seedOfficialTemplates()`.

---

## 3. Caveats

1. **Renamed Templates**: If an administrator renames an official template to a completely different custom name, the seeder will treat the official template name as absent and seed the default template without touching or deleting the renamed custom template.
2. **Schema & Flyway**: No database migrations or schema alterations were required since the `document_templates` table definition already supports all fields.
3. **No Emojis**: In accordance with project instructions, no emojis are used in code, comments, or documentation.

---

## 4. Conclusion

The C6 defect in `OfficialDocumentTemplateSeeder` is completely remediated:
- Zero deletions or overwrites occur upon application reboot.
- Admin customizations and historical document foreign keys are preserved.
- Missing templates are seeded selectively and idempotently.
- Full test suite passes with 0 regressions.

---

## 5. Verification Method

To independently verify this fix:

1. **Run Unit Tests for Seeder**:
   ```bash
   cd zhan-finance-backend
   ./gradlew test --tests "com.example.zhanfinancebackend.modules.documents.config.OfficialDocumentTemplateSeederTest"
   ```
   Expected: 5 tests execute and pass with exit code 0.

2. **Run Full Backend Test Suite**:
   ```bash
   cd zhan-finance-backend
   ./gradlew test
   ```
   Expected: All test tasks pass with exit code 0.

3. **Code Diff**:
```diff
diff --git a/zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/config/OfficialDocumentTemplateSeeder.java b/zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/config/OfficialDocumentTemplateSeeder.java
index 0510fd5..e7ab7bc 100644
--- a/zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/config/OfficialDocumentTemplateSeeder.java
+++ b/zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/config/OfficialDocumentTemplateSeeder.java
@@ -8,42 +8,35 @@ import com.example.zhanfinancebackend.modules.documents.service.StorageService;
 import org.apache.poi.xwpf.usermodel.*;
 import org.slf4j.Logger;
 import org.slf4j.LoggerFactory;
-import org.springframework.boot.ApplicationArguments;
-import org.springframework.boot.ApplicationRunner;
+import org.springframework.boot.context.event.ApplicationReadyEvent;
+import org.springframework.context.event.EventListener;
 import org.springframework.stereotype.Component;
+import org.springframework.transaction.support.TransactionTemplate;
 
 import java.io.ByteArrayOutputStream;
 
 @Component
-public class OfficialDocumentTemplateSeeder implements ApplicationRunner {
+public class OfficialDocumentTemplateSeeder {
 
     private static final Logger log = LoggerFactory.getLogger(OfficialDocumentTemplateSeeder.class);
 
     private final DocumentTemplateRepository templateRepository;
     private final StorageService storageService;
     private final UserRepository userRepository;
-    private final com.example.zhanfinancebackend.modules.documents.repository.DocumentRepository documentRepository;
-    private final org.springframework.transaction.support.TransactionTemplate transactionTemplate;
+    private final TransactionTemplate transactionTemplate;
 
     public OfficialDocumentTemplateSeeder(DocumentTemplateRepository templateRepository,
                                          StorageService storageService,
                                          UserRepository userRepository,
-                                         com.example.zhanfinancebackend.modules.documents.repository.DocumentRepository documentRepository,
-                                         org.springframework.transaction.support.TransactionTemplate transactionTemplate) {
+                                         TransactionTemplate transactionTemplate) {
         this.templateRepository = templateRepository;
         this.storageService = storageService;
         this.userRepository = userRepository;
-        this.documentRepository = documentRepository;
         this.transactionTemplate = transactionTemplate;
     }
 
-    @Override
-    public void run(ApplicationArguments args) throws Exception {
-        if (templateRepository.count() >= 3) {
-            log.info("Official document templates already exist, skipping DOCX generation.");
-            return;
-        }
-
+    @EventListener(ApplicationReadyEvent.class)
+    public void seedOfficialTemplates() {
         User admin = userRepository.findAll().stream().findFirst().orElse(null);
 
         // 1. Act of Completed Works (Form R-1 RK)
@@ -51,7 +44,7 @@ public class OfficialDocumentTemplateSeeder implements ApplicationRunner {
                 "Акт выполненных работ (Форма Р-1)",
                 "Официальная форма Р-1 утверждена МФ РК для акта приём-передачи оказанных услуг",
                 admin,
-                generateFormR1Docx()
+                this::generateFormR1Docx
         );
 
         // 2. Report of Rendered Services
@@ -59,7 +52,7 @@ public class OfficialDocumentTemplateSeeder implements ApplicationRunner {
                 "Отчет об оказанных услугах (АВР)",
                 "Подробный отчет о выполненных бухгалтерских и юридических работах по задаче",
                 admin,
-                generateServicesReportDocx()
+                this::generateServicesReportDocx
         );
 
         // 3. Client Approval and Signature Sheet
@@ -67,21 +60,24 @@ public class OfficialDocumentTemplateSeeder implements ApplicationRunner {
                 "Лист согласования и подписи",
                 "Официальный протокол подтверждения приема оказанных услуг клиентом",
                 admin,
-                generateApprovalSheetDocx()
+                this::generateApprovalSheetDocx
         );
     }
 
-    private void createTemplateIfAbsent(String name, String description, User admin, byte[] docxBytes) {
+    @FunctionalInterface
+    private interface DocxGenerator {
+        byte[] generate() throws Exception;
+    }
+
+    private void createTemplateIfAbsent(String name, String description, User admin, DocxGenerator generator) {
+        if (templateRepository.existsByNameIgnoreCase(name)) {
+            log.debug("Official document template already exists, skipping: {}", name);
+            return;
+        }
+
         transactionTemplate.execute(status -> {
-            templateRepository.findAll().stream()
-                    .filter(t -> name.equalsIgnoreCase(t.getName()))
-                    .findFirst()
-                    .ifPresent(t -> {
-                        documentRepository.nullifyTemplateReference(t.getId());
-                        templateRepository.delete(t);
-                    });
-                    
             try {
+                byte[] docxBytes = generator.generate();
                 String storageKey = storageService.store(
                         docxBytes,
                         name.replaceAll("[^a-zA-Z0-9_-]", "_") + ".docx",
diff --git a/zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/repository/DocumentTemplateRepository.java b/zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/repository/DocumentTemplateRepository.java
index 42ae731..c49b305 100644
--- a/zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/repository/DocumentTemplateRepository.java
+++ b/zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/repository/DocumentTemplateRepository.java
@@ -13,4 +13,5 @@ public interface DocumentTemplateRepository extends JpaRepository<DocumentTempla
     @Query(value = "SELECT nextval('doc_number_seq')", nativeQuery = true)
     Long getNextDocNumber();
 
+    boolean existsByNameIgnoreCase(String name);
 }
```
