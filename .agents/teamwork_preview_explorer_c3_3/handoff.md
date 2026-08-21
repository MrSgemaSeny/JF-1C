# Handoff Report: C3 TaskSpecification In-Memory Pagination Fix

## 1. Observation
1. **TaskSpecification.java (lines 13-42):**
   `TaskSpecification.filterTasks` conditionally adds `root.fetch` on `client`, `client.assignedEmployee`, `assignedTo`, `createdBy`, and `stage`, along with `query.distinct(true)` when `query.getResultType()` is not count. It does not fetch collections directly or `stage.pipeline`.
2. **TaskService.java (lines 116-121):**
   `getAllTasksPaged` executes `taskRepository.findAll(spec, pageable).map(taskMapper::mapToDto)`.
3. **Task Entity (Task.java lines 80-115) & TaskMapper (TaskMapper.java lines 32-75):**
   `Task` has 6 collections: `subtasks`, `tags`, `services`, `userLabels`, `comments`, `history` annotated with `@Fetch(FetchMode.SUBSELECT)`. `TaskMapper` accesses `userLabels`, `services`, `subtasks`, `tags`, and `stage.pipeline`.
4. **Hibernate Pagination Mechanics (HHH90003004):**
   When `fetch join` on collection relations is applied with `Pageable`, Hibernate detects row multiplication from the Cartesian product and strips SQL `LIMIT` / `OFFSET` clauses, logging `HHH90003004: firstResult/maxResults specified with collection fetch; applying in memory!`. All rows are loaded into heap memory and sliced in Java.
5. **TaskRepository.java (line 57):**
   `TaskRepository` already defines a bulk fetch method `findAllByIdInWithDetails(@Param("ids") List<Long> ids)`, which can be expanded to fetch all to-one relationships and collections for a subset of IDs.

---

## 2. Logic Chain
1. **Premise 1:** Combining collection fetch joins with `Pageable` in JPA queries forces Hibernate to omit database-level `LIMIT`/`OFFSET` and execute in-memory pagination, violating 512MB RAM constraints on Fly.io.
2. **Premise 2:** Omitting collection fetches from the specification while mapping collections in `TaskMapper` triggers lazy loading or subselect executions.
3. **Inference 1:** The optimal architecture is the Two-Query (ID Page + Bulk Fetch) pattern:
   - **Query 1:** Run `taskRepository.findAll(spec, pageable)` with pure filtering criteria and zero collection fetch joins. This guarantees database-level SQL `LIMIT ? OFFSET ?` and a fast count query.
   - **Query 2:** Extract the page's IDs (`List<Long> taskIds`) and execute `taskRepository.findAllByIdInWithDetails(taskIds)` to fetch all associations only for the returned page items.
4. **Inference 2:** Because SQL `IN (:ids)` does not guarantee result order, mapping through `Map<Long, Task>` is mandatory to preserve the exact sort order from Query 1.
5. **Inference 3:** When `taskPage.isEmpty()`, Query 2 is bypassed, returning `Page.empty(pageable)` with zero unnecessary DB roundtrips.

---

## 3. Caveats
1. This report focuses specifically on C3 in CRM (`TaskSpecification` and `TaskService`). Other list endpoints identified in C3 (Notifications, Documents, Invoices, Subscriptions) also require `Pageable` parameters added to their controllers and services during Phase 2.
2. When bulk fetching `services` in Query 2, Hibernate handles `@Fetch(FetchMode.SUBSELECT)` for other collections (`userLabels`, `subtasks`, `tags`) efficiently for the loaded batch without `MultipleBagFetchException`.

---

## 4. Conclusion
1. `TaskSpecification.filterTasks` must be simplified to contain only search predicates (no collection fetches, no redundant distinct flags).
2. `TaskService.getAllTasksPaged` must implement the Two-Query pattern:
   - First query fetches `Page<Task>` with database-level `LIMIT`/`OFFSET`.
   - Second query fetches complete entity details via `taskRepository.findAllByIdInWithDetails(taskIds)` for only the current page.
   - Preserves sort order via ID map reordering before DTO mapping.
3. All code modifications are fully designed and documented in `analysis.md` for immediate implementation during Phase 2 Remediation.

---

## 5. Verification Method
1. **Automated Integration Test**:
   Execute `./gradlew test --tests TaskServiceIntegrationTests` to verify CRM integration tests pass.
2. **Database Limit/Offset & Order Regression Test**:
   Add a test method in `TaskServiceIntegrationTests.java` verifying:
   - `getAllTasksPaged(null, null, null, null, 0, 5)` returns exactly 5 items sorted descending by ID.
   - Consecutive pages (`page=0, size=5` and `page=1, size=5`) contain non-overlapping ID sets.
   - No `HHH90003004` warning is output in test logs.
   - All DTO fields (client, stage, pipeline, services, userLabels) are populated.
