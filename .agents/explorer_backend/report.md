# Backend Codebase & Test Landscape Exploration Report

## 1. Executive Summary
- Location: `zhan-finance-backend/`
- Build system: Gradle 9.5.1 with Java 17 toolchain (`JavaLanguageVersion.of(17)`).
- Framework: Spring Boot 4.1.0 with Spring Dependency Management 1.1.7.
- Existing Test Suite: 50 test files, 197 test cases, 0 failures (100% pass rate).
- Current JaCoCo instruction coverage: 49.43% (13,112 of 26,525 instructions covered).
- Target JaCoCo instruction coverage: >= 70.00% enforced via `jacocoTestCoverageVerification`.
- Missing coverage concentration: 18 REST controllers have near-zero MockMvc coverage (most below 30%), and 10 core business services lack comprehensive unit/mock test suites.
- WebSocket ACL: Implemented in `WebSocketConfig.java` (ChannelInterceptor on CONNECT, SUBSCRIBE, SEND) but has 3.4% coverage and zero dedicated unit/integration tests.

---

## 2. Build Configuration & Dependencies Analysis

### File: `zhan-finance-backend/build.gradle`
```groovy
plugins {
    id 'java'
    id 'org.springframework.boot' version '4.1.0'
    id 'io.spring.dependency-management' version '1.1.7'
    id 'jacoco'
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(17)
    }
}
```

### Core Production Dependencies
- Persistence: `spring-boot-starter-data-jpa`, PostgreSQL driver (`postgresql`), Flyway (`flyway-core`, `flyway-database-postgresql`).
- Web & API: `spring-boot-starter-webmvc`, `springdoc-openapi-starter-webmvc-ui:3.0.0`, Jackson (`spring-boot-starter-jackson`).
- Security & Auth: `spring-boot-starter-security`, JJWT 0.12.6 (`jjwt-api`, `jjwt-impl`, `jjwt-jackson`), TOTP (`totp-spring-boot-starter:1.7.1`), Google API Client (`google-api-client:2.2.0`).
- Real-Time & Communications: `spring-boot-starter-websocket`, `spring-boot-starter-mail`, Thymeleaf (`spring-boot-starter-thymeleaf`).
- Documents & Files: `openhtmltopdf-pdfbox:1.0.10`, `poi-tl:1.12.2`, `tika-core:2.9.2`.
- Performance & Rate Limiting: `spring-boot-starter-cache`, Caffeine, `bucket4j-core:8.10.1`.
- Observability: `spring-boot-starter-actuator`, Prometheus, OTLP, OpenTelemetry.

### Test Dependencies
- `org.springframework.boot:spring-boot-starter-test` (JUnit 5, AssertJ, Mockito, JSONPath).
- `org.springframework.boot:spring-boot-starter-data-jpa-test`
- `org.springframework.boot:spring-boot-starter-security-test`
- `org.springframework.boot:spring-boot-starter-validation-test`
- `org.springframework.boot:spring-boot-starter-webmvc-test`
- `com.h2database:h2` (In-memory database for testing).
- `org.mockito:mockito-inline:5.2.0` (Enables static and constructor mocking).
- `org.junit.platform:junit-platform-launcher`

### JaCoCo & Test Task State
- Current task configuration:
  ```groovy
  tasks.named('test') {
      useJUnitPlatform()
      finalizedBy jacocoTestReport
  }

  jacocoTestReport {
      dependsOn test
      reports {
          xml.required = true
          html.required = true
      }
  }
  ```
- Gap: `jacocoTestCoverageVerification` is absent. `check` task does not depend on verification.

---

## 3. Existing Backend Test Suite Landscape

### Test Inventory & Metrics
- Total test files: 50
- Total test methods: 197
- Test run execution time: ~1m 20s (including H2 database setup and migrations).
- Status: 100% passing (0 failures, 0 errors, 0 skipped).

### Base Test Classes and Testing Paradigms
1. Full Application Context Integration Tests:
   - Annotation: `@SpringBootTest` + `@AutoConfigureMockMvc` + `@Transactional`.
   - Used in: `ApiSmokeTests.java`, `RateLimitIntegrationTest.java`, `SecurityConfigTest.java`, `TaskServiceIntegrationTests.java`.
   - Behavior: Boots full Spring context with H2 in-memory DB (`application-test.properties`), executes Flyway migrations V1->V121, initializes beans.
