# Handoff Report: Issue C1 Investigation (Avatar 404 Prefix Mismatch)

## 1. Observation

### 1.1 Backend Avatar Handling
- **`src/main/java/com/example/zhanfinancebackend/modules/auth/entity/User.java:29-30`**:
  ```java
  @Column(name = "avatar_url", length = 512)
  private String avatarUrl;
  ```
- **`src/main/java/com/example/zhanfinancebackend/modules/auth/service/UserService.java:166-170`**:
  ```java
  String storageKey = storageService.store(file);
  String fileUrl = "/uploads/avatars/" + storageKey;
  user.setAvatarUrl(fileUrl);
  userRepository.save(user);
  ```
- **`src/main/java/com/example/zhanfinancebackend/modules/documents/service/DatabaseStorageService.java:49-59`**:
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
- **`src/main/java/com/example/zhanfinancebackend/modules/documents/controller/FileDownloadController.java:46-49`**:
  ```java
  @GetMapping("/uploads/avatars/{storageKey:.+}")
  public ResponseEntity<Resource> downloadAvatar(@PathVariable String storageKey) {
      return serveResource(storageKey);
  }
  ```
  Note: Prior to commit `08c2cda`, line 48 was `return serveResource("avatars/" + storageKey);`.
- **`src/main/java/com/example/zhanfinancebackend/modules/documents/service/DatabaseStorageService.java:83-89, 124-130`**:
  Bidirectional fallback implemented:
  ```java
  java.util.Optional<StoredFile> fileOpt = storedFileRepository.findById(storageKey);
  if (fileOpt.isEmpty()) {
      String altKey = storageKey.startsWith("avatars/")
              ? storageKey.substring("avatars/".length())
              : "avatars/" + storageKey;
      fileOpt = storedFileRepository.findById(altKey);
  }
  ```

### 1.2 Security Configuration
- **`src/main/java/com/example/zhanfinancebackend/common/config/SecurityConfig.java:77-91`**:
  ```java
  .requestMatchers(
      "/v1/auth/**",
      "/v1/contact-requests",
      "/v1/contact-requests/*/files",
      "/v1/services",
      "/v1/services/highlighted",
      "/v1/courses/certificates/verify/**",
      "/uploads/avatars/**",
      "/api/uploads/avatars/**",
      "/ws/**",
      "/api/ws/**",
      "/actuator/health",
      "/actuator/info"
  ).permitAll()
  ```
  Public access is permitted for avatars without JWT tokens.

### 1.3 Frontend Consumption
- **`zhan-finance-frontend/src/shared/api/http.ts:236-244`**:
  ```typescript
  export function getSecureImageUrl(url: string | undefined): string | undefined {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    if (cleanUrl.startsWith('/uploads/') && !cleanUrl.startsWith('/api/')) {
      return `${API_BASE_URL}/api${cleanUrl}`;
    }
    return `${API_BASE_URL}${cleanUrl}`;
  }
  ```
- **`SettingsPage.tsx:159`**, **`DashboardLayout.tsx:69, 84`**, **`DashboardSidebar.tsx:221`**, **`TaskKanbanCard.tsx:196`**, **`ChatDrawer.tsx:190`**, **`ClientChatPage.tsx:280, 340`**, **`EmployeeChatPage.tsx:293, 355`**:
  All render avatar images using `getSecureImageUrl(...)`.

### 1.4 Tests
- **`src/test/java/com/example/zhanfinancebackend/modules/documents/controller/AvatarDownloadRegressionTest.java`**:
  3 unit tests verifying raw key lookup, prefixed fallback lookup, and stripped prefix lookup.

---

## 2. Logic Chain

1. **Storage Key Creation**: `DatabaseStorageService.store` generates a bare UUID (e.g. `d17a3a9a-e18e-4a69-9f7a-8742b78b5329`) and saves it as primary key in `stored_files`. (Obs. 1.1)
2. **URL Construction**: `UserService.uploadAvatar` constructs `/uploads/avatars/<UUID>` and assigns it to `user.avatarUrl`. (Obs. 1.1)
3. **Frontend Resolution**: `getSecureImageUrl` converts `/uploads/avatars/<UUID>` into `${API_BASE_URL}/api/uploads/avatars/<UUID>`, or preserves external OAuth URLs starting with `http`. (Obs. 1.3)
4. **Spring Routing**: `server.servlet.context-path=/api` routes `/api/uploads/avatars/<UUID>` to `FileDownloadController.downloadAvatar` with `@PathVariable String storageKey` equal to `<UUID>`. (Obs. 1.1)
5. **Lookup Mismatch (The Defect)**: Previously, `FileDownloadController` passed `"avatars/" + storageKey` to `loadAsResource`. When looking for `"avatars/<UUID>"` in `stored_files` (which contained `<UUID>`), the record was not found, returning 404. (Obs. 1.1)
6. **Remediation**: In commit `08c2cda`, `FileDownloadController` was corrected to pass `storageKey` directly without synthetic prefix. Additionally, `DatabaseStorageService` was enhanced with bidirectional fallback (`altKey`), allowing any legacy records stored with `avatars/` to resolve seamlessly. (Obs. 1.1, 1.4)
7. **Security Verification**: `SecurityConfig` allows unauthenticated access to `/uploads/avatars/**` and `/api/uploads/avatars/**`, ensuring `<img src="...">` tags load without requiring Bearer auth headers. (Obs. 1.2)

---

## 3. Caveats

1. Local disk storage mode (`app.storage.type=local`) was analyzed via static code inspection of `LocalStorageService.java`. In local mode, files are saved directly in `./uploads/<key>`. Since `downloadAvatar` now passes the direct key, local mode is aligned with DB mode.
2. In the full test suite run, an unrelated compilation issue was encountered in `AuditLogControllerPaginationTest.java` (C3 scope) due to getter naming. This is external to the avatar subsystem.
3. No other caveats.

---

## 4. Conclusion

- Root cause for C1 is confirmed: `FileDownloadController.java` previously added `"avatars/"` prefix to `storageKey` during lookup, whereas `DatabaseStorageService` stores the raw UUID key in `stored_files`.
- The fix implemented in commit `08c2cda` on branch `audit/pre-release` resolves the prefix mismatch directly and provides backward-compatible fallback for legacy keys in `DatabaseStorageService`.
- Security filter rules in `SecurityConfig.java` properly permit unauthenticated avatar downloads (`.permitAll()`) while keeping documents (`/uploads/**`) authenticated.
- Frontend components uniformly use `getSecureImageUrl(...)` from `http.ts`, correctly mapping relative paths to `/api/uploads/avatars/...` and preserving Google OAuth URLs.
- No further code changes are required for C1.

---

## 5. Verification Method

To independently verify the C1 fix:
1. Inspect `src/main/java/com/example/zhanfinancebackend/modules/documents/controller/FileDownloadController.java:46-50` to confirm `downloadAvatar` passes `storageKey` to `serveResource(storageKey)`.
2. Inspect `src/main/java/com/example/zhanfinancebackend/modules/documents/service/DatabaseStorageService.java:83-89, 124-130` to confirm bidirectional `altKey` fallback.
3. Inspect `src/main/java/com/example/zhanfinancebackend/common/config/SecurityConfig.java:85-86` to confirm `/uploads/avatars/**` and `/api/uploads/avatars/**` are in `permitAll()`.
4. Run unit regression tests for avatar download:
   ```bash
   ./gradlew test --tests "com.example.zhanfinancebackend.modules.documents.controller.AvatarDownloadRegressionTest"
   ```
5. Check frontend URL resolution in `zhan-finance-frontend/src/shared/api/http.ts:236-244`.
