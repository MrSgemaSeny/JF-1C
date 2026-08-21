# Analysis: C3 Unbounded Queries and Missing Pagination Investigation

## Executive Summary
This investigation analyzes unbounded database queries and missing pagination across Document, Invoice, and Subscription modules (along with Notification and CRM TaskSpecification pagination). Unbounded queries in these modules present severe memory exhaustion risks for the 512MB RAM deployment environment on Fly.io.

This analysis identifies all unpaged endpoints, audits frontend consumers, analyzes backward compatibility risks, and formulates precise repository and service method signatures for remediation.

---

## 1. Catalog of Unbounded Endpoints

### 1.1 Document Module
**Files:**
- `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/controller/DocumentController.java`
- `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/service/DocumentService.java`
- `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/repository/DocumentRepository.java`

**Endpoints:**
1. `GET /v1/documents` (`DocumentController.java:49-57`)
   - Return Type: `ApiResponse<List<DocumentDto>>`
   - Service Call: `documentService.getUserDocuments(finalTargetUserId, principal.getUser())`
   - Repository Call: `documentRepository.findByUserIdOrTaskClientId(targetUserId)` (`DocumentRepository.java:13-14`)
   - Severity: HIGH. Unbounded query returning full document history for a given user.

2. `GET /v1/documents/all` (`DocumentController.java:59-64`)
   - Return Type: `ApiResponse<List<DocumentDto>>`
   - Service Call: `documentService.getAllVisibleDocuments(principal.getUser())`
   - Repository Calls:
     - ADMIN / ADVISOR: `documentRepository.findAllByOrderByCreatedAtDesc()` (`DocumentRepository.java:20`) -> Scans the ENTIRE `documents` table without LIMIT.
     - EMPLOYEE: `documentRepository.findForEmployee(actor.getId())` (`DocumentRepository.java:18-19`) -> Scans all documents belonging to or assigned to employee clients without LIMIT.
     - CLIENT: `documentRepository.findByUserIdOrTaskClientId(actor.getId())`
   - Severity: CRITICAL. Under production load with thousands of uploaded documents, `findAllByOrderByCreatedAtDesc()` will exhaust JVM heap on the 512MB RAM VM.

3. `GET /v1/documents/task/{taskId}` (`DocumentController.java:66-72`)
   - Return Type: `ApiResponse<List<DocumentDto>>`
   - Service Call: `documentService.getTaskDocuments(taskId, principal.getUser())`
   - Repository Call: `documentRepository.findByTaskIdOrderByCreatedAtDesc(taskId)` (`DocumentRepository.java:21`)
   - Severity: MEDIUM. Returns all documents attached to a specific task. While tasks usually have 1-20 documents, the query lacks SQL LIMIT.

4. `GET /v1/document-templates` (`DocumentTemplateController.java:41-45`)
   - Return Type: `ResponseEntity<ApiResponse<List<DocumentTemplateDto>>>`
   - Repository Call: `templateRepository.findAll()`
   - Severity: LOW. Seeded static templates (~10-20 items).

---

### 1.2 Billing: Invoice Module
**Files:**
- `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/billing/controller/InvoiceController.java`
- `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/billing/service/InvoiceService.java`
- `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/billing/repository/InvoiceRepository.java`

**Endpoints:**
1. `GET /v1/billing/invoices` (`InvoiceController.java:76-80`)
   - Return Type: `ApiResponse<List<InvoiceDto>>`
   - Service Call: `invoiceService.findAll(principal.getUser())` (`InvoiceService.java:40-48`)
   - Repository Calls:
     - ADMIN: `invoiceRepository.findAllWithClient()` (`InvoiceRepository.java:19-20`) -> `select invoice from Invoice invoice join fetch invoice.user client left join fetch client.assignedEmployee` without LIMIT.
     - EMPLOYEE: `invoiceRepository.findAllByUserAssignedEmployee(user)` (`InvoiceRepository.java:17`)
     - CLIENT: `invoiceRepository.findAllByUser(user)` (`InvoiceRepository.java:13`)
   - Severity: CRITICAL. Invoices accumulate indefinitely in SaaS accounting. Fetching all invoices across the system with eager client joins causes linear memory growth.

