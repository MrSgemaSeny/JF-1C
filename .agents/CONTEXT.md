# Project State & Context -- ZhanFinance (JF-1C)

## Current Phase & Global Goals
- **Active Phase**: Production Release v1.0.0 (Tag v1.0.0 published on GitHub)
- **Main Goal**: Transition to Billing & Payments (WebKassa / Kaspi Pay) and custom domain (zhanfinance.kz)
- **Audit status**: 28 findings total (6 CRITICAL, 9 WARNING, 5 INFO) — 100% resolved and verified.
- **Global Rule**: ALL architectural decisions and context updates must be synchronized with `Brain's Protocol` at `C:\Users\murat\IdeaProjects\new_world\Brain's protocol - second brain`.

## Infrastructure State
- **Backend (Fly.io)**: Fly.io deploy paused (status 403 overdue invoice on fly.io/dashboard/orka-best/billing). CI/CD build & test pipeline passes 100%. PostgreSQL connected. Secrets in Fly Secrets.
- **Frontend (GitHub Pages)**: CI/CD configured and active (`ci.yml` deploy-pages). Live at https://mrsgemaseny.github.io/JF-1C/. Release v1.0.0 published.
- **Storage (Cloudflare R2)**: Cloudflare R2 Object Storage provisioned for Epic-15 (Bucket `jf1c-documents`, credentials and endpoint configured strictly via `.env` / Fly Secrets, private access, $0 egress).
- **Auth**: JWT Bearer tokens, refresh token rotation, 2FA (TOTP), secure Password Reset (#25) fully working.
- **Roles**: 6 roles -- ADMIN, EMPLOYEE, CLIENT, LEARNER, CURATOR, ADVISOR.

## Recently Completed
1. **Authentic 4-Language i18n Across Landing & About Pages (`ru`, `kk`, `en`, `zh`)**:
   - Implemented authentic translation coverage for all 3 public pages (`/` Home, `/services` Services, `/about` About).
   - Localized `publicNav`, `footer`, `hero`, `homeAbout`, `homeServices`, `homeAdvantages`, `outsource_included`, `trust`, `pricing`, `reviews`, `team`, `offices`, `faq`, `why`, `howWeWork`, `servicesCatalog`, and all `about.*` sections.
   - Enforced team naming rules: Cyrillic/Kazakh in Russian & Kazakh, Latin transcription in English & Chinese ("Zharilkaganov Amankeldi Nakmadinovich", "Murat Orynbasar", etc.) with localized roles/bios.
   - Verified 100% test pass (19 test files, 74 tests) and production build.
2. **Comprehensive Mobile Responsiveness & Adaptive UI**:
   - Tuned typography scaling, touch targets, and flexible layouts across all public landing and about pages (`Header`, `Hero`, `HomeAbout`, `OutsourceIncluded`, `HomeServices`, `ServicesCatalog`, `Team`, `Reviews`, `Offices`, `Footer`, `AboutHero`, `AboutStats`, `AboutIdeology`, `AboutProcess`, `AboutGuarantees`).
   - Fixed text wrapping and heading sizes (`text-3xl sm:text-5xl ... break-words`) to prevent horizontal overflow on small 320px–390px screens.
   - Updated mobile menu contact shortcuts with official WhatsApp number `+7 (775) 058-40-21`.
   - Verified 100% test pass (19 test files, 74 tests) and clean production build.
2. **Team Member Cards Redesign (Soft Green Frosted Glass, Inter Font, Orynbasar Avatar & Blurred Hover)**:
   - Replaced dark/harsh styling with floating soft green frosted-glass bottom panel (`bg-brand-green/80 backdrop-blur-md border border-white/15`) and clean `Inter` font-sans typography.
   - Connected photo `ryo_sticker_02_confident.jpg` (`orynbasar.jpg`) for IT specialist Orynbasar (Мурат Орынбасар) in `team.ts`.
   - Built smooth hover effect: photo dynamically blurs (`group-hover:blur-md group-hover:scale-105`) under soft green backdrop (`bg-brand-green/85 backdrop-blur-md`) displaying specialist bio.
   - Verified 100% test pass (19 test files, 74 tests).
2. **Removal of Eyebrow Mini-Badges Across Landing Pages**:
   - Completely removed redundant pill badges with dots and uppercase eyebrow tags from landing and about sections: `OutsourceIncluded.tsx` («Комплексный сервис»), `HomeAbout.tsx` («О компании»), `AboutHero.tsx`, `AboutIdeology.tsx` («Наша идеология»), `AboutProcess.tsx` («Инженерный подход»), `AboutGuarantees.tsx` («Ответственность»), and converted leader badge in `Team.tsx` to clean typography.
   - Verified 100% test pass (19 test files, 74 tests).
2. **Repository Cleanup, Scratch Archiving & Modern .gitignore**:
   - Cleaned root and subdirectories from 30+ legacy scratch files, debug logs (`test_output.txt`, `report.json`, `logs.txt`, `fly_logs.txt`), preview HTMLs, one-off migration scripts, and redundant root markdown audits.
   - Preserved and packed all legacy assets and audits into `archive/cleaned_legacy_and_scratch_backup_2026_09_14.zip`.
   - Moved future architecture roadmaps into structured directory `docs/future/`.
   - Configured clean, modular, and comprehensive `.gitignore` rules across root, backend, and frontend (ignoring OS junk, IDE configs, environment secrets, build artifacts, test caches, coverage, diagnostic logs, and temporary archives).
   - Verified 100% test pass on both frontend (74/74 Vitest) and backend (Gradle test suite).
2. **Vector BrandLogo Integration (Full Authentic Branding)**:
   - Built reusable vector SVG component `BrandLogo.tsx` (`src/shared/ui/BrandLogo.tsx`) with pixel-perfect geometry, `a_Simpler` bold font, exact color schemes (default, inverted, landing), and zero distortion.
   - Replaced plain-text typography branding across all public and authenticated pages: `Header.tsx`, `Footer.tsx`, `LoginPage.tsx`, `RegisterPage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`, `CompleteProfilePage.tsx`, `TermsPage.tsx`, `PrivacyPolicyPage.tsx`, `RefundPolicyPage.tsx`, `CookiePolicyPage.tsx`, `DashboardSidebar.tsx`, and `DashboardLayout.tsx`.
   - Verified 100% test pass (19 test files, 74 tests).
2. **Footer Navigation & Legal Info Alignment**:
   - Added `Войти` (`publicNav.login` / `ROUTES.LOGIN`) as the 4th item in the Footer navigation list under `НАВИГАЦИЯ`.
   - Moved the `ТОО «ЖАН FINANCE»` block down, aligning it horizontally on the same level as the round action/social buttons (`кружки`).
2. **Home Restructure & Green Outsource Included Section**:
   - Removed services catalog block (`HomeServices`) from `HomePage.tsx`. Services catalog is now located exclusively on `/services` (`ServicesPage.tsx` / `ServicesCatalog.tsx`).
   - Created standalone `OutsourceIncluded.tsx` section on `HomePage.tsx` with dark green background (`bg-brand-green` and `text-brand-beige`), displaying 6 core outsource accounting processes and a direct consultation CTA button.
   - Restored exact vector logo proportions in `zhan-finance-logo.svg` and `logo-preview.html` (`viewBox="0 0 805 180"`, `a_Simpler_Bold` font natural condensed geometry without artificial `spacingAndGlyphs` distortion).
2. **Pricing Background & Services Header Unification**:
   - Switched the pricing/tariffs section background from dark green to beige (`bg-brand-beige` with `text-brand-green` typography) on both `HomePage.tsx` and `ServicesPage.tsx`.
   - Unified column headers in `HomeServices.tsx` and `ServicesCatalog.tsx`: changed background to `bg-brand-beige/20 border border-brand-green/10 rounded-[32px]`, identical to the service cards beneath.
2. **Streamlining Landing Flow & Services Integration (Removed Redundant Outsource Block)**:
   - Completely removed the redundant 4-card block («Надежная бухгалтерия без штатных рисков» + 4 cards) from the landing page.
   - Seamlessly integrated «Что входит в аутсорс-бухгалтерию» (6 ключевых процессов + кнопка «Получить консультацию») directly into `HomeServices.tsx`.
   - Updated `HomePage.tsx` flow: `Hero` -> `HomeAbout` («О компании») -> `HomeServices` («Решения для вашего бизнеса» + «Что входит в аутсорс-бухгалтерию») -> `HomeAdvantages` («Наши преимущества») -> `Trust` -> `PricingTable` -> `Reviews` -> `Team` -> `Offices` -> `FaqContact` -> `Footer`.
2. **Legal Pages Standalone Layout (Header & Footer Removal)**:
   - Completely removed global `<Header />` and `<Footer />` components from all legal document pages: `/privacy-policy` (`PrivacyPolicyPage.tsx`), `/terms` (`TermsPage.tsx`), `/refund-policy` (`RefundPolicyPage.tsx`), and `/cookie-policy` (`CookiePolicyPage.tsx`).
   - Replaced with a standalone document top bar (`← На главную` button + typography logo `ЖАН FINANCE` in `font-logo`) and a clean text copyright footer (`ТОО «ЖАН FINANCE» • БИН 240140023819 • Все права защищены`).
2. **Landing & Services Parity (ServicesCatalog Parity, Pricing Heading, 2-Column Services, 4 Tariffs, Informational ServiceModal)**:
   - Synchronized `ServicesCatalog.tsx` with `HomeServices.tsx`: exact white background, unified `РЕШЕНИЯ ДЛЯ ВАШЕГО БИЗНЕСА` heading with subtitle, identical beige 2-column header badges and card layout.
   - Refactored `ServiceModal.tsx` to be purely informational: displays service title, image, full description («О сервисе») and what is included («Что входит в стоимость»), removed all order forms / textareas from the service modal on landing pages, and added «Получить консультацию» button that scrolls to footer contact form.
   - Set default `id="contact"` on `Footer.tsx` and updated CTA buttons in `WhyOutsource.tsx` («Получить консультацию») and `PricingTable.tsx` («Выбрать тариф») to smoothly scroll directly to the Footer contact form.
   - Updated contact form message prefix to `Описание:` (replacing `Задача:`) in `useContactForm.ts` and UI label to `Описание` across locales (`ru`, `kk`, `zh`, `en`).
2. **Landing Contact & FAQ Block Unification (FaqContact Widget)**:
   - Promoted `ServicesFaqContact` into a clean shared FSD widget `@/widgets/faq-contact` (`FaqContact.tsx`), preserving backwards compatibility via re-export.
   - Added `FaqContact` section to `HomePage.tsx` between `<Offices />` and `<Footer />`, resolving missing FAQ and missing task description field on the main page.
   - Enabled `showMessage={true}` on `<ContactForm />` in `Footer.tsx` so all contact forms consistently provide the "КРАТКОЕ ОПИСАНИЕ ЗАДАЧИ" textarea.
   - Assigned `id="contact"` to `FaqContact` so header CTA buttons and `#contact` anchor links smoothly scroll to the FAQ & Contact section.
2. **Branding Redesign (Pure Typography ЖАН FINANCE & Inter Font)**:
   - Redesigned header and footer logos to pure typography `ЖАН FINANCE` (font-logo `a_Simpler`), completely removing legacy raster `logo.png` from `Header.tsx` and `Footer.tsx`.
   - Connected Google Font `Inter` (weights 400-900) in `index.html` with preconnect, configured `--font-sans: "Inter", system-ui, sans-serif` in `src/index.css` `@theme`.
   - Updated document `<title>` to `ЖАН Finance` and synchronized brand display across `i18n` locales (`ru`, `kk`, `en`).
   - Cleaned up emojis in `LoginPage.tsx` (replaced with Lucide `Clock`), achieving strict 0-emoji compliance.
2. **Brand Font Integration (a_Simpler Bold)**:
   - Integrated corporate font `a_Simpler Bold.ttf` into frontend assets (`src/shared/assets/fonts/a_Simpler_Bold.ttf`).
   - Configured `@font-face` and mapped `--font-logo: "a_Simpler", sans-serif` in `src/index.css`.
   - Removed unused Google Font Russo One from `index.html`.
   - Applied `font-logo` to branding text next to avatar/logo across `Header.tsx`, `LoginPage.tsx`, `RegisterPage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`, `CompleteProfilePage.tsx`, and `DashboardSidebar.tsx`.
2. **Task Status Email Notifications Restoration**:
   - Fixed stage update notification logic in `TaskService.java` (`updateTaskStage` and `batchUpdateTasks`): email notifications via `emailNotificationService.sendTaskStatusUpdatedEmail` are now sent on ANY stage/status change (e.g. in progress, documents gathering, pre-payment, review, rework, etc.), not only on terminal stages.
   - Enhanced `EmailNotificationService.java` with defensive null-safety and overloaded `sendTaskStatusUpdatedEmail(User, Task, String, String)`. Added integration test coverage in `TaskServiceIntegrationTests.java`.
2. **Password Reset Flow (#25)**:
   - Implemented zero-enumeration password recovery: `V121__create_password_reset_tokens.sql`, `PasswordResetService.java` with SHA-256 token hashing, 15-minute expiration, and session revocation (`refreshTokenRepository.deleteAllByUser`).
   - Rate limiting via `AuthRateLimitFilter.java` (3 req/15 min per IP for `/forgot-password` and `/reset-password`).
   - Frontend pages `/forgot-password` (`ForgotPasswordPage.tsx`) and `/reset-password` (`ResetPasswordPage.tsx`), plus login page shortcut and Vitest/JUnit coverage.
2. **Legal & Compliance Day 2-3 (#3, #4, #7, #10, #12, #14, #15, #16, #19)**:
   - Added 4 dedicated legal pages (`/privacy-policy`, `/terms`, `/refund-policy`, `/cookie-policy`) with Kazakhstan Law No. 94-V compliance and Article 12 data localization.
   - Built `CookieConsent` banner widget with persistent choice in `localStorage` (`accepted` / `essential_only`).
   - Updated `Footer.tsx` with legal entity details (ТОО «ZhanFinance», БИН 240140023819, contact details) and active legal routes.
   - Added PDn processing consent disclaimers under submit buttons in `ContactForm.tsx` and `RegisterPage.tsx`.
   - Replaced unsupported claims on landing pages with measurable standards (IFRS / contract SLA).
3. **Security Hardening Day 1 (#37, #33, #35)**: 
   - Disabled source maps in `vite.config.ts` (`sourcemap: false`) to prevent original TypeScript code leak on GitHub Pages.
   - Fixed invoice IDOR / mutation vulnerability (#33): removed `Role.CLIENT` from `canWrite` and `canCreateFor` in `InvoiceAccessService.java`, restricted PUT/POST to ADMIN/EMPLOYEE and DELETE to ADMIN.
   - Fixed account enumeration risk (#35): added strict rate limiter (`checkEmailCache`, 5 req/min per IP) in `AuthRateLimitFilter.java` for `/api/v1/auth/check-email`.
4. **2FA (Epic-09)**: Fully implemented -- QR setup, TOTP verification, disable, scheduled cleanup. 6 unit tests.
2. **Documents Redesign (Epic-03)**: Employee + Client pages redesigned with metrics cards, folder pills, source filters, ZIP download.
3. **ADVISOR Role (Epic-19)**: Full role with Overview, Workload, access to all clients/tasks/documents, sidebar navigation.
4. **Task Pool Logic (Epic-02)**: Auto-reopen LOST tasks to first OPEN stage when assigned from pool.
5. **Landing Pages (Epic-18)**: Public pages working -- Home, Services, About, Solution Picker, Contact, Leads.
6. **API Versioning**: All paths migrated to /api/v1/** (Phase 4 complete).
7. **GitHub Actions**: Configured DB backups (flyctl) and deploy notifications via Telegram.
8. **Observability (Epic-10)**: Configured OTLP push metrics. (Sentry backend paused due to Spring Boot 4.1 incompat). UptimeRobot configured.
9. **Business Alerts (Epic-06)**: Async Telegram notifications for admins (leads/tasks) using RestClient.
10. **Security & Audit**: Fixed DocumentService file upload vulnerability (MIME spoofing). Audit logs secured with `@AuditedEntity` and PostgreSQL triggers (UPDATE/DELETE/TRUNCATE blocked).
11. **In-Memory Bearer Auth & Dynamic Base**: Fixed SPA cross-domain 401s by adding in-memory `accessToken` in `Authorization: Bearer` headers (no `localStorage`). Fixed 404 routing on custom domains by dynamically evaluating `base: process.env.VITE_BASE_URL || '/'` and removing `localhost` fallbacks.
12. **Auth Security & Fixes**: Fixed infinite `/login` redirect loop on frontend. Added 2FA brute-force protection (`TwoFactorPreAuth` attempts counter + V109 migration) and scheduled database purge for expired refresh tokens (`RefreshTokenService.purgeExpiredTokens`).
13. **Frontend Cache Control**: Added `Cache-Control` meta tags to `index.html` to prevent GitHub Pages from aggressively caching stale SPA chunks (which caused old redirect loops to persist).
14. **React Router State Preservation**: Fixed silent 2FA failure during Google/local login by removing `setIsLoading(true)` from `AuthContext` auth methods. This prevents the `RouterProvider` from being temporarily unmounted and wiping out `location.state` (which is used for `preAuthToken` tracking) and component local states.
15. **Chat Interface Avatar**: Fixed chat UI to display user's avatar dynamically instead of a static default icon in `ChatDrawer`. Updated DTOs (`UserDto`, `ClientInfoDto`) to support `avatarUrl` natively.
16. **Employee Registration Status Flow**: Fixed edge case where newly registered employees (who are PENDING) were redirected to the dashboard without tokens, causing crashes. Added dedicated "Ваша заявка в работе" full-page status screen on the Login page for pending/rejected accounts.
17. **Mobile OAuth Fix (Safari ITP Bypass)**: Fixed mobile OAuth login (iOS Safari/Chrome) by reverting `@JsonIgnore` from `accessToken` in `AuthResponse`. This bypasses Apple's Intelligent Tracking Prevention (ITP) which blocks cross-domain HttpOnly cookies, allowing the frontend to capture the token in JSON and use `Authorization: Bearer` memory fallback.
18. **Database & ORM Compatibility Fixes (Chat & LMS)**:
   - Fixed 500 on `/api/v1/chat/contacts`: Rewrote `ChatMessageRepository.findLastMessagesForUser` using CTE (`WITH user_chats AS ... SELECT DISTINCT ON (other_user_id)`) resolving PostgreSQL 17 planner rejection while maintaining full compatibility with PostgreSQL 14.
   - Fixed 500 on `/api/v1/admin/courses`: Resolved `LazyInitializationException` on `Chapter.lessons` by batch-initializing chapters and lessons within `@Transactional(readOnly = true)` in `CourseService` (2 batch queries, zero N+1, avoiding Hibernate `MultipleBagFetchException`).
19. **Live Production E2E & Load Testing (Playwright + Artillery)**:
   - Built automated E2E test suites: `tests/e2e/api-live.mjs` (34 endpoints & security boundaries) and `tests/e2e/frontend-live.mjs` (Playwright real browser tests against live GitHub Pages).
   - Configured full end-to-end CRUD Artillery suite (`artillery.yml`) covering Public, Admin Full CRUD, Employee Approval Flow, and Client Request Flow with SLA P95 < 3000ms.
   - Fixed `GlobalExceptionHandler.java`: added explicit `@ExceptionHandler(HttpRequestMethodNotSupportedException.class)` returning HTTP 405 Method Not Allowed instead of 500.
20. **Live Production IDOR Audit (`tests/e2e/idor-live.mjs`)**:
   - Executed 21 live security checks against production API.
   - Identified 4 security & operational bugs: ADVISOR write access to CRM tasks, ADVISOR delete access to documents, CLIENT write access to invoices, and missing `arial.ttf` font breaking invoice PDF rendering. Recorded in Second Brain journal and knowledge base.
21. **Live Browser Authenticated Journeys (`tests/e2e/authenticated-journeys-live.mjs`)**:
   - 17/17 tests passed in headless Chrome against live GitHub Pages & Fly.io.
   - Verified end-to-end user workflows for ADMIN (Dashboard, Tasks, Clients, Employees, Leads, Invoices, Audit Logs), EMPLOYEE (Tasks, Clients, Documents, Calendar), and CLIENT (Documents, Services, Calendar) with automated rate-limit recovery.
22. **Comprehensive Live E2E Functional Test Suites (`tests/run-all-e2e.mjs`)**:
   - Built 5 dedicated live lifecycle test suites verified against production:
     - `crm-lifecycle-live.mjs` (12/12 PASS): Pipeline discovery, task creation, details editing, stage transition, employee assignment, comments, audit history, deletion, 404 verification.
     - `lms-lifecycle-live.mjs` (11/11 PASS): Course creation, chapter creation, lesson creation, publishing, catalog discovery, outline retrieval, lesson completion, progress tracking, unpublishing, unpublished hiding, deletion.
     - `chat-notifications-live.mjs` (8/8 PASS): Notifications list, read-all, chat contacts, direct messaging, unread counter detection, thread history, read status, unread reset.
     - `documents-search-live.mjs` (9/9 PASS): Document templates, multipart upload, visible documents, status update, client document access, stream download verification, global search, deletion, 404 verification.
     - `billing-invoices-live.mjs` (5/5 PASS): Invoice creation (ISSUED), client querying, adjustment to PAID, deletion, list removal.
23. **Vulnerability Remediation & Production Hardening**:
   - Fixed Invoice IDOR and mutation: added `GET /api/v1/invoices/{id}` with `assertCanRead`, revoked client invoice write/create permissions.
   - Enforced strict Read-Only mode for `ADVISOR`: removed advisor mutation rights from `TaskController`, `CrmAccessService.canUpdateTaskDetails`, and `DocumentAccessService.canWrite` / `canCreateFor`.
   - Fixed PDF generation 500 failure in `PdfGeneratorService` with safe font classpath probe and graceful fallback.
   - Fixed PostgreSQL foreign key constraint violation on course deletion: added cascade cleanup of progress, enrollments, and certificates in `CourseService.deleteCourse`.
   - Fixed null chapter ID return in `CourseService.createChapter` via explicit `chapterRepository.save(chapter)`.
   - Standardized `README.md` into a sober, engineering-focused reference documenting the 243 unit/integration tests and 9 live E2E suites without marketing hype.
24. **Production Database Test Data Cleanup**:
   - Safely purged all load testing and E2E artifacts via an interactive atomic transaction on `zhanfinance-db`:
     - 125 test contact requests (`id >= 16`) deleted; 15 real client requests (`id 1..15`) preserved.
     - 33 test users (`id > 22`, emails `artillery.*`, `e2e.*`), 31 client profiles, 22 refresh tokens, 32 notifications, 3 chat messages deleted; 16 real persistent accounts (`id 1..22`) intact.
     - 11 test tasks (`id >= 35`) deleted; 26 real tasks (`id 1..34`) intact.
     - 4 test courses (`id 21, 22, 24, 26`), 4 chapters, 4 lessons, 4 progress entries, 4 enrollments, 4 certificates deleted; 4 production courses intact.
     - 3 test invoices deleted; 27 real document records (`id 17..45`) 100% untouched.
25. **Email Engine Async Hardening & AFTER_COMMIT Event Dispatching**:
   - Added SMTP socket timeouts (5000ms connect, read, write) in `application.properties` to prevent indefinite socket hangs.
   - Configured isolated `mailExecutor` (core 2, max 6, queue 200, prefix `mail-worker-`) in `AsyncConfig.java` with logging DiscardPolicy, eliminating `CallerRunsPolicy` to protect HikariCP DB pool from starvation.
   - Refactored email dispatching to Spring Events + `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)`: emails are sent asynchronously in `mailExecutor` strictly AFTER successful DB transaction commit, preventing ghost emails on transaction rollback and eliminating `LazyInitializationException`.




## Known Issues & Warnings
- **Contact Form Backend API**: `POST /api/v1/contact-requests` in `useContactForm.ts` is intentionally commented out in favor of the direct WhatsApp flow (`+77750584021` / `wa.me`). Lead creation is handled directly via WhatsApp with QR support.
- **CF-Connecting-IP**: Trusted before Cloudflare is connected (auto-resolves with Epic-11)
- **Refresh token race condition**: Known, not critical at current scale
- **Caffeine cache**: recordStats() not enabled, WARN in logs, no impact
- **Local Dev Warnings**:
  - Initial `ERR_CONNECTION_REFUSED` on `/api/v1/auth/me` and `/api/v1/services/highlighted` occurs normally before Spring Boot completes startup.
  - Google Sign-In console warning: `google.accounts.id.initialize() is called multiple times`.
  - Accessibility warning on `/settings`: Password forms missing username field for autofill/screenreaders.

## Pre-Release Audit Findings [CRITICAL — Phase 2 Remediation Required]
Full report: `.agents/audit_report.md` on `audit/pre-release` branch.
- **C1** [CRITICAL] Avatar 404: `FileDownloadController.java:48` prefix `"avatars/"` + storageKey, but DB stores key WITHOUT prefix → 404 on all avatar loads
- **C2** [CRITICAL] N+1 queries: Course catalog, Curators, Documents (1+3N), Chat contacts (1+2N) → OOM risk under load [FIXED: Added findLastMessagesForUser in Chat, findDocumentsByIds in Document]
- **C3** [CRITICAL] Unbounded queries: AuditLog, Notifications, Invoices, Subscriptions. `SubscriptionService.hasOverlap` loop → OOM risk. [FIXED: Added SQL EXISTS in SubscriptionRepository, paginated others]
- **C4** [CRITICAL] V107 migration: inserts NULL into `courses.created_by` (NOT NULL) → clean DB from scratch fails. Fix: new migration V111
- **C5** [CRITICAL] Missing @Transactional: `TaskService.requestTask()` + 5 methods in `AdminService` (demote/toggle/approve/reject/createLearner) → audit events lost on partial failure
- **C6** [CRITICAL] `OfficialDocumentTemplateSeeder` deletes all templates on EVERY app start → prod customized templates wiped on every deploy


## Next Steps
- Epic-07 / Epic-12: Billing & Payments (WebKassa / Kaspi Pay integration)
- Epic-11: Domain zhanfinance.kz + Cloudflare
- Dashboard, Staging, Notifications postponed until billing/domain MVP is complete.

## Epic Status Summary
- Done: 01-auth, 02-crm, 03-documents, 04-lms, 05-chat, 06-notifications, 08-dashboard, 09-2fa, 10-monitoring, 18-landing, 19-advisor (11)
- Partial: 07-billing (1)
- Planned: 11-domain-cdn, 12-payments, 13-1c-integration, 15-storage-r2, 16-lms-quizzes, 17-staging (6)

## Technical Backlog
- Check `sentry-spring-boot-starter-jakarta` version compatibility with Spring Boot 4.1.0 to restore backend Sentry error tracking (crashed on 8.51.0 due to `RestClientCustomizer`).
8. **Testing & Security**: Implemented Registration Status (PENDING, APPROVED, REJECTED) logic for strict security check and fail-closed anti-enumeration. Fully implemented frontend and backend test suites (Vitest & JUnit/Mockito).
- Security vulnerabilities (Path Traversal, IP Spoofing, IDOR, CSV Injection, DoS uploads, Token Race Condition) identified in verification audit have been fixed and pushed to main [DONE]
- Security vulnerabilities Phase 2 (JWT URL leak, DoS file uploads, Actuator port leak, Content-Disposition Header Injection, MIME Spoofing) fixed and pushed to main [DONE]