2. WebMvc Slice Tests:
   - Annotation: `@SpringBootTest(classes = ZhanFinanceBackendApplication.class)` + `@AutoConfigureMockMvc(addFilters = false)`.
   - Mocking: Uses `@MockitoBean` (from `org.springframework.test.context.bean.override.mockito.MockitoBean`, Spring Boot 3.4+ / 4.x standard).
   - Used in: `ContactRequestControllerTest.java`.
3. Pure Unit Tests with Mockito:
   - Annotation: `@ExtendWith(MockitoExtension.class)`.
   - Used in: `AuditLogControllerPaginationTest.java`, `AdminServiceTest.java`, `AuthServiceUnitTests.java`, `UserServiceTest.java`, `TwoFactorServiceTest.java`, `InvoiceServiceTest.java`, `ChatServiceTest.java`, `DocumentServiceTest.java`.
   - Advantages: High execution speed (<50ms per test class), zero database or network overhead, precise branch isolation.

### Critical Diagnostic Finding (Build Stale File / Kryo Exception)
- Issue: If a Gradle test run is abruptly interrupted or cancelled on Windows, the binary test result cache at `build/test-results/test/binary/in-progress-results-generic.bin` gets corrupted. Subsequent test executions fail with:
  `Caused by: java.io.EOFException / com.esotericsoftware.kryo.KryoException: Buffer underflow` inside `Test.getPreviousFailedTestClasses`.
- Resolution: Running `.\gradlew.bat cleanTest` purges the corrupted binary results and immediately restores clean test execution.

---

## 4. Target Controllers Survey (18 Controllers)

All API controllers are registered under context path `/api` with base mapping `/v1/**` (final URL `/api/v1/**`).

| Controller | Base Path | Role / Access Controls | Key Endpoints | Current Instruction Coverage |
|---|---|---|---|---|
| `AuthController` | `/v1/auth` | Public: `/login`, `/register`, `/refresh`, `/logout`, `/check-email`, `/forgot-password`, `/reset-password`, `/google`. Authenticated: `/me` | 9 endpoints handling auth lifecycle, cookie issuing, Google OAuth, password recovery | 43.0% (163/379) |
| `TwoFactorController` | `/v1/auth/2fa` | Public: `/verify`. ADMIN only: `/setup`, `/setup/confirm`, `/disable` | 4 endpoints for TOTP QR setup, verification, token revocation | 14.1% (9/64) |
| `UserController` | `/v1/users` | `@PreAuthorize("isAuthenticated()")` | GET `/me`, PUT `/me`, PUT `/me/password`, PATCH `/me/locale`, POST `/me/avatar` (multipart) | 40.0% (34/85) |
| `AdminController` | `/v1/admin` | `@PreAuthorize("hasRole('ADMIN')")` | 16 endpoints: finance summary, employee approvals/rejections, advisor promotion/demotion, user status toggle, soft delete, workload stats, learner creation | 10.6% (12/113) |
| `TaskController` | `/v1/crm/tasks` | `@PreAuthorize("hasAnyRole(...)")` + `CrmAccessService` checks | 18 endpoints: task CRUD, stage updates, comments, reassignments, labels, batch operations, document generation | ~30% (78/260) |
| `ClientController` | `/v1/crm/clients` | `@PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE', 'ADVISOR')")` | GET `/`, GET `/{id}` (`assertCanReadClient`), POST `/{id}/assign` | ~30% (25/82) |
| `DashboardController` | `/v1/crm/dashboard` | Role-partitioned: `/admin` (ADMIN, ADVISOR), `/employee` (EMPLOYEE, ADVISOR), `/client` (CLIENT), `/weekly-summary` (All) | 4 aggregation endpoints | ~20% (14/68) |
| `PipelineController` | `/v1/crm/pipelines` | GET: All roles. POST/PATCH/DELETE: ADMIN | GET pipelines with stages, stage creation, stage editing, stage deletion | 27.9% (68/244) |
| `InvoiceController` | `/v1/billing/invoices` | Role-partitioned via `InvoiceAccessService` + PreAuthorize | PDF generation (`/{id}/pdf`, `/{id}/act-pdf`), paged list, getById, create, update, delete | 29.0% (45/155) |
| `SubscriptionController` | `/v1/billing/subscriptions` | Authenticated; service checks overlap and ownership | GET all (paged/list), POST create, PUT update, DELETE | ~30% (24/80) |
| `AdminCourseController` | `/v1/admin/courses` | `@PreAuthorize("hasRole('ADMIN')")` | Course CRUD, Chapter CRUD, Lesson CRUD with multipart file support | 29.6% (34/115) |
| `LearnerCourseController` | `/v1/courses` | `@PreAuthorize("hasAnyRole('ADMIN', 'LEARNER')")` | Published courses catalog, course outline, lesson completion, certificate download, `/certificates/verify/{code}` (permitAll) | ~30% (35/116) |
| `CuratorCourseController` | `/v1/curator` | `@PreAuthorize("hasRole('CURATOR')")` | GET assigned courses, GET course details, GET assigned students progress | 8.6% (18/209) |
| `ChatController` | `/v1/chat` | All 6 roles permitted | GET contacts, GET history (paged with afterId), POST message, PUT read, GET unread count, DELETE message | 10.5% (6/57) |
| `DocumentController` | `/v1/documents` | Authenticated + `DocumentAccessService` | Multipart upload, GET user documents, GET all visible, GET task documents, status update, stream download, delete, client sign confirm, ZIP download | 3.8% (9/240) |
| `GlobalSearchController` | `/v1/search` | All roles permitted (results filtered by actor role) | GET `?q={query}` searching tasks, clients, documents | 86.4% (19/22) |
| `NotificationController` | `/v1/notifications` | Current user scope | GET notifications (paged/list), PATCH `/{id}/read`, POST `/read-all` | 9.8% (6/61) |
| `CalendarController` | `/v1/crm/calendar` | `@PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE', 'CLIENT', 'ADVISOR')")` | GET events by date range, POST create event, PUT update event, DELETE event | 15.8% (10/63) |

