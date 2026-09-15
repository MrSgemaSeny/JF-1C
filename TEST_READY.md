# JF-1C Test Readiness Inventory & Opaque-Box Test Specifications

## Status: TEST INFRASTRUCTURE READY & ACTIVE
- **Project**: JF-1C (ZhanFinance SaaS CRM, LMS & Accounting Platform)
- **Framework**: Spring Boot 4.1.0 (Backend), React 19 + Vite (Frontend), Node.js ESM + Playwright (E2E)
- **Track**: Dual Track E2E Testing Track (Requirement-Driven Opaque-Box Architecture)
- **Coverage Gates**: JaCoCo instruction >= 70%, Vitest coverage >= 70%, ESLint 9 (0 warnings), TypeScript strict (0 errors)

---

## 1. Executive Summary & Inventory Matrix

| Tier | Focus Level | Target Scope | Minimum Required | Specified Cases | Status |
|------|-------------|--------------|------------------|-----------------|--------|
| **Tier 1** | Feature Coverage (Happy Path & Isolation) | 18 Features | >= 5 per feature (90 total) | 90 test cases | READY |
| **Tier 2** | Boundary & Corner Cases (Extremes, Nulls, IDOR, Limits) | 18 Features | >= 5 per feature (90 total) | 90 test cases | READY |
| **Tier 3** | Cross-Feature Combinations (Pairwise Inter-Module) | Core Modules | >= 12 combinations | 16 test cases | READY |
| **Tier 4** | Real-World Application Scenarios (Multi-Persona E2E) | Full Workflows | >= 5 journeys | 6 complete journeys | READY |
| **TOTAL** | Complete Opaque-Box Test Inventory | Entire Platform | >= 197 specifications | 202 test specifications | READY |

---

## 2. Tier 1: Feature Coverage (Isolation & Happy Path)

### Feature 1: Authentication & Session Management (AUTH)
- **TC-T1-AUTH-01: Standard User Login with Valid Credentials**
  - Input: `POST /api/v1/auth/login` with `{ "email": "admin@zhanfinance.kz", "password": "TestPass123" }`
  - Authoritative Source: `ORIGINAL_REQUEST.md R1`, `AuthController.java`
  - Expected Output: HTTP 200 OK, `data.accessToken` string present, `data.user.role == "ADMIN"`, HttpOnly cookies `refreshToken` and `accessToken` set.
  - Runner: `AuthControllerTest.java` / `tests/e2e/api-live.mjs`
- **TC-T1-AUTH-02: New Client Registration**
  - Input: `POST /api/v1/auth/register` with valid full name, email, password, role "CLIENT", phone, and company name.
  - Authoritative Source: `ORIGINAL_REQUEST.md R1`, `AuthService.java`
  - Expected Output: HTTP 201 Created (or 200 OK with success payload), client record persisted in `users` and `client_profiles` tables with `enabled = true`.
  - Runner: `AuthControllerTest.java` / `tests/e2e/auth-helper.mjs`
- **TC-T1-AUTH-03: Refresh Access Token via Refresh Token**
  - Input: `POST /api/v1/auth/refresh` with valid `refreshToken` cookie or body.
  - Authoritative Source: `PROJECT.md § Interface Contracts`, `RefreshTokenService.java`
  - Expected Output: HTTP 200 OK, newly issued `accessToken` with refreshed expiration window.
  - Runner: `AuthControllerTest.java`
- **TC-T1-AUTH-04: User Logout and Token Invalidation**
  - Input: `POST /api/v1/auth/logout` with Bearer token and refresh cookie.
  - Authoritative Source: `TEST_COVERAGE_PLAN.md § 1.1`, `AuthController.java`
  - Expected Output: HTTP 200 OK, refresh token cleared from database and cookies cleared in response headers.
  - Runner: `AuthControllerTest.java`
- **TC-T1-AUTH-05: Authenticated Current User Profile Probe**
  - Input: `GET /api/v1/auth/me` with Bearer header.
  - Authoritative Source: `AuthController.java`, `UserPrincipal.java`
  - Expected Output: HTTP 200 OK, returning current user ID, role, permissions, and company profile.
  - Runner: `AuthControllerTest.java` / `tests/e2e/auth-helper.mjs`

### Feature 2: Two-Factor TOTP Authentication (2FA)
- **TC-T1-2FA-01: Admin 2FA Setup Secret Generation**
  - Input: `GET /api/v1/auth/2fa/setup` with ADMIN Bearer token.
  - Authoritative Source: `TwoFactorController.java`, `TwoFactorService.java`, RFC 6238
  - Expected Output: HTTP 200 OK, payload contains non-empty `secret` (Base32 encoded) and valid `qrCodeUri` prefixed with `otpauth://totp/`.
  - Runner: `TwoFactorControllerTest.java` / `tests/e2e/2fa-lifecycle.mjs`
- **TC-T1-2FA-02: Admin 2FA Setup Confirmation with Valid TOTP**
  - Input: `POST /api/v1/auth/2fa/setup/confirm` with secret and generated 6-digit TOTP code.
  - Authoritative Source: `TwoFactorService.java`
  - Expected Output: HTTP 200 OK, user entity updated with `twoFactorEnabled = true` and `twoFactorSecret`.
  - Runner: `TwoFactorControllerTest.java`
- **TC-T1-2FA-03: Two-Factor Login Challenge Initiation**
  - Input: `POST /api/v1/auth/login` for user with 2FA enabled.
  - Authoritative Source: `AuthService.java`
  - Expected Output: HTTP 200 OK with `requires2FA: true` and temporary `preAuthToken`, without final access token.
  - Runner: `TwoFactorControllerTest.java`
- **TC-T1-2FA-04: Two-Factor Verification with Pre-Auth Token**
  - Input: `POST /api/v1/auth/2fa/verify` with valid `preAuthToken` and valid TOTP code.
  - Authoritative Source: `TwoFactorController.java`
  - Expected Output: HTTP 200 OK, full `AuthResponse` issued, pre-auth token invalidated.
  - Runner: `TwoFactorControllerTest.java`
- **TC-T1-2FA-05: Admin 2FA Deactivation with Valid Code**
  - Input: `POST /api/v1/auth/2fa/disable` with valid TOTP code.
  - Authoritative Source: `TwoFactorController.java`
  - Expected Output: HTTP 200 OK, `twoFactorEnabled` set to false, secret purged.
  - Runner: `TwoFactorControllerTest.java`

### Feature 3: User Profile & Credentials (USER)
- **TC-T1-USER-01: Retrieve Self Profile Details**
  - Input: `GET /api/v1/users/me` with Bearer token.
  - Authoritative Source: `UserController.java`
  - Expected Output: HTTP 200 OK with email, fullName, role, phone, and locale settings.
  - Runner: `UserControllerTest.java`
- **TC-T1-USER-02: Update User Profile Metadata**
  - Input: `PUT /api/v1/users/me` with `{ "fullName": "Updated Name", "phone": "+77015554433" }`
  - Authoritative Source: `UserService.java`
  - Expected Output: HTTP 200 OK, persisted changes reflected in database.
  - Runner: `UserControllerTest.java`
- **TC-T1-USER-03: Change User Password with Current Password Verification**
  - Input: `PUT /api/v1/users/me/password` with `{ "currentPassword": "OldPassword123", "newPassword": "NewPassword456" }`
  - Authoritative Source: `UserService.java`, BCryptPasswordEncoder
  - Expected Output: HTTP 200 OK, password hash updated in `users` table.
  - Runner: `UserControllerTest.java`
- **TC-T1-USER-04: Update UI Locale Preference**
  - Input: `PATCH /api/v1/users/me/locale` with `{ "locale": "kk" }`
  - Authoritative Source: `UserController.java`
  - Expected Output: HTTP 200 OK, user preferred language set to Kazakh.
  - Runner: `UserControllerTest.java`
- **TC-T1-USER-05: Upload User Profile Avatar**
  - Input: `POST /api/v1/users/me/avatar` with multipart image file (`avatar.png`).
  - Authoritative Source: `UserController.java`, `DatabaseStorageService.java`
  - Expected Output: HTTP 200 OK with updated `avatarUrl`.
  - Runner: `UserControllerTest.java`

### Feature 4: Administration & User Governance (ADMIN)
- **TC-T1-ADMIN-01: Admin List All Registered Employees**
  - Input: `GET /api/v1/admin/employees` with ADMIN token.
  - Authoritative Source: `AdminController.java`, `AdminService.java`
  - Expected Output: HTTP 200 OK, array of `EmployeeDto` with roles and assignment counts.
  - Runner: `AdminControllerTest.java`
- **TC-T1-ADMIN-02: Approve Pending Employee Registration**
  - Input: `POST /api/v1/admin/employees/{id}/approve` with pending employee ID.
  - Authoritative Source: `AdminController.java`
  - Expected Output: HTTP 200 OK, target user `enabled` set to true, notification dispatched.
  - Runner: `AdminControllerTest.java` / `tests/e2e/auth-helper.mjs`
- **TC-T1-ADMIN-03: Promote Employee to ADVISOR Role**
  - Input: `POST /api/v1/admin/employees/{id}/promote-to-advisor`
  - Authoritative Source: `AdminController.java`, `Role.ADVISOR`
  - Expected Output: HTTP 200 OK, target user role updated to `ADVISOR` with read-only permissions.
  - Runner: `AdminControllerTest.java` / `tests/e2e/advisor-readonly-lifecycle.mjs`
- **TC-T1-ADMIN-04: Demote ADVISOR Back to EMPLOYEE Role**
  - Input: `POST /api/v1/admin/employees/{id}/demote-to-employee`
  - Authoritative Source: `AdminController.java`
  - Expected Output: HTTP 200 OK, target user role restored to `EMPLOYEE`.
  - Runner: `AdminControllerTest.java`
- **TC-T1-ADMIN-05: Retrieve Employee Workload Analytics**
  - Input: `GET /api/v1/admin/employees/workload`
  - Authoritative Source: `AdminController.java`, `DashboardService.java`
  - Expected Output: HTTP 200 OK, returns active task counts, overdue counts, and capacity metrics per employee.
  - Runner: `AdminControllerTest.java`