---

### 1.3 Billing: Subscription Module
**Files:**
- `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/billing/controller/SubscriptionController.java`
- `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/billing/service/SubscriptionService.java`
- `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/billing/repository/SubscriptionRepository.java`

**Endpoints:**
1. `GET /v1/billing/subscriptions` (`SubscriptionController.java:30-33`)
   - Return Type: `ApiResponse<List<SubscriptionDto>>`
   - Service Call: `subscriptionService.findAll(principal.getUser())` (`SubscriptionService.java:26-28`)
   - Repository Call: `subscriptionRepository.findAllByUser(user)` (`SubscriptionRepository.java:12`)
   - Severity: MEDIUM. Returns all historical subscriptions for the user without pagination.
   - Note on Overlap Check: `SubscriptionService.hasOverlap()` (`SubscriptionService.java:85-100`) also invokes `findAllByUser(user)` for in-memory validation; this validation method should retain an unbounded or date-scoped query while the controller listing is paged.

---

### 1.4 Notification Module (Context Finding)
**Files:**
- `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/notifications/controller/NotificationController.java`
- `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/notifications/service/NotificationService.java`
- `zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/notifications/repository/NotificationRepository.java`

**Endpoints:**
1. `GET /v1/notifications` (`NotificationController.java:25-29`)
   - Return Type: `ApiResponse<List<NotificationDto>>`
   - Service Call: `notificationService.getUserNotifications(principal.getUser().getId())` (`NotificationService.java:68-72`)
   - Repository Call: `notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)`
   - Severity: HIGH. As notifications build up over months, fetching full history on every page load slows down navbar rendering.

---

## 2. Frontend Consumption and Backward Compatibility Analysis

### 2.1 Frontend HTTP Client Contract
In `zhan-finance-frontend/src/shared/api/http.ts`:
- All frontend API calls go through `apiRequest<T>(path, init)`.
- `apiRequest` unwraps the backend envelope `{ success: true, data: T, message: ... }` and returns `body.data`.
- If the endpoint returns `ApiResponse<List<T>>`, `body.data` is a JavaScript `Array` (`T[]`).
- If the endpoint returns `ApiResponse<Page<T>>`, `body.data` is a Spring Data `Page` object `{ content: T[], totalPages: number, totalElements: number, size: number, number: number, ... }`.

### 2.2 Direct Frontend Consumers
| Frontend File | Invoked Function | Expected Return Type | Processing Pattern |
|---|---|---|---|
| `src/pages/dashboard/client/ClientDocumentsPage.tsx:84` | `getDocuments(user.userId)` | `DocumentDto[]` | `setDocuments(data); data.filter(...)` |
| `src/pages/dashboard/employee/EmployeeDocumentsPage.tsx:56,81` | `getAllDocuments()` | `DocumentDto[]` | `setDocuments(docsData); docsData.map(...)` |
| `src/entities/task/ui/TaskDetailsModal.tsx:136` | `getTaskDocuments(task.id)` | `DocumentDto[]` | `.then(setDocuments)` |
| `src/pages/dashboard/client/ClientTaskDetailsPage.tsx:51` | `getTaskDocuments(taskId)` | `DocumentDto[]` | `.then(setDocuments)` |
| `src/pages/dashboard/admin/billing/AdminInvoicesPage.tsx:16` | `billingApi.getInvoices` | `InvoiceDto[]` | `useApiData<InvoiceDto[]>(...); invoices.map(...)` |
| `src/pages/dashboard/admin/billing/AdminSubscriptionsPage.tsx:16` | `billingApi.getSubscriptions` | `SubscriptionDto[]` | `useApiData<SubscriptionDto[]>(...); subscriptions.map(...)` |