---

## 5. Target Services Survey (10 Services)

### 1. `DashboardService`
- Location: `modules/crm/service/DashboardService.java`
- Dependencies: `TaskRepository`, `UserRepository`, `ClientProfileRepository`, `ContactRequestRepository`, `TaskMapper`.
- Current coverage: 23.4% (172 / 735 instructions, 563 missed).
- Key logic to test:
  - `getAdminDashboard`: Aggregation of revenue (`sumWonAmount`, `sumExpectedAmount`), average completion days, task status mapping, lost reason mapping, employee workload calculation with case-insensitive column matching (`empid`, `stagetype`, `taskcount`, `overduecount`).
  - `getEmployeeDashboard`: Urgent tasks filtering (due today or overdue), planned tasks (Monday end-of-week vs Friday next-week vs standard), recent history (WON tasks completed within last 7 days).
  - `getClientDashboard`: Client task count and status breakdown.
  - Edge cases: Empty pipelines (zero tasks), null amounts from repository aggregations, employees with zero tasks.

### 2. `UserLabelService`
- Location: `modules/crm/service/UserLabelService.java`
- Dependencies: `UserLabelRepository`.
- Current coverage: 6.3% (6 / 95 instructions, 89 missed).
- Key logic to test:
  - `getUserLabels(userId)`: returns user-specific labels ordered by ID asc.
  - `createLabel(user, request)`: validates max 5 labels constraint (`IllegalArgumentException` when currentCount >= 5).
  - `deleteLabel(user, labelId)`: verifies label ownership; throws `AccessDeniedException` if user is not owner; throws `ResourceNotFoundException` if label missing.