### Feature 5: CRM Task Operations & Batch Engine (TASK)
- **TC-T1-TASK-01: Create CRM Task Under Specified Pipeline and Stage**
  - Input: `POST /api/v1/crm/tasks` with `{ "title": "Buhgalterskiy Otchet", "pipelineId": 1, "priority": "HIGH" }`
  - Authoritative Source: `TaskController.java`, `TaskService.java`
  - Expected Output: HTTP 201 Created (or 200 OK), task record created with unique ID and assigned initial stage.
  - Runner: `TaskControllerTest.java` / `tests/e2e/crm-lifecycle-live.mjs`
- **TC-T1-TASK-02: Query Filtered Task List by Assignee and Stage**
  - Input: `GET /api/v1/crm/tasks?stageId=1&assignedToId={empId}`
  - Authoritative Source: `TaskController.java`, `TaskRepository.java`
  - Expected Output: HTTP 200 OK, returns list of matching tasks.
  - Runner: `TaskControllerTest.java`
- **TC-T1-TASK-03: Transition Task to New Stage**
  - Input: `PATCH /api/v1/crm/tasks/{id}/stage?stageId=2`
  - Authoritative Source: `TaskController.java`, `CrmAccessService.java`
  - Expected Output: HTTP 200 OK, task `stageId` updated, audit entry recorded in `audit_logs`.
  - Runner: `TaskControllerTest.java` / `tests/e2e/crm-lifecycle-live.mjs`
- **TC-T1-TASK-04: Append Comment to CRM Task**
  - Input: `POST /api/v1/crm/tasks/{id}/comments` with `{ "text": "Dokumenty provereny" }`
  - Authoritative Source: `TaskController.java`
  - Expected Output: HTTP 200 OK, comment saved and returned with author metadata and timestamp.
  - Runner: `TaskControllerTest.java`
- **TC-T1-TASK-05: Batch Update Stages Across Multiple Tasks**
  - Input: `PATCH /api/v1/crm/tasks/batch/stage` with `{ "taskIds": [1, 2], "stageId": 3 }`
  - Authoritative Source: `TaskService.java § batchUpdateTasks`
  - Expected Output: HTTP 200 OK, all specified tasks moved to stage 3, dashboard caches evicted.
  - Runner: `TaskControllerTest.java`, `TaskServiceTest.java`

### Feature 6: CRM Client Management (CLIENT)
- **TC-T1-CLIENT-01: Create Client Profile with Contact Details**
  - Input: `POST /api/v1/crm/clients` with `{ "companyName": "ТОО Рассвет", "contactPerson": "Алихан", "email": "info@rassvet.kz", "phone": "+77011234567", "binIin": "123456789012" }`
  - Authoritative Source: `ClientController.java`, `ClientService.java`
  - Expected Output: HTTP 200 OK with client ID and timestamps.
  - Runner: `ClientControllerTest.java`
- **TC-T1-CLIENT-02: Assign Employee to Client Account**
  - Input: `POST /api/v1/crm/clients/{id}/assign?employeeId={empId}`
  - Authoritative Source: `ClientController.java`
  - Expected Output: HTTP 200 OK, client profile updated with assigned accountant.
  - Runner: `ClientControllerTest.java`
- **TC-T1-CLIENT-03: Retrieve Client Profile by ID as Assigned Employee**
  - Input: `GET /api/v1/crm/clients/{id}` by assigned employee.
  - Authoritative Source: `CrmAccessService.java § assertCanReadClient`
  - Expected Output: HTTP 200 OK with complete company profile and task summary.
  - Runner: `ClientControllerTest.java`
- **TC-T1-CLIENT-04: Update Client Company Metadata**
  - Input: `PUT /api/v1/crm/clients/{id}` with updated phone number and notes.
  - Authoritative Source: `ClientController.java`
  - Expected Output: HTTP 200 OK with modified fields.
  - Runner: `ClientControllerTest.java`
- **TC-T1-CLIENT-05: Retrieve Aggregated Client Statistics**
  - Input: `GET /api/v1/admin/clients/stats` with ADMIN token.
  - Authoritative Source: `AdminController.java`, `ClientProfileRepository.java`
  - Expected Output: HTTP 200 OK, returning total clients, active clients, and assigned ratios.
  - Runner: `AdminControllerTest.java`

### Feature 7: Dashboard Analytics & Workload (DASH)
- **TC-T1-DASH-01: Admin Global Dashboard Metrics Retrieval**
  - Input: `GET /api/v1/crm/dashboard/admin`
  - Authoritative Source: `DashboardController.java`, `DashboardService.java`
  - Expected Output: HTTP 200 OK with `revenueWon`, `revenueExpected`, `avgCompletionDays`, and employee matrices.
  - Runner: `DashboardControllerTest.java`, `DashboardServiceTest.java`
- **TC-T1-DASH-02: Employee Personalized Dashboard Metrics**
  - Input: `GET /api/v1/crm/dashboard/employee`
  - Authoritative Source: `DashboardService.java`
  - Expected Output: HTTP 200 OK, urgent tasks bucketed (due today/overdue) and planned weekly tasks.
  - Runner: `DashboardControllerTest.java`, `DashboardServiceTest.java`
- **TC-T1-DASH-03: Client Dashboard Overview**
  - Input: `GET /api/v1/crm/dashboard/client`
  - Authoritative Source: `DashboardController.java`
  - Expected Output: HTTP 200 OK, containing only current client's active task count and invoice balances.
  - Runner: `DashboardControllerTest.java`
- **TC-T1-DASH-04: Weekly Summary Dashboard Aggregation**
  - Input: `GET /api/v1/crm/dashboard/weekly-summary`
  - Authoritative Source: `DashboardController.java`
  - Expected Output: HTTP 200 OK with weekly completion rates and historical performance.
  - Runner: `DashboardControllerTest.java`
- **TC-T1-DASH-05: Cache Invalidation on Task Mutation**
  - Input: Stage mutation on task, followed by `GET /api/v1/crm/dashboard/admin`.
  - Authoritative Source: `DashboardService.java` Caffeine `@CacheEvict`
  - Expected Output: Fresh dashboard data reflecting the stage change without stale cached counts.
  - Runner: `DashboardServiceTest.java`

### Feature 8: Pipeline & Stage Configuration (PIPE)
- **TC-T1-PIPE-01: List All Pipelines with Stages**
  - Input: `GET /api/v1/crm/pipelines`
  - Authoritative Source: `PipelineController.java`
  - Expected Output: HTTP 200 OK, array of pipelines ordered by sequence with nested stages.
  - Runner: `PipelineControllerTest.java`
- **TC-T1-PIPE-02: Admin Create New Pipeline**
  - Input: `POST /api/v1/crm/pipelines` with `{ "name": "Налоговый Аудит", "orderIndex": 2 }`
  - Authoritative Source: `PipelineController.java`
  - Expected Output: HTTP 200 OK, pipeline created with unique ID.
  - Runner: `PipelineControllerTest.java`
- **TC-T1-PIPE-03: Admin Add Stage to Pipeline**
  - Input: `POST /api/v1/crm/pipelines/{id}/stages` with `{ "name": "Проверка документов", "orderIndex": 1, "type": "IN_PROGRESS" }`
  - Authoritative Source: `PipelineController.java`
  - Expected Output: HTTP 200 OK with stage ID and mapped pipeline relationship.
  - Runner: `PipelineControllerTest.java`
- **TC-T1-PIPE-04: Reorder Stages Within Pipeline**
  - Input: `PUT /api/v1/crm/pipelines/{id}/stages` with reordered stage array.
  - Authoritative Source: `PipelineController.java`
  - Expected Output: HTTP 200 OK, order indexes updated sequentially.
  - Runner: `PipelineControllerTest.java`
- **TC-T1-PIPE-05: Delete Empty Stage**
  - Input: `DELETE /api/v1/crm/pipelines/{pipelineId}/stages/{stageId}`
  - Authoritative Source: `PipelineController.java`
  - Expected Output: HTTP 200 OK, stage removed from database.
  - Runner: `PipelineControllerTest.java`

### Feature 9: Billing & Invoicing Lifecycle (INVOICE)
- **TC-T1-INVOICE-01: Admin/Employee Create Invoice for Client**
  - Input: `POST /api/v1/billing/invoices` with `{ "clientId": 1, "title": "Абонентское обслуживание", "amount": 120000.0, "dueDate": "2026-10-30", "status": "ISSUED" }`
  - Authoritative Source: `InvoiceController.java`, `InvoiceService.java`
  - Expected Output: HTTP 200 OK, invoice created with unique ID and ISSUED status.
  - Runner: `InvoiceControllerTest.java` / `tests/e2e/billing-invoices-live.mjs`
- **TC-T1-INVOICE-02: Client Query Invoices Belonging to Themselves**
  - Input: `GET /api/v1/billing/invoices` with CLIENT token.
  - Authoritative Source: `InvoiceAccessService.java`
  - Expected Output: HTTP 200 OK, only records where `clientId == currentClient.id` returned.
  - Runner: `InvoiceControllerTest.java` / `tests/e2e/billing-invoices-live.mjs`
- **TC-T1-INVOICE-03: Transition Invoice Status ISSUED to PAID**
  - Input: `PUT /api/v1/billing/invoices/{id}` with `{ "status": "PAID" }`
  - Authoritative Source: `InvoiceService.java`
  - Expected Output: HTTP 200 OK, status updated to PAID, paid timestamp recorded.
  - Runner: `InvoiceControllerTest.java` / `tests/e2e/billing-invoices-live.mjs`
- **TC-T1-INVOICE-04: Generate Invoice PDF Document Stream**
  - Input: `GET /api/v1/billing/invoices/{id}/pdf`
  - Authoritative Source: `PdfGeneratorService.java`, OpenHtmlToPdf
  - Expected Output: HTTP 200 OK, `Content-Type: application/pdf`, valid PDF binary header `%PDF-1.`.
  - Runner: `InvoiceControllerTest.java`, `PdfGeneratorServiceTest.java`
