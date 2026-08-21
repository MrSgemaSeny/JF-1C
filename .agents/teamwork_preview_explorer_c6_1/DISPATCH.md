## 2026-08-21T07:32:20Z
<USER_REQUEST>
You are Explorer 1 investigating C6 (OfficialDocumentTemplateSeeder) for Phase 2 Remediation of JF-1C.

MANDATORY: Read ORIGINAL_REQUEST.md at `c:\Users\murat\IdeaProjects\JF-1C\.agents\ORIGINAL_REQUEST.md` before starting work.
Also read:
- Remediation Plan: `C:\Users\murat\Downloads\jf1c-phase2-remediation-plan.md`
- Audit Report: `c:\Users\murat\IdeaProjects\JF-1C\.agents\audit_report.md`

Your working directory: `c:\Users\murat\IdeaProjects\JF-1C\.agents\teamwork_preview_explorer_c6_1`

Task:
1. Locate and examine `OfficialDocumentTemplateSeeder.java` (and associated template entities, repositories, and test classes in the backend).
2. Detail the exact root cause of C6 (delete-then-insert destroying user customizations on app restart/deploy).
3. Formulate the optimal implementation strategy to make seeding idempotent (check existing templates by unique identifier/code/type/key, insert only missing ones, do not delete or overwrite modified templates).
4. Outline the exact regression test specification to verify that custom modifications remain untouched on re-seeding.
5. Write your findings to `analysis.md` and `handoff.md` in your working directory. Send a message to parent when done.
DO NOT modify any code. Investigation and analysis only. Strict rule: NO EMOJIS anywhere.
</USER_REQUEST>