### 3. `TaskService` (Transactionality & Batch Updates)
- Location: `modules/crm/service/TaskService.java`
- Dependencies: 14 dependencies (`TaskRepository`, `UserRepository`, `CrmAccessService`, `NotificationService`, `EmailNotificationService`, `AuditService`, `ServiceRepository`, `StageRepository`, `PipelineRepository`, `TaskMapper`, `DocumentRepository`, `StorageService`, `ClientService`, `UserLabelRepository`).
- Current coverage: 23.9% (614 / 2564 instructions, 1950 missed).
- Critical logic:
  - Batch update 1: `batchUpdateTasks(TaskBatchUpdateRequest request, User user)`: Updates individual task stages and details, evicts caches (`dashboard_admin`, `dashboard_employee`, `dashboard_client`), asserts stage access via `CrmAccessService`, dispatches client and employee notifications.
  - Batch update 2: `batchUpdateTasks(TaskBatchOperationRequest request, User user)`: Updates list of task IDs with unified stage, assignee, or label. Validates per-task update rights.
  - Reassignment workflow: `requestReassignment`, `approveReassignment` (unassigns and notifies), `rejectReassignment`.
  - Reopening LOST task: Auto-moves to first OPEN stage of pipeline when reassigned from pool.
  - Transactionality: `@Transactional` rollback verification on exception during task request or batch update.

### 4. `DeadlineAlertScheduler`
- Location: `modules/notifications/service/DeadlineAlertScheduler.java`
- Dependencies: `TaskRepository`, `EmailNotificationService`, `NotificationService`, `UserRepository`.
- Current coverage: 13.4% (19 / 142 instructions, 123 missed).
- Key logic to test:
  - `@Scheduled(cron = "0 0 8 * * *") checkDeadlines()`
  - Finds tasks due today (`today`) and tomorrow (`today.plusDays(1)`) where stage is NOT WON and NOT LOST.
  - Dispatches `sendTaskDeadlineAlertEmail` and `createNotification` only to assigned employees.
  - Sets `task.setDeadlineNotifiedAt(now)` and persists via `taskRepository.saveAll`.
  - Edge cases: Tasks with null assignee (should not crash, no notification sent), tasks already notified, empty lists.

### 5. `TelegramNotifierService`
- Location: `modules/notifications/service/TelegramNotifierService.java`
- Dependencies: `RestClient` (created internally via `RestClient.create()`), injected `@Value` `botToken` and `adminChatId`.
- Current coverage: 27.8% (27 / 97 instructions, 70 missed).
- Key logic to test:
  - Graceful degradation when `botToken` or `adminChatId` is null/empty.
  - MarkdownV2 escaping logic: `text.replaceAll("([_\\\\*\\[\\]()~`>#+\\-=|{}.!])", "\\\\$1")`.
  - Proper payload structure sent to `https://api.telegram.org/bot<token>/sendMessage`.
  - Catching network/API exceptions without re-throwing (logs error, no disruption to caller).

### 6. `PdfGeneratorService`
- Location: `modules/billing/service/PdfGeneratorService.java`
- Dependencies: `TemplateEngine` (Thymeleaf).
- Current coverage: 8.3% (6 / 72 instructions, 66 missed).
- Key logic to test:
  - Renders HTML from Thymeleaf template and converts to PDF bytes via `PdfRendererBuilder`.
  - Safe font resolution for Cyrillic: probe `/fonts/arial.ttf` on classpath.
  - Fallback execution when custom font is missing.

### 7. `CertificateGeneratorService`
- Location: `modules/courses/service/CertificateGeneratorService.java`
- Dependencies: `CertificateRepository`, `TemplateEngine`.
- Current coverage: 9.6% (9 / 94 instructions, 85 missed).
- Key logic to test:
  - Generates certificate PDF for user and completed course.
  - Throws `ResourceNotFoundException` if certificate does not exist.
  - Populates Thymeleaf context with `studentName`, `courseTitle`, `issueDate`, `certificateCode`.

### 8. `LessonService`
- Location: `modules/courses/service/LessonService.java`
- Dependencies: `LessonRepository`, `ChapterRepository`, `CourseRepository`, `StorageService`, `LessonProgressRepository`.
- Current coverage: ~50% (140 / 280 instructions).
- Key logic to test:
  - `createLesson`: Automatically creates "Default Chapter" if course has no chapters.
  - `createLessonForChapter`: Order index computation (`maxOrderIndex + 1` when orderIndex <= 0).
  - `updateLesson`: File uploads for video (`videoFile`) and document (`documentFile`) stored via `storageService.store(...)` and URLs prefixed with `/uploads/`.
  - `deleteLesson`: Deletion by ID.