- **TC-T1-INVOICE-05: Generate Act of Completed Work PDF**
  - Input: `GET /api/v1/billing/invoices/{id}/act-pdf`
  - Authoritative Source: `PdfGeneratorService.java`
  - Expected Output: HTTP 200 OK, `Content-Type: application/pdf`, Cyrillic text rendered cleanly.
  - Runner: `InvoiceControllerTest.java`

### Feature 10: Subscription Management (SUB)
- **TC-T1-SUB-01: Create Subscription for Client Service**
  - Input: `POST /api/v1/billing/subscriptions` with `{ "clientId": 1, "serviceId": 1, "startDate": "2026-01-01", "endDate": "2026-12-31", "monthlyFee": 50000.0 }`
  - Authoritative Source: `SubscriptionController.java`
  - Expected Output: HTTP 200 OK with subscription record.
  - Runner: `SubscriptionControllerTest.java`
- **TC-T1-SUB-02: List Active Subscriptions for Client**
  - Input: `GET /api/v1/billing/subscriptions?clientId=1`
  - Authoritative Source: `SubscriptionController.java`
  - Expected Output: HTTP 200 OK, array of active client subscriptions.
  - Runner: `SubscriptionControllerTest.java`
- **TC-T1-SUB-03: Update Subscription Billing Parameters**
  - Input: `PUT /api/v1/billing/subscriptions/{id}` with modified `monthlyFee`.
  - Authoritative Source: `SubscriptionController.java`
  - Expected Output: HTTP 200 OK, persisted changes saved.
  - Runner: `SubscriptionControllerTest.java`
- **TC-T1-SUB-04: Cancel Subscription at Term End**
  - Input: `PATCH /api/v1/billing/subscriptions/{id}/cancel`
  - Authoritative Source: `SubscriptionController.java`
  - Expected Output: HTTP 200 OK, status set to `CANCELLED`.
  - Runner: `SubscriptionControllerTest.java`
- **TC-T1-SUB-05: Automated Subscription Overdue Verification**
  - Input: Background check on subscription past `endDate`.
  - Authoritative Source: `SubscriptionService.java`
  - Expected Output: Subscription status transitions to `EXPIRED`.
  - Runner: `SubscriptionControllerTest.java`

### Feature 11: LMS Admin Course Administration (CRS_ADMIN)
- **TC-T1-CRS_ADMIN-01: Admin Create Course Offering**
  - Input: `POST /api/v1/admin/courses` with `{ "title": "Основы 1С:Бухгалтерии", "description": "Полный курс", "published": true }`
  - Authoritative Source: `AdminCourseController.java`
  - Expected Output: HTTP 201 Created with generated course ID.
  - Runner: `AdminCourseControllerTest.java` / `tests/e2e/lms-lifecycle-live.mjs`
- **TC-T1-CRS_ADMIN-02: Admin Create Course Chapter**
  - Input: `POST /api/v1/admin/courses/{id}/chapters` with `{ "title": "Глава 1. Проводки", "orderIndex": 1 }`
  - Authoritative Source: `AdminCourseController.java`
  - Expected Output: HTTP 201 Created with chapter ID linked to course.
  - Runner: `AdminCourseControllerTest.java`
- **TC-T1-CRS_ADMIN-03: Admin Add Lesson with Content**
  - Input: `POST /api/v1/admin/courses/{courseId}/lessons` with title, text content, and video URL.
  - Authoritative Source: `AdminCourseController.java`, `LessonService.java`
  - Expected Output: HTTP 201 Created, lesson order index computed automatically.
  - Runner: `AdminCourseControllerTest.java`, `LessonServiceTest.java`
- **TC-T1-CRS_ADMIN-04: Admin Upload Supplementary Material for Lesson**
  - Input: `POST /api/v1/admin/courses/lessons/{id}/upload` with multipart PDF guide.
  - Authoritative Source: `LessonService.java`, `StorageService.java`
  - Expected Output: HTTP 200 OK, storage key generated and associated with lesson.
  - Runner: `LessonServiceTest.java`
- **TC-T1-CRS_ADMIN-05: Admin Delete Course with Cascade**
  - Input: `DELETE /api/v1/admin/courses/{id}`
  - Authoritative Source: `AdminCourseController.java`
  - Expected Output: HTTP 200 OK, cascading cleanup of chapters, lessons, and student progress records.
  - Runner: `AdminCourseControllerTest.java`

### Feature 12: LMS Learner Course Progression (CRS_LRN)
- **TC-T1-CRS_LRN-01: Learner Browse Published Course Catalog**
  - Input: `GET /api/v1/courses` with LEARNER token.
  - Authoritative Source: `LearnerCourseController.java`
  - Expected Output: HTTP 200 OK, returning only courses where `published == true`.
  - Runner: `LearnerCourseControllerTest.java` / `tests/e2e/lms-lifecycle-live.mjs`
- **TC-T1-CRS_LRN-02: Learner Fetch Course Structure and Lessons**
  - Input: `GET /api/v1/courses/{id}`
  - Authoritative Source: `LearnerCourseController.java`
  - Expected Output: HTTP 200 OK with chapters and lessons outline.
  - Runner: `LearnerCourseControllerTest.java`
- **TC-T1-CRS_LRN-03: Learner Mark Lesson as Completed**
  - Input: `POST /api/v1/courses/{courseId}/lessons/{lessonId}/complete`
  - Authoritative Source: `LearnerCourseController.java`
  - Expected Output: HTTP 200 OK, completion record persisted in `lesson_progress`.
  - Runner: `LearnerCourseControllerTest.java` / `tests/e2e/lms-lifecycle-live.mjs`
- **TC-T1-CRS_LRN-04: Learner Query Course Completion Percentage**
  - Input: `GET /api/v1/courses/{id}/progress`
  - Authoritative Source: `LearnerCourseController.java`
  - Expected Output: HTTP 200 OK, returning `completedLessons`, `totalLessons`, and calculated percentage.
  - Runner: `LearnerCourseControllerTest.java`
- **TC-T1-CRS_LRN-05: Public Verify Certificate by Unique Code**
  - Input: `GET /api/v1/courses/certificates/verify/{code}` without authentication.
  - Authoritative Source: `LearnerCourseController.java § permitAll`
  - Expected Output: HTTP 200 OK with recipient student name, course title, and issue date.
  - Runner: `LearnerCourseControllerTest.java`

### Feature 13: LMS Curator Supervision (CRS_CUR)
- **TC-T1-CRS_CUR-01: Curator List Assigned Supervised Courses**
  - Input: `GET /api/v1/curator/courses` with CURATOR token.
  - Authoritative Source: `CuratorCourseController.java`
  - Expected Output: HTTP 200 OK, returning courses specifically assigned to the curator.
  - Runner: `CuratorCourseControllerTest.java`
- **TC-T1-CRS_CUR-02: Curator Track Students Progress in Course**
  - Input: `GET /api/v1/curator/courses/{id}/students`
  - Authoritative Source: `CuratorCourseController.java`
  - Expected Output: HTTP 200 OK, student list with individual lesson completion metrics.
  - Runner: `CuratorCourseControllerTest.java`
- **TC-T1-CRS_CUR-03: Curator View Detailed Lesson Submission**
  - Input: `GET /api/v1/curator/submissions/{id}`
  - Authoritative Source: `CuratorCourseController.java`
  - Expected Output: HTTP 200 OK with student answers or uploaded homework.
  - Runner: `CuratorCourseControllerTest.java`
- **TC-T1-CRS_CUR-04: Curator Provide Lesson Feedback**
  - Input: `POST /api/v1/curator/submissions/{id}/feedback` with `{ "score": 100, "comment": "Отличная работа" }`
  - Authoritative Source: `CuratorCourseController.java`
  - Expected Output: HTTP 200 OK, feedback saved and student notified.
  - Runner: `CuratorCourseControllerTest.java`
- **TC-T1-CRS_CUR-05: Curator Overall Workload Overview**
  - Input: `GET /api/v1/curator/dashboard`
  - Authoritative Source: `CuratorCourseController.java`
  - Expected Output: HTTP 200 OK with pending reviews count and active student count.
  - Runner: `CuratorCourseControllerTest.java`

### Feature 14: Real-Time Chat & Messaging (CHAT)
- **TC-T1-CHAT-01: Retrieve Available Chat Contacts for Actor**
  - Input: `GET /api/v1/chat/contacts`
  - Authoritative Source: `ChatController.java`, `ChatService.java`
  - Expected Output: HTTP 200 OK, array of permitted chat interlocutors based on role hierarchy.
  - Runner: `ChatControllerTest.java` / `tests/e2e/chat-notifications-live.mjs`
- **TC-T1-CHAT-02: Send Direct Chat Message to Another User**
  - Input: `POST /api/v1/chat/{recipientId}` with `{ "content": "Здравствуйте, прикрепил счет" }`
  - Authoritative Source: `ChatController.java`
  - Expected Output: HTTP 200 OK, message persisted with sender, recipient, timestamp, and unread flag.
  - Runner: `ChatControllerTest.java` / `tests/e2e/chat-notifications-live.mjs`
- **TC-T1-CHAT-03: Paginated Conversation History Retrieval**
  - Input: `GET /api/v1/chat/{recipientId}?page=0&size=20`
  - Authoritative Source: `ChatController.java`
  - Expected Output: HTTP 200 OK, chronologically ordered array of messages.
  - Runner: `ChatControllerTest.java`
- **TC-T1-CHAT-04: Mark Conversation Messages as Read**
  - Input: `PUT /api/v1/chat/{senderId}/read`
  - Authoritative Source: `ChatController.java`
  - Expected Output: HTTP 200 OK, `isRead` toggled to true for all incoming messages from sender.
  - Runner: `ChatControllerTest.java`
- **TC-T1-CHAT-05: Query Global Unread Chat Messages Count**
  - Input: `GET /api/v1/chat/unread`
  - Authoritative Source: `ChatController.java`
  - Expected Output: HTTP 200 OK with `unreadCount` integer.
  - Runner: `ChatControllerTest.java` / `tests/e2e/chat-notifications-live.mjs`