### 2.3 Compatibility Verdict and Recommended Architecture
If backend endpoints are abruptly changed to return `ApiResponse<Page<T>>` without handling unpaged callers:
- `ClientDocumentsPage`, `EmployeeDocumentsPage`, `AdminInvoicesPage`, `AdminSubscriptionsPage`, and task document modals will immediately fail at runtime with `TypeError: data.filter is not a function` or `invoices.map is not a function`.

**Recommended Architecture: Dual-Mode / Overloaded Pagination (Established by AuditLogController and TaskController)**:
1. Controllers accept optional `@RequestParam(required = false) Integer page` and `@RequestParam(required = false) Integer size`.
2. When `page != null && size != null`:
   - Create `Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "id" / "createdAt"))`.
   - Return `ApiResponse.success(service.getPaged(...))` -> returns Spring Data `Page<T>` in `data`.
3. When `page == null` (legacy or unpaged call from existing frontend):
   - Execute query with safe upper limit (e.g. `PageRequest.of(0, 100)` or `PageRequest.of(0, 200)`).
   - Return `ApiResponse.success(service.getPaged(...).getContent())` -> returns `List<T>` in `data`.
4. Benefits:
   - 100% backward compatible with all existing frontend code.
   - 100% memory safety: DB queries always have `LIMIT 100` / `LIMIT 200`, preventing OOM on 512MB RAM VM.
   - Forward compatible: frontend components can adopt pagination incrementally by passing `?page=0&size=20`.

---

## 3. Exact Method Signatures and Repository Changes

### 3.1 Document Module

#### `DocumentRepository.java`
```java
package com.example.zhanfinancebackend.modules.documents.repository;

import com.example.zhanfinancebackend.modules.documents.entity.Document;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    
    @Query(
        value = "SELECT DISTINCT d FROM Document d LEFT JOIN d.task t LEFT JOIN t.client c WHERE d.user.id = :userId OR d.uploadedBy.id = :userId OR c.id = :userId ORDER BY d.createdAt DESC",
        countQuery = "SELECT COUNT(DISTINCT d) FROM Document d LEFT JOIN d.task t LEFT JOIN t.client c WHERE d.user.id = :userId OR d.uploadedBy.id = :userId OR c.id = :userId"
    )
    Page<Document> findByUserIdOrTaskClientId(@Param("userId") Long userId, Pageable pageable);

    @Query(
        value = "SELECT DISTINCT d FROM Document d LEFT JOIN d.user u LEFT JOIN d.task t WHERE u.assignedEmployee.id = :employeeId OR d.uploadedBy.id = :employeeId OR t.assignedTo.id = :employeeId ORDER BY d.createdAt DESC",
        countQuery = "SELECT COUNT(DISTINCT d) FROM Document d LEFT JOIN d.user u LEFT JOIN d.task t WHERE u.assignedEmployee.id = :employeeId OR d.uploadedBy.id = :employeeId OR t.assignedTo.id = :employeeId"
    )
    Page<Document> findForEmployee(@Param("employeeId") Long employeeId, Pageable pageable);

    Page<Document> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Document> findByTaskIdOrderByCreatedAtDesc(Long taskId, Pageable pageable);

    Optional<Document> findByStorageKey(String storageKey);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Document d SET d.generatedFromTemplate = null WHERE d.generatedFromTemplate.id = :templateId")
    void nullifyTemplateReference(@Param("templateId") UUID templateId);
}
```