### 9. `GoogleAuthService`
- Location: `modules/auth/service/GoogleAuthService.java`
- Dependencies: `UserRepository`, `JwtService`, `RefreshTokenService`, `ClientService`, `NotificationService`, `EmailNotificationService`, `TwoFactorService`, `TelegramNotifierService`.
- Current coverage: 8.2% (27 / 331 instructions, 304 missed).
- Key logic to test:
  - Existing user login: Updates avatar and provider to `GOOGLE`, checks deleted/enabled flags.
  - New employee registration: Sets `enabled = false`, notifies admins (`/admin/employees`), returns auth response with `requiresApproval = true`.
  - New client registration: Creates User + Client profile.
  - Invalid Google token handling: Throws `UnauthorizedException`.

### 10. `DatabaseStorageService`
- Location: `modules/documents/service/DatabaseStorageService.java`
- Dependencies: `StoredFileRepository`, `ObjectProvider<LocalStorageService>`.
- Current coverage: ~45% (90 / 200 instructions).
- Key logic to test:
  - `store(MultipartFile)`: Stores binary data, generates UUID storage key, throws `BadRequestException` on empty file.
  - `loadAsBytes(storageKey)`: Dual-key check (handles presence or absence of `"avatars/"` prefix), falls back to `LocalStorageService`, falls back to `./uploads` local directory, throws `ResourceNotFoundException` if not found.
  - `loadAsResource(storageKey)`: Returns `ByteArrayResource` with filename.
  - `delete(storageKey)`: Deletes from `StoredFileRepository`.

---

## 6. WebSocket Architecture and ACL Specification

### Implementation: `modules/chat/config/WebSocketConfig.java`
- Endpoints: `/ws`, `/api/ws` with SockJS fallback. Allowed origin patterns configurable via `app.cors.allowed-origins`.
- Message broker destinations: `/topic`, `/queue`. Application destination prefix: `/app`.
- Inbound Channel Interceptor:
  1. `StompCommand.CONNECT`:
     - Looks for existing `accessor.getUser()`.
     - Extracts `Authorization: Bearer <token>` from native headers.
     - Validates accessToken via `jwtService.extractUsernameIfValidAccessToken(token)`, `userDetailsService.loadUserByUsername(username)`, and `jwtService.isTokenValid(token, username)`.
     - Sets authenticated `UsernamePasswordAuthenticationToken` in `accessor.setUser(...)`.
     - Throws `IllegalArgumentException("Unauthorized: WebSocket connection requires authentication via cookies or token")` on failure.
  2. `StompCommand.SUBSCRIBE` & `StompCommand.SEND`:
     - Verifies principal is not null; throws `IllegalArgumentException("Unauthorized: WebSocket connection requires authentication")`.
     - Destination check on `/topic/chat/{targetUserId}`:
       - If principal has `ROLE_ADMIN` or `ROLE_EMPLOYEE`, access is granted to any user topic.
       - If principal is `ROLE_CLIENT` (or other role), requires `userPrincipal.getId().toString().equals(targetUserIdStr)`.
       - Throws `IllegalArgumentException("Forbidden")` if attempting to subscribe to another user's chat channel.

### Test Requirements for `WebSocketAclTest`
`WebSocketAclTest` should be implemented as a focused unit/interceptor test using Spring Messaging fixtures (`MessageHeaderAccessor`, `StompHeaderAccessor`, mock `MessageChannel`):
1. `testConnect_WithValidJwt_ShouldAuthenticate`: CONNECT command with `Bearer <valid_token>` populates user principal in accessor.
2. `testConnect_WithoutAuthHeader_ShouldThrowUnauthorized`: CONNECT command with no Authorization header throws `IllegalArgumentException("Unauthorized...")`.
3. `testConnect_WithExpiredOrInvalidJwt_ShouldThrowUnauthorized`: CONNECT command with invalid token throws `IllegalArgumentException`.
4. `testSubscribe_ChatChannel_OwnUserId_ShouldSucceed`: Client user subscribing to `/topic/chat/{myId}` is accepted.
5. `testSubscribe_ChatChannel_OtherUserId_AsClient_ShouldThrowForbidden`: Client user subscribing to `/topic/chat/{otherId}` throws `IllegalArgumentException("Forbidden")`.
6. `testSubscribe_ChatChannel_OtherUserId_AsAdmin_ShouldSucceed`: Admin user subscribing to `/topic/chat/{anyId}` is accepted.
7. `testSubscribe_ChatChannel_OtherUserId_AsEmployee_ShouldSucceed`: Employee user subscribing to `/topic/chat/{anyId}` is accepted.
8. `testSubscribe_WithoutAuthentication_ShouldThrowUnauthorized`: SUBSCRIBE with null principal throws `IllegalArgumentException("Unauthorized...")`.