### Feature 15: Document Repository & Signatures (DOC)
- **TC-T1-DOC-01: Multipart Document Upload with Valid Metadata**
  - Input: `POST /api/v1/documents/upload` with PDF file and description.
  - Authoritative Source: `DocumentController.java`, `DatabaseStorageService.java`
  - Expected Output: HTTP 200 OK with document ID, file name, MIME type, and storage key.
  - Runner: `DocumentControllerTest.java` / `tests/e2e/documents-search-live.mjs`
- **TC-T1-DOC-02: Query Visible Documents for Current User**
  - Input: `GET /api/v1/documents`
  - Authoritative Source: `DocumentController.java`, `DocumentAccessService.java`
  - Expected Output: HTTP 200 OK, list of documents owned by or shared with current user.
  - Runner: `DocumentControllerTest.java`
- **TC-T1-DOC-03: Download Binary Document File Stream**
  - Input: `GET /api/v1/documents/{id}/download`
  - Authoritative Source: `DocumentController.java`
  - Expected Output: HTTP 200 OK, `Content-Disposition: attachment`, byte stream matching uploaded payload.
  - Runner: `DocumentControllerTest.java`
- **TC-T1-DOC-04: Client Confirm Electronic Signature on Document**
  - Input: `POST /api/v1/documents/{id}/confirm-signature` by client.
  - Authoritative Source: `DocumentController.java`
  - Expected Output: HTTP 200 OK, document status updated to `SIGNED`, signed timestamp recorded.
  - Runner: `DocumentControllerTest.java`
- **TC-T1-DOC-05: Delete Document Record and Storage Payload**
  - Input: `DELETE /api/v1/documents/{id}` by document owner or ADMIN.
  - Authoritative Source: `DocumentController.java`, `DatabaseStorageService.java`
  - Expected Output: HTTP 200 OK, database record removed and storage binary unlinked.
  - Runner: `DocumentControllerTest.java`

### Feature 16: Global Multi-Entity Search (SEARCH)
- **TC-T1-SEARCH-01: Multi-Entity Search by Alphanumeric Term**
  - Input: `GET /api/v1/search?q=Отчет`
  - Authoritative Source: `GlobalSearchController.java`
  - Expected Output: HTTP 200 OK, response payload containing categorized `tasks`, `clients`, and `documents`.
  - Runner: `GlobalSearchControllerTest.java` / `tests/e2e/search-lifecycle.mjs`
- **TC-T1-SEARCH-02: Cyrillic Keyword Search**
  - Input: `GET /api/v1/search?q=Аудит`
  - Authoritative Source: `GlobalSearchController.java`
  - Expected Output: HTTP 200 OK, properly decoding UTF-8 search terms matching Cyrillic titles.
  - Runner: `GlobalSearchControllerTest.java` / `tests/e2e/search-lifecycle.mjs`
- **TC-T1-SEARCH-03: Search Filtering by Exact Client BIN/IIN**
  - Input: `GET /api/v1/search?q=123456789012`
  - Authoritative Source: `GlobalSearchController.java`
  - Expected Output: HTTP 200 OK, matching client record in `clients` category.
  - Runner: `GlobalSearchControllerTest.java`
- **TC-T1-SEARCH-04: Empty Search Results for Non-Existent Term**
  - Input: `GET /api/v1/search?q=GIBBERISH_NOT_FOUND_9999`
  - Authoritative Source: `GlobalSearchController.java`
  - Expected Output: HTTP 200 OK with empty lists `{ "tasks": [], "clients": [], "documents": [] }`.
  - Runner: `GlobalSearchControllerTest.java` / `tests/e2e/search-lifecycle.mjs`
- **TC-T1-SEARCH-05: Debounced Search Input via Frontend Component**
  - Input: Keystroke simulation in `GlobalSearch.tsx` with 300ms delay.
  - Authoritative Source: `useDebounce.ts`, `GlobalSearch.test.tsx`
  - Expected Output: Only one API search dispatch made after user pauses typing.
  - Runner: `GlobalSearch.test.tsx`

### Feature 17: Notifications & Deadline Alerts (NOTIF)
- **TC-T1-NOTIF-01: List User Notifications with Pagination**
  - Input: `GET /api/v1/notifications?page=0&size=10`
  - Authoritative Source: `NotificationController.java`
  - Expected Output: HTTP 200 OK with page of notifications and `unreadCount`.
  - Runner: `NotificationControllerTest.java` / `tests/e2e/chat-notifications-live.mjs`
- **TC-T1-NOTIF-02: Mark Specific Notification as Read**
  - Input: `PATCH /api/v1/notifications/{id}/read`
  - Authoritative Source: `NotificationController.java`
  - Expected Output: HTTP 200 OK, notification `read` flag set to true.
  - Runner: `NotificationControllerTest.java`
- **TC-T1-NOTIF-03: Mark All User Notifications as Read**
  - Input: `POST /api/v1/notifications/read-all`
  - Authoritative Source: `NotificationController.java`
  - Expected Output: HTTP 200 OK, all unread notifications for user updated, unread count reset to 0.
  - Runner: `NotificationControllerTest.java`
- **TC-T1-NOTIF-04: Deadline Alert Scheduled Dispatch Verification**
  - Input: Invocation of `DeadlineAlertScheduler.checkDeadlines()`.
  - Authoritative Source: `DeadlineAlertScheduler.java`
  - Expected Output: Tasks due within 24h generate in-app notifications and set `deadlineNotifiedAt`.
  - Runner: `DeadlineAlertSchedulerTest.java`
- **TC-T1-NOTIF-05: Telegram Notification Payload Escaping**
  - Input: Invocations with special MarkdownV2 characters `_ * [ ] ( ) ~ > # + - = | { } . !`
  - Authoritative Source: `TelegramNotifierService.java`
  - Expected Output: All characters escaped with backslashes; message safely dispatched without 400 Bad Request from Telegram.
  - Runner: `TelegramNotifierServiceTest.java`

### Feature 18: Calendar & Event Scheduling (CAL)
- **TC-T1-CAL-01: Create CRM Calendar Event**
  - Input: `POST /api/v1/crm/calendar/events` with `{ "title": "Встреча по аудиту", "startTime": "2026-11-01T10:00:00Z", "endTime": "2026-11-01T11:00:00Z" }`
  - Authoritative Source: `CalendarController.java`
  - Expected Output: HTTP 200 OK with event ID and creator association.
  - Runner: `CalendarControllerTest.java`
- **TC-T1-CAL-02: Query Calendar Events in Date Window**
  - Input: `GET /api/v1/crm/calendar/events?start=2026-11-01T00:00:00Z&end=2026-11-30T23:59:59Z`
  - Authoritative Source: `CalendarController.java`
  - Expected Output: HTTP 200 OK with list of scheduled events within the range.
  - Runner: `CalendarControllerTest.java`
- **TC-T1-CAL-03: Update Existing Calendar Event Time**
  - Input: `PUT /api/v1/crm/calendar/events/{id}` with modified `endTime`.
  - Authoritative Source: `CalendarController.java`
  - Expected Output: HTTP 200 OK, persisted schedule updated.
  - Runner: `CalendarControllerTest.java`
- **TC-T1-CAL-04: Delete Calendar Event by Owner**
  - Input: `DELETE /api/v1/crm/calendar/events/{id}`
  - Authoritative Source: `CalendarController.java`
  - Expected Output: HTTP 200 OK, event deleted from database.
  - Runner: `CalendarControllerTest.java`
- **TC-T1-CAL-05: Calendar Event Association with Task ID**
  - Input: `POST /api/v1/crm/calendar/events` with optional `taskId: 1`.
  - Authoritative Source: `CalendarController.java`
  - Expected Output: HTTP 200 OK, foreign key link to task established.
  - Runner: `CalendarControllerTest.java`

---

## 3. Tier 2: Boundary, Corner & Adversarial Cases

### Feature 1: Authentication & Session (AUTH)
- **TC-T2-AUTH-01: Login with Incorrect Password Rejection**
  - Input: `POST /api/v1/auth/login` with valid email but invalid password.
  - Expected Output: HTTP 401 Unauthorized with standard error envelope (`success: false`).
  - Runner: `AuthControllerTest.java`
- **TC-T2-AUTH-02: Login Attempt by Unapproved (Pending) Employee Account**
  - Input: `POST /api/v1/auth/login` for employee registered but not yet approved by Admin (`enabled = false`).
  - Expected Output: HTTP 403 Forbidden or 401 Unauthorized with message indicating account approval required.
  - Runner: `AuthControllerTest.java`
- **TC-T2-AUTH-03: Duplicate Registration Rejection (Email Collision)**
  - Input: `POST /api/v1/auth/register` with an already-registered email.
  - Expected Output: HTTP 409 Conflict with clear error message.
  - Runner: `AuthControllerTest.java`
- **TC-T2-AUTH-04: Password Reset with Expired or Corrupted Token**
  - Input: `POST /api/v1/auth/reset-password` with token expired >24 hours.
  - Expected Output: HTTP 400 Bad Request (`Invalid or expired reset token`).
  - Runner: `AuthControllerTest.java`
- **TC-T2-AUTH-05: Rate Limit Throttling on Authentication Endpoints**
  - Input: 11 rapid login attempts within 60 seconds from same IP.
  - Expected Output: 11th request receives HTTP 429 Too Many Requests (Bucket4j limit).
  - Runner: `tests/e2e/rate-limit-lifecycle.mjs`

### Feature 2: Two-Factor TOTP Authentication (2FA)
- **TC-T2-2FA-01: Non-Admin Role Attempting to Access 2FA Setup**
  - Input: `GET /api/v1/auth/2fa/setup` with EMPLOYEE or CLIENT token.
  - Expected Output: HTTP 403 Forbidden (`@PreAuthorize("hasRole('ADMIN')")`).
  - Runner: `TwoFactorControllerTest.java` / `tests/e2e/2fa-lifecycle.mjs`
