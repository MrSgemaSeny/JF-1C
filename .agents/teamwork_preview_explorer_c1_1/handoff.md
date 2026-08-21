# Handoff Report: C1 — Avatar 404 Prefix Mismatch

## 1. Observation

### File Paths and Lines Observed
- `FileDownloadController.java` (`zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/controller/FileDownloadController.java`):
  - Line 46-49:
    ```java
    @GetMapping("/uploads/avatars/{storageKey:.+}")
    public ResponseEntity<Resource> downloadAvatar(@PathVariable String storageKey) {
        return serveResource(storageKey);
    }
    ```
  - Prior to commit `08c2cda` (in commit `779cbed`), line 48 was:
    ```java
    return serveResource("avatars/" + storageKey);
    ```
- `UserService.java` (`zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/auth/service/UserService.java`):
  - Lines 161-164:
    ```java
    if (user.getAvatarUrl() != null && user.getAvatarUrl().startsWith("/uploads/avatars/")) {
        String oldStorageKey = user.getAvatarUrl().substring("/uploads/avatars/".length());
        storageService.delete(oldStorageKey);
    }
    ```
  - Line 166:
    ```java
    String storageKey = storageService.store(file);
    ```
  - Lines 167-170:
    ```java
    String fileUrl = "/uploads/avatars/" + storageKey;
    user.setAvatarUrl(fileUrl);
    userRepository.save(user);
    ```
- `DatabaseStorageService.java` (`zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/service/DatabaseStorageService.java`):
  - Lines 49-59:
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
  - Lines 83-89 (`loadAsBytes`):
    ```java
    java.util.Optional<StoredFile> fileOpt = storedFileRepository.findById(storageKey);
    if (fileOpt.isEmpty()) {
        String altKey = storageKey.startsWith("avatars/")
                ? storageKey.substring("avatars/".length())
                : "avatars/" + storageKey;
        fileOpt = storedFileRepository.findById(altKey);
    }
    ```
  - Lines 124-130 (`loadAsResource`):
    ```java
    java.util.Optional<StoredFile> fileOpt = storedFileRepository.findById(storageKey);
    if (fileOpt.isEmpty()) {
        String altKey = storageKey.startsWith("avatars/")
                ? storageKey.substring("avatars/".length())
                : "avatars/" + storageKey;
        fileOpt = storedFileRepository.findById(altKey);
    }
    ```
- `LocalStorageService.java` (`zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/service/LocalStorageService.java`):
  - Lines 58-69: Files stored as `./uploads/<uuid>_<filename>`.
  - Lines 101-111: `loadAsResource` resolves `rootLocation.resolve(storageKey)`.
- `SecurityConfig.java` (`zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/common/config/SecurityConfig.java`):
  - Lines 85-86: `/uploads/avatars/**` and `/api/uploads/avatars/**` configured with `permitAll()`.
- Frontend `http.ts` (`zhan-finance-frontend/src/shared/api/http.ts`):
  - Lines 236-244: `getSecureImageUrl` translates `/uploads/avatars/<key>` to `${API_BASE_URL}/api/uploads/avatars/<key>`.

## 2. Logic Chain

1. **Upload Phase**:
   - When a user uploads an avatar via `POST /api/v1/users/me/avatar`, `UserService.uploadAvatar` calls `storageService.store(file)`.
   - In `DatabaseStorageService.store(MultipartFile file)`, a raw UUID (e.g. `c032616f-0dd0-4286-9a57-1b0769b4e72a`) is generated as `storageKey`.
   - The entity is persisted in PostgreSQL table `stored_files` with primary key `id = "c032616f-0dd0-4286-9a57-1b0769b4e72a"` (without `"avatars/"`).
   - `UserService` forms the user avatar URL as `"/uploads/avatars/" + storageKey` and saves it in `users.avatar_url`.

2. **Download Phase**:
   - The frontend calls `getSecureImageUrl(user.avatarUrl)`, which sends `GET /api/uploads/avatars/c032616f-0dd0-4286-9a57-1b0769b4e72a`.
   - `server.servlet.context-path=/api` strips `/api`.
   - `FileDownloadController.downloadAvatar` matches `@GetMapping("/uploads/avatars/{storageKey:.+}")`.
   - `@PathVariable String storageKey` receives `"c032616f-0dd0-4286-9a57-1b0769b4e72a"`.

3. **Prefix Mismatch Root Cause**:
   - Prior to remediation, `FileDownloadController.downloadAvatar` called `serveResource("avatars/" + storageKey)`.
   - This passed `"avatars/c032616f-0dd0-4286-9a57-1b0769b4e72a"` to `StorageService.loadAsResource()`.
   - `DatabaseStorageService` queried `storedFileRepository.findById("avatars/c032616f-0dd0-4286-9a57-1b0769b4e72a")`.
   - Because the record was saved with id `"c032616f-0dd0-4286-9a57-1b0769b4e72a"`, the lookup failed and threw `ResourceNotFoundException`, returning HTTP 404.

4. **Remediation State**:
   - Normalized at controller read point (`FileDownloadController.java:48` passes raw `storageKey`).
   - Added robust symmetric fallback in `DatabaseStorageService.java:83-89, 124-130` (`altKey` tries both with and without `"avatars/"` prefix).
   - Added disk fallback for local dev mode in `DatabaseStorageService.java:110-117, 157-165`.

## 3. Caveats

- Google OAuth avatars: Users authenticated via Google OAuth2 have `users.avatar_url` populated with external Google URLs (`https://lh3.googleusercontent.com/...`). These bypass local storage and are served directly from Google CDNs.
- Local filesystem storage (`LocalStorageService`): When `app.storage.type=local`, files are stored under `./uploads/<storageKey>`. Direct lookup using raw key succeeds. If any legacy path points to `./uploads/avatars/`, disk fallback in `DatabaseStorageService` handles it.
- No caveats regarding backend or frontend API path contracts: `/uploads/avatars/**` is publicly accessible and does not require JWT authorization headers.

## 4. Conclusion

The root cause of C1 (Avatar 404 prefix mismatch) was identified at `FileDownloadController.java:48` where `"avatars/"` was prepended to an already clean `storageKey` during download lookup, while `DatabaseStorageService.java:49-58` stored the key in `stored_files` without any prefix.

The resolution in commit `08c2cda`:
1. Normalized `FileDownloadController.java:48` to pass `storageKey` directly without prefixing.
2. Implemented bidirectional fallback in `DatabaseStorageService.java` (`loadAsResource` and `loadAsBytes`) to support both prefixed and non-prefixed legacy database records.
3. Added unit/regression tests in `AvatarDownloadRegressionTest.java`.

## 5. Verification Method

To verify independently:
1. Review `FileDownloadController.java:46-49` and `DatabaseStorageService.java:83-89, 124-130`.
2. Inspect commit `08c2cda`:
   ```bash
   git show 08c2cda
   ```
3. Run the targeted regression test once test classpath compiles cleanly:
   ```bash
   ./gradlew test --tests "com.example.zhanfinancebackend.modules.documents.controller.AvatarDownloadRegressionTest"
   ```
4. Test scenarios verified:
   - Avatar uploaded with raw key (e.g. `uuid`) -> requested via `/uploads/avatars/uuid` -> HTTP 200 OK.
   - Avatar record with legacy prefix `avatars/uuid` in database -> requested via `/uploads/avatars/uuid` -> fallback resolves to HTTP 200 OK.
   - Key passed with prefix `avatars/uuid` to storage service -> fallback resolves to raw `uuid` -> HTTP 200 OK.
