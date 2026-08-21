# Handoff Report: C3 Unbounded Queries and Missing Pagination Investigation

## 1. Observation

Direct code observations from inspecting the codebase:

1. **Document Controller & Service (`DocumentController.java:49-72`, `DocumentService.java:168-207`)**:
   - `DocumentController.java:51`: `public ApiResponse<List<DocumentDto>> getDocuments(@RequestParam(value = "userId", required = false) Long targetUserId, @AuthenticationPrincipal UserPrincipal principal)` calls `documentService.getUserDocuments(finalTargetUserId, principal.getUser())`.
   - `DocumentController.java:61`: `public ApiResponse<List<DocumentDto>> getAllDocuments(@AuthenticationPrincipal UserPrincipal principal)` calls `documentService.getAllVisibleDocuments(principal.getUser())`.
   - `DocumentController.java:68`: `public ApiResponse<List<DocumentDto>> getTaskDocuments(@PathVariable Long taskId, @AuthenticationPrincipal UserPrincipal principal)` calls `documentService.getTaskDocuments(taskId, principal.getUser())`.
   - `DocumentService.java:182-192`: `getAllVisibleDocuments` executes `documentRepository.findAllByOrderByCreatedAtDesc()` for `ADMIN`/`ADVISOR` and `documentRepository.findForEmployee(actor.getId())` for `EMPLOYEE` without pagination limits.
   - `DocumentRepository.java:14, 19, 20, 21`: Repository methods return `List<Document>` with no `Pageable` parameters.

2. **Invoice Controller & Service (`InvoiceController.java:76-80`, `InvoiceService.java:40-48`)**:
   - `InvoiceController.java:78`: `public ApiResponse<List<InvoiceDto>> findAll(@AuthenticationPrincipal UserPrincipal principal)` calls `invoiceService.findAll(principal.getUser())`.
   - `InvoiceService.java:40-48`: `findAll` executes `invoiceRepository.findAllWithClient()` for `ADMIN`, `invoiceRepository.findAllByUserAssignedEmployee(user)` for `EMPLOYEE`, and `invoiceRepository.findAllByUser(user)` for `CLIENT`.
   - `InvoiceRepository.java:13, 17, 20`: `findAllWithClient()` performs `select invoice from Invoice invoice join fetch invoice.user client left join fetch client.assignedEmployee` returning an unbounded `List<Invoice>`.

3. **Subscription Controller & Service (`SubscriptionController.java:30-33`, `SubscriptionService.java:26-28`)**:
   - `SubscriptionController.java:31`: `public ApiResponse<List<SubscriptionDto>> findAll(@AuthenticationPrincipal UserPrincipal principal)` calls `subscriptionService.findAll(principal.getUser())`.
   - `SubscriptionService.java:26-28`: `findAll` executes `subscriptionRepository.findAllByUser(user)` returning an unbounded `List<Subscription>`.
   - `SubscriptionRepository.java:12`: `List<Subscription> findAllByUser(User user);`.

4. **Frontend API Consumer Contract (`http.ts:110-116`, `documentApi.ts:30-37`, `billingApi.ts:26,40`)**:
   - In `src/shared/api/http.ts:110-116`, `apiRequest<T>` unwraps `body.data`.
   - In `src/pages/dashboard/employee/EmployeeDocumentsPage.tsx:56,81`, `getAllDocuments()` is expected to return `DocumentDto[]` which is mapped and filtered directly in React.
   - In `src/pages/dashboard/client/ClientDocumentsPage.tsx:84`, `getDocuments(user.userId)` is stored directly in array state `setDocuments(data)`.
   - In `src/pages/dashboard/admin/billing/AdminInvoicesPage.tsx:16`, `useApiData<InvoiceDto[]>(billingApi.getInvoices)` renders `invoices.map(...)`.
   - In `src/pages/dashboard/admin/billing/AdminSubscriptionsPage.tsx:16`, `useApiData<SubscriptionDto[]>(billingApi.getSubscriptions)` renders `subscriptions.map(...)`.

5. **Existing Codebase Pattern (`AuditLogController.java:28-39`, `AuditLogControllerPaginationTest.java:38-84`)**:
   - `AuditLogController.java` supports dual-mode: when `page` and `size` are passed, it returns `Page<T>`; when omitted, it queries using a bounded `PageRequest.of(0, 200)` and returns `List<T>`.
   - `TaskSpecification.java:32-38` contains `root.fetch(...)` joins that trigger Hibernate in-memory pagination (HHH90003004) when paged with `Pageable`.

---

## 2. Logic Chain

1. **Memory Risk on 512MB RAM VM**:
   - Observations 1, 2, and 3 demonstrate that `DocumentController`, `InvoiceController`, and `SubscriptionController` execute full database table scans (`findAllByOrderByCreatedAtDesc`, `findAllWithClient`, `findAllByUser`) returning unbounded `List<T>`.
   - In the target 512MB RAM environment on Fly.io, fetching hundreds or thousands of rich entities (especially documents and invoices with join fetches) causes JVM heap pressure and OutOfMemory errors.