- **TC-T2-2FA-02: 2FA Confirmation with Invalid 6-Digit Code**
  - Input: `POST /api/v1/auth/2fa/setup/confirm` with code `000000`.
  - Expected Output: HTTP 400 Bad Request (`Invalid two-factor code`).
  - Runner: `TwoFactorControllerTest.java`
- **TC-T2-2FA-03: Verification Attempt with Forged Pre-Auth Token**
  - Input: `POST /api/v1/auth/2fa/verify` with random UUID `00000000-0000-0000-0000-000000000000`.
  - Expected Output: HTTP 401 Unauthorized or 400 Bad Request.
  - Runner: `TwoFactorControllerTest.java` / `tests/e2e/2fa-lifecycle.mjs`
- **TC-T2-2FA-04: Replay Attack: Re-using Already Verified TOTP Code**
  - Input: Submitting the same TOTP code twice within the same 30s window.
  - Expected Output: Second attempt rejected to prevent replay attacks.
  - Runner: `TwoFactorServiceTest.java`
- **TC-T2-2FA-05: Two-Factor Disable Attempt with Wrong Code**
  - Input: `POST /api/v1/auth/2fa/disable` with incorrect code.
  - Expected Output: HTTP 400 Bad Request, 2FA status remains enabled.
  - Runner: `TwoFactorControllerTest.java`

### Feature 3: User Profile & Credentials (USER)
- **TC-T2-USER-01: Password Change with Mismatched Current Password**
  - Input: `PUT /api/v1/users/me/password` with wrong `currentPassword`.
  - Expected Output: HTTP 401 Unauthorized or 400 Bad Request, password not changed.
  - Runner: `UserControllerTest.java`
- **TC-T2-USER-02: Update Profile with Malformed Email Format**
  - Input: `PUT /api/v1/users/me` with `email: "not-an-email"`.
  - Expected Output: HTTP 400 Bad Request with Jakarta validation constraint violation.
  - Runner: `UserControllerTest.java`
- **TC-T2-USER-03: Unsupported Avatar MIME Type Rejection**
  - Input: `POST /api/v1/users/me/avatar` with executable file (`malware.exe`).
  - Expected Output: HTTP 400 Bad Request (`Invalid file format. Only JPEG, PNG, WEBP allowed`).
  - Runner: `UserControllerTest.java`
- **TC-T2-USER-04: Avatar Upload Size Exceeding Maximum Limit**
  - Input: `POST /api/v1/users/me/avatar` with file > 10MB.
  - Expected Output: HTTP 413 Payload Too Large or 400 Bad Request.
  - Runner: `UserControllerTest.java`
- **TC-T2-USER-05: IDOR Attempt: Accessing Another User's Profile via Mutation**
  - Input: Client attempts to modify fields not owned by them.
  - Expected Output: Only current principal's data mutated; foreign records untouched.
  - Runner: `UserControllerTest.java`

### Feature 4: Administration & Governance (ADMIN)
- **TC-T2-ADMIN-01: Non-Admin Accessing Admin Endpoints**
  - Input: `GET /api/v1/admin/employees` with EMPLOYEE or CLIENT token.
  - Expected Output: HTTP 403 Forbidden.
  - Runner: `AdminControllerTest.java` / `tests/e2e/idor-live.mjs`
- **TC-T2-ADMIN-02: Approving Already Approved Employee**
  - Input: `POST /api/v1/admin/employees/{id}/approve` on active user.
  - Expected Output: HTTP 400 Bad Request or idempotent 200 OK without duplication.
  - Runner: `AdminControllerTest.java`
- **TC-T2-ADMIN-03: Non-Existent Employee ID for Governance Operations**
  - Input: `POST /api/v1/admin/employees/999999/approve`
  - Expected Output: HTTP 404 Not Found (`User not found`).
  - Runner: `AdminControllerTest.java`
- **TC-T2-ADMIN-04: Soft Delete Admin User Protection**
  - Input: `DELETE /api/v1/admin/employees/{adminId}` targeting root admin.
  - Expected Output: HTTP 400 Bad Request (`Cannot delete root administrator`).
  - Runner: `AdminControllerTest.java`
- **TC-T2-ADMIN-05: Promoting Non-Employee to Advisor Role**
  - Input: `POST /api/v1/admin/employees/{clientId}/promote-to-advisor`
  - Expected Output: HTTP 400 Bad Request (`Only employees can be promoted to advisor`).
  - Runner: `AdminControllerTest.java`

### Feature 5: CRM Task Management (TASK)
- **TC-T2-TASK-01: ADVISOR Role Forbidden from Mutating Tasks**
  - Input: `PUT /api/v1/crm/tasks/{id}` with ADVISOR token.
  - Expected Output: HTTP 403 Forbidden (`ADVISOR has read-only access`).
  - Runner: `TaskControllerTest.java` / `tests/e2e/advisor-readonly-lifecycle.mjs`
- **TC-T2-TASK-02: IDOR: Employee Mutating Task Assigned to Another Employee**
  - Input: `PUT /api/v1/crm/tasks/{id}` by Employee B on task assigned exclusively to Employee A.
  - Expected Output: HTTP 403 Forbidden (`CrmAccessService.assertCanModifyTask`).
  - Runner: `TaskControllerTest.java` / `tests/e2e/idor-live.mjs`
- **TC-T2-TASK-03: Non-Existent Stage ID in Transition**
  - Input: `PATCH /api/v1/crm/tasks/{id}/stage?stageId=999999`
  - Expected Output: HTTP 400 Bad Request or 404 Not Found (`Stage does not exist`).
  - Runner: `TaskControllerTest.java`
- **TC-T2-TASK-04: Rollback Verification on Partial Batch Update Failure**
  - Input: `POST /api/v1/crm/tasks/batch` containing a valid task ID and an invalid task ID.
  - Expected Output: Transaction rolls back; no partial corrupted state persisted.
  - Runner: `TaskServiceTest.java`
- **TC-T2-TASK-05: Reopening LOST Task Auto-Assignment**
  - Input: Moving task from LOST stage back to active pool.
  - Expected Output: Task automatically assigned to the first OPEN stage of the pipeline.
  - Runner: `TaskServiceTest.java`

### Feature 6: CRM Client Management (CLIENT)
- **TC-T2-CLIENT-01: IDOR: Client Reading Other Client's Profile**
  - Input: Client A requests `GET /api/v1/crm/clients/{clientB_Id}`.
  - Expected Output: HTTP 403 Forbidden (`CrmAccessService.assertCanReadClient`).
  - Runner: `ClientControllerTest.java` / `tests/e2e/idor-live.mjs`
- **TC-T2-CLIENT-02: Client Attempting to Create or Delete Clients**
  - Input: `POST /api/v1/crm/clients` or `DELETE /api/v1/crm/clients/{id}` with CLIENT token.
  - Expected Output: HTTP 403 Forbidden.
  - Runner: `ClientControllerTest.java`
- **TC-T2-CLIENT-03: Duplicate BIN/IIN Registration**
  - Input: Creating client with duplicate 12-digit BIN/IIN.
  - Expected Output: HTTP 400 Bad Request or 409 Conflict.
  - Runner: `ClientControllerTest.java`
- **TC-T2-CLIENT-04: Assigning Non-Existent Employee to Client**
  - Input: `POST /api/v1/crm/clients/{id}/assign?employeeId=999999`
  - Expected Output: HTTP 404 Not Found (`Employee not found`).
  - Runner: `ClientControllerTest.java`
- **TC-T2-CLIENT-05: Extreme Payload Strings in Company Name**
  - Input: Company name with 500 characters, Unicode symbols, and SQL meta-characters (`' OR 1=1;--`).
  - Expected Output: Safely parameterized query, rejected or safely stored without SQL injection.
  - Runner: `ClientControllerTest.java`

### Feature 7: Dashboard Analytics (DASH)
- **TC-T2-DASH-01: Employee Dashboard Isolation**
  - Input: `GET /api/v1/crm/dashboard/employee` for Employee A.
  - Expected Output: Metrics calculate only tasks where `assignedTo.id == employeeA.id`.
  - Runner: `DashboardServiceTest.java`
- **TC-T2-DASH-02: Null Safety on Empty Pipelines**
  - Input: Invoking `getAdminDashboard()` on a system with 0 tasks and 0 pipelines.
  - Expected Output: HTTP 200 OK with 0 values; zero `NullPointerException` thrown.
  - Runner: `DashboardServiceTest.java`
- **TC-T2-DASH-03: Negative Amounts in Revenue Aggregation**
  - Input: Pipeline contains tasks with negative expected amounts.
  - Expected Output: Mathematical safety; no arithmetic overflow or crash.
  - Runner: `DashboardServiceTest.java`
- **TC-T2-DASH-04: Client Forbidden from Admin Dashboard**
  - Input: `GET /api/v1/crm/dashboard/admin` with CLIENT token.
  - Expected Output: HTTP 403 Forbidden.
  - Runner: `DashboardControllerTest.java`
- **TC-T2-DASH-05: Case-Insensitive Column Mapping in Repository Aggregations**
  - Input: Aggregation query returning mixed-case column aliases (`empid`, `TASKCOUNT`).
  - Expected Output: Correct parsing into `EmployeeWorkloadDto` without missing data.
  - Runner: `DashboardServiceTest.java`

### Feature 8: Pipelines & Stages (PIPE)
- **TC-T2-PIPE-01: Employee Forbidden from Pipeline CRUD**
  - Input: `POST /api/v1/crm/pipelines` with EMPLOYEE token.
  - Expected Output: HTTP 403 Forbidden (`hasRole('ADMIN')`).
  - Runner: `PipelineControllerTest.java`
- **TC-T2-PIPE-02: Deleting Stage with Existing Active Tasks**
  - Input: `DELETE /api/v1/crm/pipelines/{pId}/stages/{stageId}` containing 10 active tasks.
  - Expected Output: HTTP 400 Bad Request (`Cannot delete stage containing active tasks`).
  - Runner: `PipelineControllerTest.java`
- **TC-T2-PIPE-03: Duplicate Stage Order Index**
  - Input: Creating stage with identical `orderIndex` to existing stage.
  - Expected Output: Automatic re-indexing or HTTP 400 Bad Request.
  - Runner: `PipelineControllerTest.java`
