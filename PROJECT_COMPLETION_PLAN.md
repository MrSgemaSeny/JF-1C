# Project Completion & Final Release Plan — JF-1C (ZhanFinance)
**Target Date**: Next Working Day (Final Sign-off)
**Role**: Senior Tech Lead / Full-Stack Engineer
**Status**: Ready for Final Smoke Testing and Project Delivery

---

## 1. Executive Summary & Objective

The objective for tomorrow is to conduct a systematic, zero-regression smoke test across the entire ZhanFinance (JF-1C) SaaS platform, verify end-to-end operational stability on production environments (Fly.io + GitHub Pages), and achieve 100% formal acceptance for project delivery.

### Key Success Criteria:
1. All automated test suites (Backend JUnit/Mockito and Frontend Vitest/TypeScript) pass with zero errors.
2. Production builds (Fly.io backend, GitHub Pages frontend) are healthy and synchronized with the latest `main` branch.
3. Every user persona (Admin, Employee, Client, Learner, Curator, Advisor) can execute their mission-critical user journeys without UI freezes or API errors.
4. Core security boundaries (JWT Bearer flow, 2FA TOTP, Role-Based Access Control via `CrmAccessService`, DB immutable audit logs) operate without vulnerabilities or data leakage.
5. Automated database backups and Telegram operational alerts function properly.

---

## 2. Pre-Flight Architecture Verification

Before running interactive tests, verify core system health:

### 2.1 Backend Services (Fly.io)
- Verify Fly.io app status: `fly status --app jf-1c`
- Verify DB connectivity: PostgreSQL migrations V1 through V120 applied cleanly without schema drift.
- Verify health check endpoint: `GET /api/v1/health` (or Actuator `/actuator/health`) returns HTTP 200 `UP`.
- Verify secrets configuration: JWT secret, DB credentials, Gmail SMTP, Telegram Bot tokens present in Fly secrets.

### 2.2 Frontend Delivery (GitHub Pages)
- Verify GitHub Actions deployment status on `main` branch (`deploy-backend.yml`, `ci.yml`).
- Verify production assets loaded with proper `Cache-Control` meta headers.
- Verify SPA routing (`/login`, `/dashboard`, `/tasks`, `/documents`, `/lms`, `/advisor`, `/landing`) without 404 on hard refresh.

---

## 3. End-to-End Smoke Test Checklist by Role

Execute tests in the following order to validate the system layer by layer:

### Phase A: Public & Landing Experience (Unauthenticated)
- [ ] **Landing Pages**: Open public landing page (`/`). Verify all sections render (Services, About, Solution Picker, Contact form).
- [ ] **Lead Submission**: Fill out and submit the "Leave Request" form. Verify lead is recorded in DB and Telegram alert is dispatched.
- [ ] **Auth Navigation**: Click "Login" / "Register". Verify login modal/page displays smoothly without redirect loops.

### Phase B: Authentication & Security (All Roles)
- [ ] **Email/Password Login**: Log in with standard credentials. Confirm in-memory JWT `accessToken` acquisition and refresh token rotation.
- [ ] **2FA (TOTP) Flow**:
  - Enable 2FA from profile settings -> scan QR code -> enter TOTP code.
  - Log out and log back in -> enter pre-auth code -> verify successful dashboard entry.
  - Test anti-brute-force: enter invalid TOTP 5 times -> verify account protection response.
- [ ] **Pending Registration Flow**: Register new Employee account -> verify redirect to status screen ("Ваша заявка в работе").
- [ ] **Session Expiry & Refresh**: Verify token auto-refresh silently refreshes access without dropping user state.

### Phase C: Admin Role (`ADMIN`)
- [ ] **User Management**: Approve pending employee account, toggle user roles, verify audit log record.
- [ ] **Pipeline & Stage Config**: View CRM pipelines, create/edit stages.
- [ ] **Business Overview**: Check Dashboard analytics (leads, revenues, conversion rates, task metrics).
- [ ] **System Audit Logs**: Verify immutability of audit log table (read-only verification).

### Phase D: Advisor Role (`ADVISOR`)
- [ ] **Advisor Overview**: Navigate to Advisor dashboard, verify global workload metrics and active company distribution.
- [ ] **Cross-Client Access**: Open any client task or document without permission errors (read/advisory scope).
- [ ] **Workload Matrix**: Verify employee assignment load visualizer displays properly.

### Phase E: Employee Role (`EMPLOYEE`)
- [ ] **CRM Task Board**:
  - Open Kanban task board -> move task across stages -> verify state persistence.
  - Assign task from Task Pool -> verify auto-reopening logic if task was previously marked as LOST.
- [ ] **Document Management**:
  - Upload client accounting file (PDF/Excel) -> verify MIME validation and storage key.
  - Download single document and test ZIP bulk download.
  - Filter documents by folder pills and source tags.
- [ ] **Client Communication**: Send a message in internal chat -> verify STOMP/SockJS real-time delivery to Client.

### Phase F: Client Role (`CLIENT`)
- [ ] **Client Portal**: View assigned tasks, current status, and invoice summaries.
- [ ] **Document Center**: Download generated act/invoice PDF templates with proper Cyrillic rendering.
- [ ] **Chat with Manager**: Verify incoming employee messages and send reply.

### Phase G: LMS Platform (`LEARNER` & `CURATOR`)
- [ ] **Learner Journey**:
  - Open Course Catalog -> enroll in course -> navigate Course -> Chapter -> Lesson -> LessonBlock.
  - Complete lesson -> check progress bar updates.
  - Verify completion certificate generation (PDF).
- [ ] **Curator Management**:
  - Create/edit course content, review learner progress and homework submissions.

---

## 4. Operational & Observability Verification

- [ ] **Telegram Alerts**: Verify admin alerts received on lead submission and critical workflow events.
- [ ] **Uptime & Metrics**: Confirm Prometheus/OTLP metric ingestion and UptimeRobot heartbeat.
- [ ] **Automated Backups**: Verify scheduled DB backup action (GitHub Actions / Flyctl) has recorded latest snapshot.

---

## 5. Final Sign-Off & Project Acceptance Procedure

When all smoke test items are checked:
1. **Automated Quality Gate**: Run local backend tests (`./gradlew test`) and frontend tests (`npm run test && npm run build`) to ensure 100% green status.
2. **Git Tag & Branch Hygiene**:
   - Ensure `main` is clean, all epics updated to `Done` in `Epics/Plan/`.
   - Update `.agents/CONTEXT.md` with final release status.
   - Tag release `v1.0.0-final` or target version.
3. **Formal Handover**: Present the completed smoke test checklist to stakeholders for final acceptance sign-off.