#### `DocumentService.java`
```java
// User documents (paged + unpaged fallback)
@Transactional(readOnly = true)
public Page<DocumentDto> getUserDocumentsPaged(Long targetUserId, User actor, Pageable pageable) {
    User targetUser = userRepository.findById(targetUserId)
            .orElseThrow(() -> new ResourceNotFoundException("Target user not found"));
    documentAccessService.assertCanCreateFor(actor, targetUser);
    return documentRepository.findByUserIdOrTaskClientId(targetUserId, pageable).map(this::mapToDto);
}

@Transactional(readOnly = true)
public List<DocumentDto> getUserDocuments(Long targetUserId, User actor) {
    Pageable bounded = PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "createdAt"));
    return getUserDocumentsPaged(targetUserId, actor, bounded).getContent();
}

// All visible documents (paged + unpaged fallback)
@Transactional(readOnly = true)
public Page<DocumentDto> getAllVisibleDocumentsPaged(User actor, Pageable pageable) {
    if (actor.getRole() == Role.ADMIN || actor.getRole() == Role.ADVISOR) {
        return documentRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::mapToDto);
    } else if (actor.getRole() == Role.EMPLOYEE) {
        return documentRepository.findForEmployee(actor.getId(), pageable).map(this::mapToDto);
    } else {
        return getUserDocumentsPaged(actor.getId(), actor, pageable);
    }
}

@Transactional(readOnly = true)
public List<DocumentDto> getAllVisibleDocuments(User actor) {
    Pageable bounded = PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "createdAt"));
    return getAllVisibleDocumentsPaged(actor, bounded).getContent();
}

// Task documents (paged + unpaged fallback)
@Transactional(readOnly = true)
public Page<DocumentDto> getTaskDocumentsPaged(Long taskId, User actor, Pageable pageable) {
    Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    crmAccessService.assertCanReadTask(actor, task);
    return documentRepository.findByTaskIdOrderByCreatedAtDesc(taskId, pageable).map(this::mapToDto);
}

@Transactional(readOnly = true)
public List<DocumentDto> getTaskDocuments(Long taskId, User actor) {
    Pageable bounded = PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "createdAt"));
    return getTaskDocumentsPaged(taskId, actor, bounded).getContent();
}
```

#### `DocumentController.java`
```java
@GetMapping
@Operation(summary = "Get list of documents for a user")
public ApiResponse<?> getDocuments(
        @RequestParam(value = "userId", required = false) Long targetUserId,
        @RequestParam(value = "page", required = false) Integer page,
        @RequestParam(value = "size", required = false) Integer size,
        @AuthenticationPrincipal UserPrincipal principal) {
    Long finalTargetUserId = targetUserId != null ? targetUserId : principal.getUser().getId();
    if (page != null && size != null) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        return ApiResponse.success(documentService.getUserDocumentsPaged(finalTargetUserId, principal.getUser(), pageable));
    }
    return ApiResponse.success(documentService.getUserDocuments(finalTargetUserId, principal.getUser()));
}

@GetMapping("/all")
@Operation(summary = "Get all visible documents for the current employee/admin")
public ApiResponse<?> getAllDocuments(
        @RequestParam(value = "page", required = false) Integer page,
        @RequestParam(value = "size", required = false) Integer size,
        @AuthenticationPrincipal UserPrincipal principal) {
    if (page != null && size != null) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        return ApiResponse.success(documentService.getAllVisibleDocumentsPaged(principal.getUser(), pageable));
    }
    return ApiResponse.success(documentService.getAllVisibleDocuments(principal.getUser()));
}

@GetMapping("/task/{taskId}")
@Operation(summary = "Get documents for a specific task")
public ApiResponse<?> getTaskDocuments(
        @PathVariable Long taskId,
        @RequestParam(value = "page", required = false) Integer page,
        @RequestParam(value = "size", required = false) Integer size,
        @AuthenticationPrincipal UserPrincipal principal) {
    if (page != null && size != null) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        return ApiResponse.success(documentService.getTaskDocumentsPaged(taskId, principal.getUser(), pageable));
    }
    return ApiResponse.success(documentService.getTaskDocuments(taskId, principal.getUser()));
}
```

---

### 3.2 Billing: Invoice Module