- **TC-T2-PIPE-04: Creating Stage Under Non-Existent Pipeline**
  - Input: `POST /api/v1/crm/pipelines/999999/stages`
  - Expected Output: HTTP 404 Not Found (`Pipeline not found`).
  - Runner: `PipelineControllerTest.java`
- **TC-T2-PIPE-05: Empty Pipeline Name Validation**
  - Input: `POST /api/v1/crm/pipelines` with `{ "name": "" }`
  - Expected Output: HTTP 400 Bad Request with validation error.
  - Runner: `PipelineControllerTest.java`

### Feature 9: Billing & Invoicing (INVOICE)
- **TC-T2-INVOICE-01: IDOR: Client Reading Another Client's Invoice**
  - Input: Client A requests `GET /api/v1/billing/invoices/{clientB_InvoiceId}`.
  - Expected Output: HTTP 403 Forbidden (`InvoiceAccessService`).
  - Runner: `InvoiceControllerTest.java` / `tests/e2e/idor-live.mjs`
- **TC-T2-INVOICE-02: Client Attempting to Create or Delete Invoices**
  - Input: `POST /api/v1/billing/invoices` with CLIENT token.
  - Expected Output: HTTP 403 Forbidden.
  - Runner: `InvoiceControllerTest.java`
- **TC-T2-INVOICE-03: Invalid Invoice Status Transition**
  - Input: `PUT /api/v1/billing/invoices/{id}` with `{ "status": "INVALID_STATUS" }`
  - Expected Output: HTTP 400 Bad Request with enum validation failure.
  - Runner: `InvoiceControllerTest.java`
- **TC-T2-INVOICE-04: PDF Generation for Non-Existent Invoice**
  - Input: `GET /api/v1/billing/invoices/999999/pdf`
  - Expected Output: HTTP 404 Not Found.
  - Runner: `InvoiceControllerTest.java`
- **TC-T2-INVOICE-05: Missing Font Fallback in Cyrillic PDF Rendering**
  - Input: Rendering invoice PDF when `/fonts/arial.ttf` is absent from classpath.
  - Expected Output: Clean fallback to default standard font; no crash or 500 error.
  - Runner: `PdfGeneratorServiceTest.java`

### Feature 10: Subscriptions (SUB)
- **TC-T2-SUB-01: Overlapping Subscription Date Ranges**
  - Input: Creating subscription for same client/service overlapping an active date range.
  - Expected Output: HTTP 409 Conflict (`Overlapping subscription period detected`).
  - Runner: `SubscriptionControllerTest.java`
- **TC-T2-SUB-02: End Date Preceding Start Date**
  - Input: Subscription with `startDate: "2026-12-01"`, `endDate: "2026-01-01"`.
  - Expected Output: HTTP 400 Bad Request (`End date must be after start date`).
  - Runner: `SubscriptionControllerTest.java`
- **TC-T2-SUB-03: Negative Monthly Fee**
  - Input: Subscription with `monthlyFee: -500.0`.
  - Expected Output: HTTP 400 Bad Request (`Monthly fee must be positive`).
  - Runner: `SubscriptionControllerTest.java`
- **TC-T2-SUB-04: Non-Existent Client ID**
  - Input: `POST /api/v1/billing/subscriptions` with `clientId: 999999`.
  - Expected Output: HTTP 404 Not Found.
  - Runner: `SubscriptionControllerTest.java`
- **TC-T2-SUB-05: IDOR: Client Modifying Subscription**
  - Input: `PUT /api/v1/billing/subscriptions/{id}` with CLIENT token.
  - Expected Output: HTTP 403 Forbidden.
  - Runner: `SubscriptionControllerTest.java`

### Feature 11: LMS Admin (CRS_ADMIN)
- **TC-T2-CRS_ADMIN-01: Non-Admin Access to Admin Course Management**
  - Input: `POST /api/v1/admin/courses` with LEARNER or EMPLOYEE token.
  - Expected Output: HTTP 403 Forbidden.
  - Runner: `AdminCourseControllerTest.java`
- **TC-T2-CRS_ADMIN-02: Adding Lesson to Non-Existent Chapter**
  - Input: `POST /api/v1/admin/courses/999999/lessons`
  - Expected Output: Automatic fallback to "Default Chapter" or 404 Not Found.
  - Runner: `LessonServiceTest.java`
- **TC-T2-CRS_ADMIN-03: Malformed Video URL in Lesson Payload**
  - Input: Lesson with `videoUrl: "javascript:alert(1)"`.
  - Expected Output: Input sanitization or HTTP 400 Bad Request.
  - Runner: `AdminCourseControllerTest.java`
- **TC-T2-CRS_ADMIN-04: Duplicate Chapter Order Index Handling**
  - Input: Creating chapter with existing order index.
  - Expected Output: Re-indexing or unique order preservation.
  - Runner: `LessonServiceTest.java`
- **TC-T2-CRS_ADMIN-05: Deleting Lesson Cleans Up Student Progress**
  - Input: Deleting lesson that has 50 student completion records.
  - Expected Output: Cascading deletion in `lesson_progress`; no foreign key violation.
  - Runner: `LessonServiceTest.java`

### Feature 12: LMS Learner (CRS_LRN)
- **TC-T2-CRS_LRN-01: Learner Accessing Unpublished Draft Course**
  - Input: `GET /api/v1/courses/{unpublishedCourseId}` with LEARNER token.
  - Expected Output: HTTP 404 Not Found or 403 Forbidden.
  - Runner: `LearnerCourseControllerTest.java`
- **TC-T2-CRS_LRN-02: Idempotent Lesson Completion**
  - Input: Calling `completeLesson` on an already-completed lesson.
  - Expected Output: HTTP 200 OK without duplicate rows in `lesson_progress`.
  - Runner: `LearnerCourseControllerTest.java` / `tests/e2e/lms-lifecycle-live.mjs`
- **TC-T2-CRS_LRN-03: Certificate Generation Gate Before 100% Completion**
  - Input: Requesting certificate when course progress is at 80%.
  - Expected Output: HTTP 400 Bad Request (`Course not fully completed`).
  - Runner: `CertificateGeneratorServiceTest.java`
- **TC-T2-CRS_LRN-04: Non-Existent Certificate Verification Code**
  - Input: `GET /api/v1/courses/certificates/verify/FAKE-CODE-999`
  - Expected Output: HTTP 404 Not Found (`Certificate not found`).
  - Runner: `LearnerCourseControllerTest.java`
- **TC-T2-CRS_LRN-05: Duplicate Certificate Generation Prevention**
  - Input: Triggering certificate generation twice for completed course.
  - Expected Output: Returns existing certificate code; does not create duplicate record.
  - Runner: `CertificateGeneratorServiceTest.java`

### Feature 13: LMS Curator (CRS_CUR)
- **TC-T2-CRS_CUR-01: Non-Curator Access to Curator Endpoints**
  - Input: `GET /api/v1/curator/courses` with LEARNER token.
  - Expected Output: HTTP 403 Forbidden.
  - Runner: `CuratorCourseControllerTest.java`
- **TC-T2-CRS_CUR-02: Curator Accessing Course Not Assigned to Them**
  - Input: `GET /api/v1/curator/courses/{unassignedId}/students`
  - Expected Output: HTTP 403 Forbidden.
  - Runner: `CuratorCourseControllerTest.java`
- **TC-T2-CRS_CUR-03: Feedback Submission for Non-Existent Submission**
  - Input: `POST /api/v1/curator/submissions/999999/feedback`
  - Expected Output: HTTP 404 Not Found.
  - Runner: `CuratorCourseControllerTest.java`
- **TC-T2-CRS_CUR-04: Invalid Score Boundaries (e.g. Negative Score)**
  - Input: Submitting feedback with `score: -10` or `score: 150`.
  - Expected Output: HTTP 400 Bad Request (`Score must be between 0 and 100`).
  - Runner: `CuratorCourseControllerTest.java`
- **TC-T2-CRS_CUR-05: Curator Modifying Course Structure**
  - Input: Curator attempting to delete chapters or lessons.
  - Expected Output: HTTP 403 Forbidden (read-only / feedback scope).
  - Runner: `CuratorCourseControllerTest.java`

### Feature 14: Real-Time Chat (CHAT)
- **TC-T2-CHAT-01: WebSocket Handshake Without Bearer Token**
  - Input: STOMP CONNECT command with no Authorization header.
  - Expected Output: ChannelInterceptor rejects with `IllegalArgumentException("Unauthorized...")`.
  - Runner: `WebSocketAclTest.java`
- **TC-T2-CHAT-02: WebSocket Handshake with Expired JWT**
  - Input: STOMP CONNECT command with expired token.
  - Expected Output: Connection rejected; handshake fails.
  - Runner: `WebSocketAclTest.java`
- **TC-T2-CHAT-03: Client Subscribing to Foreign User Channel**
  - Input: Client A subscribes to `/topic/chat/{clientB_UserId}`.
  - Expected Output: Subscription rejected with `IllegalArgumentException("Forbidden")`.
  - Runner: `WebSocketAclTest.java`
- **TC-T2-CHAT-04: Client Attempting to Message Unauthorized Counterparty**
  - Input: Client attempts to message an unassigned external employee.
  - Expected Output: HTTP 403 Forbidden (`AccessDeniedException`).
  - Runner: `ChatServiceTest.java`
- **TC-T2-CHAT-05: Empty Chat Message Content**
  - Input: `POST /api/v1/chat/{id}` with `{ "content": "   " }`.
  - Expected Output: HTTP 400 Bad Request (`Message cannot be empty`).
  - Runner: `ChatControllerTest.java`

### Feature 15: Document Management (DOC)
- **TC-T2-DOC-01: Path Traversal in Storage Retrieval**
  - Input: Retrieval request with storage key `../../../../etc/passwd` or `..\..\..\windows\win.ini`.
  - Expected Output: Path traversal sanitized; HTTP 400 Bad Request or 404 Not Found.
  - Runner: `DatabaseStorageServiceTest.java`, `LocalStoragePathTraversalTest.java`
