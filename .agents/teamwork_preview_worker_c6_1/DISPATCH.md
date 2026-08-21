## 2026-08-21T07:35:22Z

You are Worker 1 implementing the remediation for issue C6 (OfficialDocumentTemplateSeeder) in Phase 2 of JF-1C.

MANDATORY: Read ORIGINAL_REQUEST.md at `c:\Users\murat\IdeaProjects\JF-1C\.agents\ORIGINAL_REQUEST.md` before starting work.
Also read:
- Remediation Plan: `C:\Users\murat\Downloads\jf1c-phase2-remediation-plan.md`
- Audit Report: `c:\Users\murat\IdeaProjects\JF-1C\.agents\audit_report.md`
- Explorer handoff reports:
  - `c:\Users\murat\IdeaProjects\JF-1C\.agents\teamwork_preview_explorer_c6_1\handoff.md`
  - `c:\Users\murat\IdeaProjects\JF-1C\.agents\teamwork_preview_explorer_c6_2\handoff.md`
  - `c:\Users\murat\IdeaProjects\JF-1C\.agents\teamwork_preview_explorer_c6_3\handoff.md`

Your working directory: `c:\Users\murat\IdeaProjects\JF-1C\.agents\teamwork_preview_worker_c6_1`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File ownership and scope:
- Exclusively owned files for modification:
  - `src/main/java/com/example/zhanfinancebackend/modules/documents/repository/DocumentTemplateRepository.java`
  - `src/main/java/com/example/zhanfinancebackend/modules/documents/config/OfficialDocumentTemplateSeeder.java`
  - `src/test/java/com/example/zhanfinancebackend/modules/documents/config/OfficialDocumentTemplateSeederTest.java` (create new test)
- DO NOT touch `fly.toml`, GitHub Actions workflows, `build.gradle`, `Dockerfile`.
- DO NOT touch Flyway migrations V1-V110.

Instructions:
1. Update `DocumentTemplateRepository.java` to declare `boolean existsByNameIgnoreCase(String name)`.
2. Refactor `OfficialDocumentTemplateSeeder.java`:
   - Use `@EventListener(ApplicationReadyEvent.class)` for consistency with AGENTS.md rules.
   - Remove destructive delete-then-insert pattern (remove `templateRepository.delete` and `documentRepository.nullifyTemplateReference`).
   - Remove `DocumentRepository` dependency from seeder if no longer needed.
   - Remove global `count() >= 3` check so that individual missing templates are seeded properly.
   - In `createTemplateIfAbsent`, check `if (templateRepository.existsByNameIgnoreCase(name)) return;`. If absent, generate POI docx lazily (via Supplier or private method call only when needed), store file, and save `DocumentTemplate`.
3. Create comprehensive regression tests in `src/test/java/com/example/zhanfinancebackend/modules/documents/config/OfficialDocumentTemplateSeederTest.java` verifying:
   - Fresh database: seeds all 3 official templates.
   - Already seeded database: skips all templates, zero deletes, zero saves.
   - Customized template in database: re-running seeder does NOT delete, update, or overwrite the customized template or its storage key/description.
   - Partial database (e.g. 1 existing template): seeds only the 2 missing templates without touching the existing one.
4. Run the tests using `./gradlew test --tests "com.example.zhanfinancebackend.modules.documents.config.OfficialDocumentTemplateSeederTest"` and `./gradlew test` to ensure all tests pass.
5. Provide the exact diff in your handoff report.
6. Write your report to `handoff.md` and `changes.md` in your working directory. Send a message to parent when done. Strict rule: NO EMOJIS anywhere.
