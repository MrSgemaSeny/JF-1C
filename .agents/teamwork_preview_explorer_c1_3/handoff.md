# Handoff Report: C1 Avatar 404 Prefix Mismatch

## 1. Observation

1. `FileDownloadController.java:46-49`:
   ```java
   @GetMapping("/uploads/avatars/{storageKey:.+}")
   public ResponseEntity<Resource> downloadAvatar(@PathVariable String storageKey) {
       return serveResource(storageKey);
   }
   ```
   Prior to commit `08c2cda1073ff00f7d36bdf41291281a1abae2e8`, line 48 was:
   `return serveResource("avatars/" + storageKey);`

2. `UserService.java:166-169`:
   ```java
   String storageKey = storageService.store(file);
   String fileUrl = "/uploads/avatars/" + storageKey;
   user.setAvatarUrl(fileUrl);
   ```

3. `DatabaseStorageService.java:49-59`:
   ```java
   String storageKey = UUID.randomUUID().toString();
   StoredFile storedFile = new StoredFile(
       storageKey,
       originalFilename,
       file.getContentType(),
       file.getBytes()
   );
   storedFileRepository.save(storedFile);
   return storageKey;
   ```
   In the database table `stored_files`, primary key `id` is saved as the raw UUID (e.g. `3fa85f64-...`) without an `"avatars/"` prefix.

4. `DatabaseStorageService.java:82-89, 123-130`:
   ```java
   java.util.Optional<StoredFile> fileOpt = storedFileRepository.findById(storageKey);
   if (fileOpt.isEmpty()) {
       String altKey = storageKey.startsWith("avatars/")
               ? storageKey.substring("avatars/".length())
               : "avatars/" + storageKey;
       fileOpt = storedFileRepository.findById(altKey);
   }
   ```

5. `DatabaseStorageService.java:170-172`:
   ```java
   @Override
   public void delete(String storageKey) {
       storedFileRepository.deleteById(storageKey);
   }
   ```
   Currently deletes only by exact `storageKey` without checking `altKey`.

6. Existing regression test file: `AvatarDownloadRegressionTest.java` in `src/test/java/com/example/zhanfinancebackend/modules/documents/controller/` contains 3 unit tests verifying raw key serving, prefixed key fallback, and stripped key fallback.

---

## 2. Logic Chain

1. From Observation 2 and Observation 3, when a user uploads an avatar via `UserService.uploadAvatar()`, `DatabaseStorageService.store()` generates a UUID `U` and saves a row in `stored_files` with primary key `id = U`. `UserService` constructs and persists `user.avatarUrl = "/uploads/avatars/" + U`.
2. From Observation 1, the frontend requests `GET /api/uploads/avatars/U`. Spring MVC matches `@GetMapping("/uploads/avatars/{storageKey:.+}")` and binds `@PathVariable String storageKey = U`.
3. When `FileDownloadController` executed `serveResource("avatars/" + storageKey)`, it passed `"avatars/" + U` to `storageService.loadAsResource()`.
4. Because `stored_files` contained `id = U` and not `id = "avatars/" + U`, `storedFileRepository.findById("avatars/" + U)` returned `Optional.empty()`, producing a 404 `ResourceNotFoundException`.
5. Passing `storageKey` directly (as `serveResource(storageKey)`) passes `U` directly to `storageService.loadAsResource(U)`, which finds `id = U` on the primary lookup.
6. From Observation 4, having bidirectional fallback resolution in `DatabaseStorageService` (`storageKey` -> `altKey`) ensures backward compatibility for any legacy records in `stored_files` where the key was saved with `"avatars/"` prefix or unprefixed.
7. From Observation 5, `delete(storageKey)` should be aligned with the fallback pattern so that replacing an avatar cleans up legacy prefixed records if present.

---

## 3. Caveats

1. Local disk storage mode (`app.storage.type=local` via `LocalStorageService`): `LocalStorageService` resolves paths relative to `rootLocation`. While `DatabaseStorageService` contains disk fallback paths for hybrid dev environments, standalone `LocalStorageService` relies on exact path matching.
2. In-flight build error: Gradle test compilation for the entire backend currently fails due to an unrelated compile error in `AuditLogControllerPaginationTest.java` (Issue C3 scope). Running isolated tests for Avatar (`AvatarDownloadRegressionTest`) requires compiling test sources that are not broken by concurrent workspace edits.
3. External avatars (e.g. Google OAuth avatars with URLs starting with `https://`) are not stored locally and bypass `FileDownloadController` via frontend `getSecureImageUrl()` check.

---

## 4. Conclusion

1. **Normalization Strategy**: The optimal architectural strategy is the **dual-layer robust model**:
   - **Controller Layer**: `FileDownloadController` must pass `@PathVariable String storageKey` directly without modification.
   - **Storage Layer**: `DatabaseStorageService` must support bidirectional key resolution (`storageKey` exact lookup first, followed by inverted `altKey` fallback).
2. **Deletions**: Update `DatabaseStorageService.delete()` to also check `altKey` if primary key is not found, ensuring clean lifecycle management.
3. **Regression Suite**: The regression test suite must cover 8 essential scenarios: standard avatar download, legacy prefixed DB lookup, stripped key lookup, dual lookup 404 failure, `loadAsBytes` fallback, avatar replacement lifecycle, MIME type deduction, and path traversal rejection.

---

## 5. Verification Method

To independently verify the C1 fix and regression suite:

1. **Inspect Controller and Storage Service**:
   - Verify `FileDownloadController.java:48` calls `serveResource(storageKey)`.
   - Verify `DatabaseStorageService.java:83-89, 124-130` implements the `altKey` fallback logic.
2. **Run Unit Tests**:
   - Command:
     `./gradlew test --tests "com.example.zhanfinancebackend.modules.documents.controller.AvatarDownloadRegressionTest"`
3. **End-to-End Integration Verification**:
   - Upload an avatar via `POST /api/v1/users/me/avatar` with authenticated user token.
   - Retrieve `avatarUrl` from the response (e.g. `/uploads/avatars/<uuid>`).
   - Perform `GET /api/uploads/avatars/<uuid>` without authentication.
   - Verify HTTP status is 200 OK, `Content-Type` matches image MIME type, and binary body equals uploaded image bytes.
4. **Invalidation Condition**:
   - If `GET /api/uploads/avatars/<uuid>` returns 404 or 401, or if changing `avatarUrl` to a legacy prefixed format breaks resolution, the fix is invalidated.