- **TC-T2-DOC-02: MIME Spoofing Rejection (Executable Renamed as PDF)**
  - Input: Uploading executable binary with header `MZ` but renamed to `invoice.pdf`.
  - Expected Output: Tika MIME detection detects `application/x-dosexec`; HTTP 400 Bad Request.
  - Runner: `DocumentControllerTest.java`
- **TC-T2-DOC-03: IDOR: Client Downloading Other Client's Private Document**
  - Input: Client A requests `GET /api/v1/documents/{clientB_DocId}/download`.
  - Expected Output: HTTP 403 Forbidden (`DocumentAccessService`).
  - Runner: `DocumentControllerTest.java` / `tests/e2e/idor-live.mjs`
- **TC-T2-DOC-04: ADVISOR Role Forbidden from Deleting Documents**
  - Input: `DELETE /api/v1/documents/{id}` with ADVISOR token.
  - Expected Output: HTTP 403 Forbidden.
  - Runner: `DocumentControllerTest.java` / `tests/e2e/advisor-readonly-lifecycle.mjs`
- **TC-T2-DOC-05: Empty File Upload Rejection**
  - Input: `POST /api/v1/documents/upload` with 0-byte file payload.
  - Expected Output: HTTP 400 Bad Request (`File cannot be empty`).
  - Runner: `DocumentControllerTest.java`

### Feature 16: Global Search (SEARCH)
- **TC-T2-SEARCH-01: Empty Search Query Validation**
  - Input: `GET /api/v1/search?q=`
  - Expected Output: HTTP 400 Bad Request (`Query parameter cannot be blank`).
  - Runner: `GlobalSearchControllerTest.java`
- **TC-T2-SEARCH-02: Search Query Exceeding Maximum Length**
  - Input: `GET /api/v1/search?q=` with 1000 characters.
  - Expected Output: HTTP 400 Bad Request or safely truncated search without database error.
  - Runner: `GlobalSearchControllerTest.java`
- **TC-T2-SEARCH-03: Client IDOR in Search Results**
  - Input: Client searches for a term present in another client's task.
  - Expected Output: Search results contain only tasks where `clientId == currentClient.id`.
  - Runner: `GlobalSearchControllerTest.java` / `tests/e2e/search-lifecycle.mjs`
- **TC-T2-SEARCH-04: SQL Injection in Search Input**
  - Input: `GET /api/v1/search?q=' OR '1'='1`
  - Expected Output: Safely parameterized; returns 0 matches or literal match; no database error.
  - Runner: `GlobalSearchControllerTest.java`
- **TC-T2-SEARCH-05: HTML / Script Injection in Search Input**
  - Input: `GET /api/v1/search?q=<script>alert(1)</script>`
  - Expected Output: Input escaped in JSON response; no XSS payload execution.
  - Runner: `GlobalSearchControllerTest.java`

### Feature 17: Notifications & Alerts (NOTIF)
- **TC-T2-NOTIF-01: IDOR: Marking Other User's Notification as Read**
  - Input: User A attempts `PATCH /api/v1/notifications/{userB_NotifId}/read`.
  - Expected Output: HTTP 404 Not Found or 403 Forbidden.
  - Runner: `NotificationControllerTest.java`
- **TC-T2-NOTIF-02: Telegram API 429 Too Many Requests Handling**
  - Input: Simulating HTTP 429 from `api.telegram.org`.
  - Expected Output: Graceful degradation; error logged without breaking business transactions.
  - Runner: `TelegramNotifierServiceTest.java`
- **TC-T2-NOTIF-03: Deadline Alert for Task with Null Assignee**
  - Input: Task reaches deadline but `assignedTo` is null (pool task).
  - Expected Output: Scheduler skips task without `NullPointerException`.
  - Runner: `DeadlineAlertSchedulerTest.java`
- **TC-T2-NOTIF-04: Duplicate Deadline Alert Prevention**
  - Input: Running scheduler twice in immediate succession.
  - Expected Output: `deadlineNotifiedAt` prevents sending duplicate alerts.
  - Runner: `DeadlineAlertSchedulerTest.java`
- **TC-T2-NOTIF-05: Non-Existent Notification ID**
  - Input: `PATCH /api/v1/notifications/999999/read`
  - Expected Output: HTTP 404 Not Found.
  - Runner: `NotificationControllerTest.java`

### Feature 18: Calendar & Scheduling (CAL)
- **TC-T2-CAL-01: IDOR: Deleting Another User's Calendar Event**
  - Input: User A attempts `DELETE /api/v1/crm/calendar/events/{userB_EventId}`.
  - Expected Output: HTTP 403 Forbidden (`AccessDeniedException`).
  - Runner: `CalendarControllerTest.java`
- **TC-T2-CAL-02: Invalid Date Range in Query (Start After End)**
  - Input: `GET /api/v1/crm/calendar/events?start=2026-12-01&end=2026-01-01`
  - Expected Output: HTTP 400 Bad Request.
  - Runner: `CalendarControllerTest.java`
- **TC-T2-CAL-03: Overlapping Event Slot Warning / Conflict Handling**
  - Input: Creating conflicting event for same employee at identical hour.
  - Expected Output: Proper scheduling conflict notification or handling.
  - Runner: `CalendarControllerTest.java`
- **TC-T2-CAL-04: Event End Time Preceding Start Time**
  - Input: `POST /api/v1/crm/calendar/events` with `startTime > endTime`.
  - Expected Output: HTTP 400 Bad Request.
  - Runner: `CalendarControllerTest.java`
- **TC-T2-CAL-05: Non-Existent Task Association**
  - Input: `POST /api/v1/crm/calendar/events` with `taskId: 999999`.
  - Expected Output: HTTP 404 Not Found or 400 Bad Request.
  - Runner: `CalendarControllerTest.java`

---

## 4. Tier 3: Cross-Feature Combinations

- **TC-T3-01: CRM Task Completion -> Billing Invoice Trigger -> In-App Notification**
  - Workflow: Task reaches WON stage -> Invoice generated for task client -> In-app notification sent to client.
  - Assertions: Invoice status ISSUED; notification appears in client's notification drawer.
  - Runner: `tests/e2e/crm-lifecycle-live.mjs`
- **TC-T3-02: Client Registration -> Admin Verification -> Notification Dispatch**
  - Workflow: Client registers via public endpoint -> Admin receives pending notice -> Client profile active.
  - Assertions: User record active, client profile linked with matching BIN/IIN.
  - Runner: `tests/e2e/auth-helper.mjs`
- **TC-T3-03: Employee Registration -> Admin Approval -> Credential Activation -> Task Pool Access**
  - Workflow: Employee registers -> Admin approves via `/api/v1/admin/employees/{id}/approve` -> Employee logs in -> Claims task from pool.
  - Assertions: Task `assignedTo` updated from null to employee ID.
  - Runner: `tests/e2e/auth-helper.mjs`, `tests/e2e/crm-lifecycle-live.mjs`
- **TC-T3-04: Course Completion -> Certificate Generation -> Public Verification Link**
  - Workflow: Learner marks all lessons complete -> Progress hits 100% -> Certificate PDF generated -> Public verify endpoint checks code.
  - Assertions: Public verify endpoint returns matching student and course names without authentication.
  - Runner: `tests/e2e/lms-lifecycle-live.mjs`
- **TC-T3-05: Task Document Attachment -> Storage Persistence -> Client Digital Signature**
  - Workflow: Employee uploads contract PDF to task -> Client views task -> Client clicks confirm signature.
  - Assertions: Document status transitions to `SIGNED`; audit log reflects signature.
  - Runner: `tests/e2e/documents-search-live.mjs`
- **TC-T3-06: Real-Time Chat Message -> Unread Increment -> Notification Bell Update**
  - Workflow: Employee sends chat message to Client -> Client `/api/v1/chat/unread` increments -> Notification badge reflects unread count.
  - Assertions: STOMP message received, unread count = 1.
  - Runner: `tests/e2e/chat-notifications-live.mjs`
- **TC-T3-07: Task Reassignment Dispute -> Pool Return -> Re-claim Workflow**
  - Workflow: Employee requests reassignment -> Admin approves -> Task returns to pool (`assignedTo = null`) -> Another employee claims task.
  - Assertions: Previous employee cannot modify task; new employee possesses edit rights.
  - Runner: `tests/e2e/crm-lifecycle-live.mjs`
- **TC-T3-08: Global Search Indexing on Entity Creation**
  - Workflow: Admin creates client "КазБухгалтер" -> Task "Годовой баланс" -> Document "Баланс.pdf".
  - Assertions: `GET /api/v1/search?q=Баланс` returns both the task and document in categorized lists.
  - Runner: `tests/e2e/search-lifecycle.mjs`
- **TC-T3-09: Two-Factor Authentication Enablement -> Enforced Challenge on Subsequent Login**
  - Workflow: Admin enables 2FA -> Logs out -> Submits email/password -> Receives `preAuthToken` -> Submits TOTP code -> Receives JWT.
  - Assertions: Direct login without TOTP code fails with challenge.
  - Runner: `tests/e2e/2fa-lifecycle.mjs`
- **TC-T3-10: ADVISOR Role Promotion -> Read-Only Boundary Enforcement**
  - Workflow: Employee promoted to ADVISOR -> Attempts task update -> Receives 403 -> Queries analytics dashboard -> Receives 200.
  - Assertions: All mutation routes strictly reject with 403; read routes succeed with 200.
  - Runner: `tests/e2e/advisor-readonly-lifecycle.mjs`
- **TC-T3-11: Subscription Expiration -> Invoice Overdue State**
  - Workflow: Client subscription expires -> Automated check runs -> Generates renewal invoice with OVERDUE alert.
  - Assertions: Client dashboard displays overdue alert banner.
  - Runner: `tests/e2e/billing-invoices-live.mjs`
- **TC-T3-12: Document Upload -> MIME Enforcement -> Task Association**
  - Workflow: User uploads valid PDF -> Associates with CRM Task #1.
  - Assertions: Task document list contains the uploaded file with downloadable URL.
  - Runner: `tests/e2e/documents-search-live.mjs`