#### `InvoiceRepository.java`
```java
package com.example.zhanfinancebackend.modules.billing.repository;

import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.billing.entity.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Page<Invoice> findAllByUser(User user, Pageable pageable);
    List<Invoice> findAllByUser(User user);

    Optional<Invoice> findByIdAndUser(Long id, User user);

    Page<Invoice> findAllByUserAssignedEmployee(User employee, Pageable pageable);
    List<Invoice> findAllByUserAssignedEmployee(User employee);

    @Query(
        value = "select invoice from Invoice invoice join fetch invoice.user client left join fetch client.assignedEmployee",
        countQuery = "select count(invoice) from Invoice invoice"
    )
    Page<Invoice> findAllWithClient(Pageable pageable);

    @Query("select invoice from Invoice invoice join fetch invoice.user client left join fetch client.assignedEmployee where invoice.id = :id")
    Optional<Invoice> findByIdWithClient(@Param("id") Long id);

    interface InvoiceStatusSummary {
        Invoice.InvoiceStatus getStatus();
        Long getCount();
        java.math.BigDecimal getTotalAmount();
    }

    List<Invoice> findByStatusAndDueDateBefore(Invoice.InvoiceStatus status, java.time.LocalDate date);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Invoice i SET i.status = :targetStatus WHERE i.status = :sourceStatus AND i.dueDate < :date")
    int bulkUpdateInvoiceStatus(
            @Param("sourceStatus") Invoice.InvoiceStatus sourceStatus,
            @Param("targetStatus") Invoice.InvoiceStatus targetStatus,
            @Param("date") java.time.LocalDate date
    );

    @Query("SELECT i.status as status, COUNT(i.id) as count, SUM(i.amount) as totalAmount FROM Invoice i GROUP BY i.status")
    List<InvoiceStatusSummary> getFinanceSummaryByStatus();
}
```

#### `InvoiceService.java`
```java
@Transactional(readOnly = true)
public Page<InvoiceDto> findAllPaged(User user, Pageable pageable) {
    if (user.getRole() == Role.ADMIN) {
        return invoiceRepository.findAllWithClient(pageable).map(this::toDto);
    }
    if (user.getRole() == Role.EMPLOYEE) {
        return invoiceRepository.findAllByUserAssignedEmployee(user, pageable).map(this::toDto);
    }
    return invoiceRepository.findAllByUser(user, pageable).map(this::toDto);
}

@Transactional(readOnly = true)
public List<InvoiceDto> findAll(User user) {
    Pageable bounded = PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "id"));
    return findAllPaged(user, bounded).getContent();
}
```

#### `InvoiceController.java`
```java
@GetMapping
@PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE', 'CLIENT')")
public ApiResponse<?> findAll(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(required = false) Integer page,
        @RequestParam(required = false) Integer size
) {
    if (page != null && size != null) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "id"));
        return ApiResponse.success(invoiceService.findAllPaged(principal.getUser(), pageable));
    }
    return ApiResponse.success(invoiceService.findAll(principal.getUser()));
}
```

---

### 3.3 Billing: Subscription Module

#### `SubscriptionRepository.java`
```java
package com.example.zhanfinancebackend.modules.billing.repository;

import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.billing.entity.Subscription;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    Page<Subscription> findAllByUser(User user, Pageable pageable);

    List<Subscription> findAllByUser(User user);

    Optional<Subscription> findByIdAndUser(Long id, User user);
}
```

#### `SubscriptionService.java`
```java
@Transactional(readOnly = true)
public Page<SubscriptionDto> findAllPaged(User user, Pageable pageable) {
    return subscriptionRepository.findAllByUser(user, pageable).map(this::toDto);
}

@Transactional(readOnly = true)
public List<SubscriptionDto> findAll(User user) {
    Pageable bounded = PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "id"));
    return findAllPaged(user, bounded).getContent();
}
```

#### `SubscriptionController.java`
```java
@GetMapping
public ApiResponse<?> findAll(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(required = false) Integer page,
        @RequestParam(required = false) Integer size
) {
    if (page != null && size != null) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "id"));
        return ApiResponse.success(subscriptionService.findAllPaged(principal.getUser(), pageable));
    }
    return ApiResponse.success(subscriptionService.findAll(principal.getUser()));
}
```