---

## 7. JaCoCo Coverage & Verification Architecture

### Current Metrics (Ground Truth)
- Total instructions: 26,525
- Covered instructions: 13,112 (49.43%)
- Missed instructions: 13,413
- Total classes in scan: 226 classes across 50 packages.

### Instruction Gap Analysis to Reach >= 70%
To reach 70.00% instruction coverage:
- Target instruction count (without exclusions): `26,525 * 0.70 = 18,568 instructions`. Need +5,456 covered instructions.
- Target instruction count (with DTO/Entity/Application exclusions):
  - Excluded classes: DTO records/classes (~3,600 instructions), JPA Entities (~1,500 instructions), `ZhanFinanceBackendApplication` (18 instructions).
  - Effective instruction denominator: ~21,400 instructions.
  - Required covered instructions: ~15,000 instructions.
  - Adding controller tests (+2,200 instructions) and service tests (+2,500 instructions) will yield ~17,800 covered instructions (>80% instruction coverage).

### Required `build.gradle` JaCoCo Configuration
```groovy
jacocoTestReport {
    dependsOn test
    reports {
        xml.required = true
        html.required = true
    }
    afterEvaluate {
        classDirectories.setFrom(files(classDirectories.files.collect {
            fileTree(dir: it, exclude: [
                'com/example/zhanfinancebackend/**/dto/**',
                'com/example/zhanfinancebackend/**/entity/**',
                'com/example/zhanfinancebackend/ZhanFinanceBackendApplication.class'
            ])
        }))
    }
}

jacocoTestCoverageVerification {
    dependsOn test
    violationRules {
        rule {
            element = 'BUNDLE'
            limit {
                counter = 'INSTRUCTION'
                value = 'COVEREDRATIO'
                minimum = 0.70
            }
        }
    }
    afterEvaluate {
        classDirectories.setFrom(files(classDirectories.files.collect {
            fileTree(dir: it, exclude: [
                'com/example/zhanfinancebackend/**/dto/**',
                'com/example/zhanfinancebackend/**/entity/**',
                'com/example/zhanfinancebackend/ZhanFinanceBackendApplication.class'
            ])
        }))
    }
}

check.dependsOn jacocoTestCoverageVerification
```

---

## 8. Implementation Strategy & Test Suite Blueprint

### Strategy 1: Controller Tests (WebMvc Slice or MockMvc Integration)
- Standardize controller test pattern:
  Use `@SpringBootTest` + `@AutoConfigureMockMvc(addFilters = false)` or pure `@WebMvcTest(TargetController.class)` with `@MockitoBean` for the target service and security components.
  Testing both happy paths (200/201/OK) and security/validation rejection paths (400, 401, 403, 404).

### Strategy 2: Service Tests (MockitoExtension)
- Pure unit tests with `@ExtendWith(MockitoExtension.class)`:
  - Extremely fast execution (<2 seconds for the entire suite of 10 service tests).
  - Complete control over repository return values and exception triggers.
  - Enables 90%+ branch and instruction coverage for complex methods like `DashboardService` and `TaskService`.

### Strategy 3: WebSocket ACL Test
- Test the `ChannelInterceptor` returned by `WebSocketConfig.configureClientInboundChannel` directly using Mockito and Spring Messaging builders (`MessageBuilder`, `StompHeaderAccessor`).

---

## 9. Conclusion & Next Actionable Steps
1. The backend codebase is clean, builds without compiler errors, and all 197 existing tests pass.
2. The 49.43% coverage gap is directly attributable to the absence of unit tests for 18 controllers and 10 core services.
3. Implementing the test suites detailed in Sections 4, 5, and 6 will comfortably surpass the 70% JaCoCo instruction threshold.
4. Report artifact path: `c:\Users\murat\IdeaProjects\JF-1C\.agents\explorer_backend\report.md`.