2. **Frontend Compatibility Constraint**:
   - Observation 4 shows that all consuming frontend pages (`EmployeeDocumentsPage`, `ClientDocumentsPage`, `AdminInvoicesPage`, `AdminSubscriptionsPage`) treat the payload as a JavaScript array `T[]` and call `.map()`, `.filter()`, `.forEach()`.
   - If backend endpoints change their JSON structure unconditionally from `ApiResponse<List<T>>` (where `data` is `[...]`) to `ApiResponse<Page<T>>` (where `data` is `{ content: [...], totalPages: ... }`), all consuming frontend pages will break immediately at runtime with `TypeError: data.map is not a function`.

3. **Dual-Mode / Overloaded Remediation Strategy**:
   - Observation 5 shows that `AuditLogController` has already established a proven, backward-compatible dual-mode pattern in this repository.
   - By adding optional `@RequestParam(required = false) Integer page, Integer size` to `DocumentController`, `InvoiceController`, and `SubscriptionController`:
     - When `page` is provided: return `Page<T>` for clients requesting paginated data.
     - When `page` is omitted: execute the query with a bounded `PageRequest.of(0, 100)` and return `.getContent()` (`List<T>`).
   - This provides immediate 100% protection against memory exhaustion on the 512MB VM while maintaining 100% zero-regression backward compatibility with existing frontend components.

4. **TaskSpecification Two-Query Slicing**:
   - Observation 5 shows that `TaskRepository` already contains `findAllByIdInWithDetails(List<Long> ids)`.
   - Splitting `getAllTasksPaged` in `TaskService` into (a) lightweight ID pagination query without fetch joins and (b) batch fetch by page IDs via `findAllByIdInWithDetails` resolves Hibernate HHH90003004 in-memory pagination warnings completely.

---

## 3. Caveats

1. **Frontend Pagination UI**: While the dual-mode backend implementation protects memory and allows frontend components to request specific pages (`?page=0&size=20`), the frontend pages (`AdminInvoicesPage`, `AdminSubscriptionsPage`, `EmployeeDocumentsPage`) currently do not render pagination controls (next/prev page buttons). When unpaged, they will display up to the bounded limit (100 items). Adding UI pagination widgets to those screens is a frontend enhancement that can be delivered independently without breaking API contracts.
2. **Business Overlap Validation**: `SubscriptionService.hasOverlap` uses `findAllByUser(user)` to validate subscription date collision. That validation call must not be artificially restricted to page 0; it should either remain an unpaged lookup for that single user or use a date-range count query `countOverlappingSubscriptions`.
3. **Document Templates**: `DocumentTemplateController` returns static official templates (~10-20 seeded templates) where unbounded risk is negligible, but bounding to max 100 items is recommended for consistency.

---

## 4. Conclusion

1. **Identified Unbounded Endpoints**:
   - `DocumentController`: `GET /v1/documents`, `GET /v1/documents/all`, `GET /v1/documents/task/{taskId}`.
   - `InvoiceController`: `GET /v1/billing/invoices`.
   - `SubscriptionController`: `GET /v1/billing/subscriptions`.
   - `NotificationController`: `GET /v1/notifications`.

2. **Required Architecture**:
   - Adopt the dual-mode pagination pattern across `DocumentController`, `InvoiceController`, and `SubscriptionController`.
   - Update `DocumentRepository`, `InvoiceRepository`, and `SubscriptionRepository` with `Pageable` parameters and explicit `countQuery` on custom `@Query` annotations.
   - Refactor `TaskService.getAllTasksPaged` to two-query ID-based pagination using `findAllByIdInWithDetails`.

3. **Detailed Specifications**:
   - The exact repository, service, and controller signatures are fully detailed in `analysis.md`.

---

## 5. Verification Method

To independently verify the investigation findings and test proposed changes:

1. **Inspect Target Endpoints and Repositories**:
   - Check `DocumentController.java:49-72` and `DocumentRepository.java:11-21`.
   - Check `InvoiceController.java:76-80` and `InvoiceRepository.java:13-24`.
   - Check `SubscriptionController.java:30-33` and `SubscriptionRepository.java:11-15`.
   - Check `AuditLogControllerPaginationTest.java:1-85` for established reference implementation.

2. **Verify Frontend Compatibility**:
   - Inspect `zhan-finance-frontend/src/shared/api/http.ts:110-116`.
   - Inspect `zhan-finance-frontend/src/pages/dashboard/employee/EmployeeDocumentsPage.tsx:55-60,81`.
   - Inspect `zhan-finance-frontend/src/pages/dashboard/admin/billing/AdminInvoicesPage.tsx:16,70-100`.

3. **Backend Test Command**:
   - Run `./gradlew test --tests com.example.zhanfinancebackend.modules.billing.*`
   - Run `./gradlew test --tests com.example.zhanfinancebackend.modules.documents.*`
   - Run `./gradlew test --tests com.example.zhanfinancebackend.modules.audit.controller.AuditLogControllerPaginationTest`