---

### 3.4 TaskSpecification In-Memory Pagination Fix (CRM Tasks)

#### Problem
In `TaskSpecification.java:30-38`, adding `fetch` joins on `TaskSpecification` causes Hibernate to throw the HHH90003004 warning when used with `taskRepository.findAll(spec, pageable)` and load all matching rows into JVM memory before slicing in Java.

#### Fix
1. In `TaskSpecification.java`: Do not add `fetch` joins when executing a paged specification query.
2. In `TaskService.java:117-121`: Implement a two-query pagination pattern using existing `taskRepository.findAllByIdInWithDetails(ids)`:
```java
@Transactional(readOnly = true)
public Page<TaskDto> getAllTasksPaged(Long clientId, Long assignedToId, Long stageId, Boolean unassigned, int page, int size) {
    Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
    Specification<Task> spec = TaskSpecification.filterTasksWithoutFetches(clientId, assignedToId, stageId, unassigned);
    
    Page<Task> idPage = taskRepository.findAll(spec, pageable);
    List<Long> ids = idPage.getContent().stream().map(Task::getId).toList();
    if (ids.isEmpty()) {
        return new PageImpl<>(Collections.emptyList(), pageable, 0);
    }
    
    List<Task> detailedTasks = taskRepository.findAllByIdInWithDetails(ids);
    Map<Long, Task> taskMap = detailedTasks.stream().collect(Collectors.toMap(Task::getId, Function.identity()));
    List<TaskDto> dtos = ids.stream()
            .map(taskMap::get)
            .filter(Objects::nonNull)
            .map(taskMapper::mapToDto)
            .toList();
            
    return new PageImpl<>(dtos, pageable, idPage.getTotalElements());
}
```

---

## 4. Summary Table of Proposed Changes

| Component | Target File | Line(s) | Current Unbounded Call | Proposed Fix |
|---|---|---|---|---|
| Document | `DocumentController.java` | 49-64 | `getDocuments`, `getAllDocuments`, `getTaskDocuments` | Dual-mode `@RequestParam` (`page`, `size`) with `PageRequest.of(0, 100)` default |
| Document | `DocumentService.java` | 168-207 | Unbounded `documentRepository` queries | Add `Paged` methods accepting `Pageable`, delegating unpaged to bounded (max 100) |
| Document | `DocumentRepository.java` | 11-21 | Methods return `List<Document>` without limit | Add `Pageable` parameters and `countQuery` on custom `@Query` annotations |
| Invoice | `InvoiceController.java` | 76-80 | `findAll` | Dual-mode `@RequestParam` (`page`, `size`) with `PageRequest.of(0, 100)` default |
| Invoice | `InvoiceService.java` | 40-48 | Unbounded `findAllWithClient()` | Add `findAllPaged(User, Pageable)` and bounded default |
| Invoice | `InvoiceRepository.java` | 13-20 | Unbounded list queries | Add `Pageable` to `findAllByUser`, `findAllByUserAssignedEmployee`, `findAllWithClient` |
| Subscription | `SubscriptionController.java` | 30-33 | `findAll` | Dual-mode `@RequestParam` (`page`, `size`) with `PageRequest.of(0, 100)` default |
| Subscription | `SubscriptionService.java` | 26-28 | Unbounded `findAllByUser` | Add `findAllPaged(User, Pageable)` and bounded default |
| Subscription | `SubscriptionRepository.java` | 12 | Unbounded `findAllByUser` | Add overloaded `findAllByUser(User, Pageable)` |
| Task Spec | `TaskSpecification.java` | 30-38 | In-criteria `fetch` joins | Remove `fetch` joins from paged spec query |
| Task Service | `TaskService.java` | 117-121 | `findAll(spec, pageable)` with fetch joins | Two-query approach using `findAllByIdInWithDetails` |