- **TC-T3-13: Calendar Event Creation Linked to CRM Task**
  - Workflow: Employee schedules meeting linked to `taskId: 1` -> Task detail displays calendar appointment.
  - Assertions: Event start/end times appear in task timeline.
  - Runner: `CalendarControllerTest.java`
- **TC-T3-14: Deadline Alert Scheduler -> Telegram Bot Notification Dispatch**
  - Workflow: Task deadline approaches -> Scheduler identifies task -> Dispatches formatted Telegram message.
  - Assertions: MarkdownV2 payload properly escaped; admin chat receives alert.
  - Runner: `DeadlineAlertSchedulerTest.java`, `TelegramNotifierServiceTest.java`
- **TC-T3-15: Locale Switch in Settings -> Translated Response Validation**
  - Workflow: User updates locale to Kazakh (`kk`) -> Fetches task statuses.
  - Assertions: Task status badges and notification titles reflect authentic Kazakh terminology.
  - Runner: `notificationTranslator.test.ts`, `taskTranslator.test.ts`
- **TC-T3-16: Contact Form WhatsApp Fallback Verification (Rule 13 Compliance)**
  - Workflow: Visitor enters contact info -> Form triggers WhatsApp link generation -> Backend API remains untouched.
  - Assertions: WhatsApp link targets `+77750584021` with URL-encoded parameters; no HTTP request sent to backend.
  - Runner: `ContactForm.test.tsx`, `useContactForm.test.ts`

---

## 4. Tier 4: Real-World Application Scenarios

### Scenario 1: Complete Client Onboarding to Invoice Settlement Lifecycle
- **Actors**: Admin, Employee, Client.
- **Workflow**:
  1. Client registers self via public registration portal (`POST /api/v1/auth/register`).
  2. Admin reviews pending clients, assigns dedicated Employee A (`POST /api/v1/crm/clients/{id}/assign`).
  3. Employee A creates onboarding Task "Первичная документация" in Pipeline 1 (`POST /api/v1/crm/tasks`).
  4. Employee A moves task across stages: NEW -> IN_PROGRESS -> PENDING_CLIENT -> WON (`PATCH /stage`).
  5. Upon reaching WON, Employee A issues monthly bookkeeping Invoice for 150,000 KZT (`POST /api/v1/billing/invoices`).
  6. Client logs in, views issued invoice on client dashboard, and downloads invoice PDF (`GET /invoices/{id}/pdf`).
  7. Client makes payment; Admin updates invoice status to PAID (`PUT /invoices/{id}`).
  8. Client verifies zero outstanding balance on client overview page.
- **Authoritative Source**: `PROJECT.md § Milestones`, `TEST_COVERAGE_PLAN.md § 3`
- **Verification Runner**: `tests/e2e/authenticated-journeys-live.mjs`, `tests/e2e/billing-invoices-live.mjs`

### Scenario 2: Employee Recruitment, Onboarding, Task Claiming & Rejection Workflow
- **Actors**: Admin, Employee Candidate, Existing Employee.
- **Workflow**:
  1. Candidate registers with role `EMPLOYEE` (`POST /api/v1/auth/register`).
  2. Candidate attempts immediate login; rejected with 403 (unapproved).
  3. Admin inspects `/api/v1/admin/employees/pending`, verifies qualifications, and approves account.
  4. Candidate logs in successfully, receives JWT, and accesses Employee Dashboard.
  5. Employee browses unassigned Task Pool (`GET /api/v1/crm/tasks/pool`).
  6. Employee claims Task #42 from the pool (`PATCH /assignee`).
  7. During execution, employee discovers client tax discrepancy and submits formal task rejection with explanation.
  8. Admin reviews rejection reason in rejection drawer, approves rejection, and returns task to pool.
- **Authoritative Source**: `PROJECT.md § Feature Inventory`, `TaskController.java`
- **Verification Runner**: `tests/e2e/crm-lifecycle-live.mjs`

### Scenario 3: LMS Student Complete Learning Journey to Public Certificate Verification
- **Actors**: Admin, Learner, Public Employer.
- **Workflow**:
  1. Admin creates Course "Бухгалтерский учет в Республике Казахстан 2026", 2 chapters, 4 lessons, and publishes it.
  2. Learner logs in, browses catalog, and enrolls in course.
  3. Learner completes Lesson 1, Lesson 2, Lesson 3 sequentially; progress calculates to 75%.
  4. Learner attempts to download certificate at 75%; rejected with HTTP 400.
  5. Learner completes Lesson 4; progress updates to 100%.
  6. Certificate generation triggers; unique verifiable code (e.g. `ZF-CERT-2026-XXXX`) generated.
  7. Learner downloads official PDF certificate featuring Cyrillic student name and ZhanFinance stamp.
  8. Third-party employer visits public portal `/api/v1/courses/certificates/verify/{code}` without logging in; receives verified student name and course completion timestamp.
- **Authoritative Source**: `ORIGINAL_REQUEST.md R1`, `LearnerCourseController.java`
- **Verification Runner**: `tests/e2e/lms-lifecycle-live.mjs`

### Scenario 4: Administrator 2FA Hardening and Session Governance
- **Actors**: Admin.
- **Workflow**:
  1. Admin navigates to Settings -> Security.
  2. Requests 2FA setup (`GET /api/v1/auth/2fa/setup`); receives secret and QR URI.
  3. Confirms setup using current valid TOTP token (`POST /api/v1/auth/2fa/setup/confirm`).
  4. Admin logs out of system.
  5. Admin submits standard email and password; server responds with `requires2FA: true` and pre-auth token.
  6. Admin submits invalid 2FA code `111111`; rejected with 400.
  7. Admin submits valid TOTP code; full session tokens issued.
  8. Admin changes UI language to Kazakh (`kk`); UI instantly re-renders in Kazakh.
  9. Admin disables 2FA with current code; subsequent logins proceed with direct authentication.
- **Authoritative Source**: `TwoFactorController.java`, `TEST_COVERAGE_PLAN.md § 3.1`
- **Verification Runner**: `tests/e2e/2fa-lifecycle.mjs`

### Scenario 5: Document Exchange, MIME Enforcement & Digital Signature Flow
- **Actors**: Employee, Client, Auditor.
- **Workflow**:
  1. Employee uploads official Contract PDF (`POST /api/v1/documents/upload`).
  2. System verifies file MIME type via Apache Tika (`application/pdf`) and stores binary payload.
  3. Employee associates document with Client's active Task.
  4. Client receives in-app and email alert regarding pending signature.
  5. Client logs in, streams document preview (`GET /api/v1/documents/{id}/download`).
  6. Client clicks "Confirm Electronic Signature" (`POST /confirm-signature`).
  7. Document status updates to `SIGNED`; immutable entry recorded in `audit_logs` table.
  8. Auditor attempts to modify audit log record; database trigger `block_audit_modification()` blocks the modification.
- **Authoritative Source**: `DocumentController.java`, `V111__Protect_Audit_Log_Table.sql`
- **Verification Runner**: `tests/e2e/documents-search-live.mjs`, `tests/e2e/idor-live.mjs`

### Scenario 6: Cross-Tenant RBAC & IDOR Penetration Walk Across All 6 Personas
- **Actors**: Admin, Employee A, Employee B, Client A, Client B, Advisor, Learner, Curator.
- **Workflow**:
  1. Employee B attempts to view Client A's profile (`GET /clients/{id}`) -> 403 Forbidden.
  2. Client B attempts to download Client A's invoice PDF (`GET /invoices/{id}/pdf`) -> 403 Forbidden.
  3. Client A attempts to subscribe to Client B's WebSocket chat channel -> Handshake / Subscribe Rejected.
  4. Advisor attempts to create task or delete client -> 403 Forbidden.
  5. Learner attempts to access Curator grading queue -> 403 Forbidden.
  6. Curator attempts to access Admin financial summary -> 403 Forbidden.
  7. Client searches for terms matching Client B's private documents -> Global search returns 0 leaked records.
- **Authoritative Source**: `CrmAccessService.java`, `InvoiceAccessService.java`, `WebSocketConfig.java`
- **Verification Runner**: `tests/e2e/idor-live.mjs`, `tests/e2e/advisor-readonly-lifecycle.mjs`

---

## 5. Test Execution Protocol & Commands

```powershell
# 1. Execute Backend Unit, MockMvc & Service Suites
cd c:\Users\murat\IdeaProjects\JF-1C\zhan-finance-backend
./gradlew test jacocoTestReport jacocoTestCoverageVerification

# 2. Execute Frontend Static Analysis, Typecheck & Vitest
cd c:\Users\murat\IdeaProjects\JF-1C\zhan-finance-frontend
npm run lint
npm run typecheck
npm run test:coverage

# 3. Execute Master Live E2E Integration Suite (13 Lifecycle Suites)
cd c:\Users\murat\IdeaProjects\JF-1C\tests
node run-all-e2e.mjs
```

---

## 6. Authoritative Source of Expected Output Derivation

For every test case specified:
1. **Source of Truth**: Requirements and interface contracts defined in `ORIGINAL_REQUEST.md`, `PROJECT.md`, and backend service logic (`CrmAccessService`, `SecurityConfig`, `Flyway V1..V121`).
2. **Deterministic Status Codes**:
   - `200 OK` / `201 Created` for authorized valid operations.
   - `400 Bad Request` for schema/constraint violations and invalid business transitions.
   - `401 Unauthorized` for unauthenticated or expired token requests.
   - `403 Forbidden` for IDOR violations, unauthorized roles, or ADVISOR mutations.
   - `404 Not Found` for non-existent entities or IDOR-isolated resources.
   - `409 Conflict` for duplicate emails, overlapping subscriptions, or concurrent updates.
   - `429 Too Many Requests` when Bucket4j rate limits are exceeded.
3. **No Facade Testing**: Facade tests, dummy passing implementations, and hardcoded returns are strictly forbidden. All suites execute real logic against real or MockMvc endpoints.
