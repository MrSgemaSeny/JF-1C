# Technical Analysis: Issue C1 (Avatar 404 Prefix Mismatch)

## 1. Executive Summary
This document presents the detailed architectural and code-level investigation of Issue C1 (Avatar 404 Prefix Mismatch) across the JF-1C platform. The investigation covers the full lifecycle of avatar images: upload, database storage, URL generation, security filter configuration, REST controller routing, and frontend component rendering.

---

## 2. Problem Statement & Root Cause

### 2.1 The Issue
In Phase 1 pre-release audit, user avatars failed to load (returning HTTP 404 Not Found) when requested by client browsers.

### 2.2 Root Cause Mechanism
1. **Upload / Storage Step**:
   - When a user uploads an avatar via `POST /api/v1/users/me/avatar`, `UserService.uploadAvatar` calls `StorageService.store(file)`.
   - `DatabaseStorageService.store` generates a raw UUID string `UUID.randomUUID().toString()` (e.g. `d17a3a9a-e18e-4a69-9f7a-8742b78b5329`), creates a `StoredFile` entity with `id = storageKey`, and saves it to the `stored_files` table.
   - `UserService.uploadAvatar` constructs the URL string `/uploads/avatars/` + `storageKey` and saves it to `app_users.avatar_url`.

2. **Client Request Step**:
   - Frontend components use `getSecureImageUrl(user.avatarUrl)` from `@/shared/api/http`.
   - `getSecureImageUrl` turns `/uploads/avatars/<UUID>` into `${API_BASE_URL}/api/uploads/avatars/<UUID>`.
   - Browser makes a `GET` request to `/api/uploads/avatars/<UUID>`.

3. **Backend Routing & Lookup Step (The Bug Location)**:
   - Spring Boot context path is configured as `server.servlet.context-path=/api` in `application.properties`.
   - The request `/api/uploads/avatars/<UUID>` matches `@GetMapping("/uploads/avatars/{storageKey:.+}")` in `FileDownloadController`.
   - Spring MVC extracts `@PathVariable String storageKey` as `<UUID>`.
   - In the initial codebase, `FileDownloadController.java:48` previously executed:
     ```java
     return serveResource("avatars/" + storageKey);
     ```
   - This passed `"avatars/" + "<UUID>"` to `storageService.loadAsResource()`.
   - `DatabaseStorageService.loadAsResource` looked up `storedFileRepository.findById("avatars/<UUID>")`.
   - Because the record in `stored_files` was stored with `id = "<UUID>"` (no prefix), the repository query returned empty (`Optional.empty()`), throwing `ResourceNotFoundException("Could not read file: avatars/<UUID>")` -> HTTP 404.

---

## 3. Deep Dive into Code Components

### 3.1 Backend Entities, DTOs, and Services

#### `User.java` (`com.example.zhanfinancebackend.modules.auth.entity.User`)
- Stores avatar path in `avatarUrl` (`@Column(name = "avatar_url", length = 512)`).
- Can hold either:
  - Local uploaded path: `/uploads/avatars/<storageKey>`
  - External OAuth URL: `https://lh3.googleusercontent.com/...` (from Google OAuth)

#### `UserProfileDto.java` & `AuthResponse.java`
- `UserProfileDto`: contains `avatarUrl` field, returned by `GET /v1/users/me`, `PUT /v1/users/me`, `POST /v1/users/me/avatar`.
- `AuthResponse`: contains `avatarUrl` field, returned upon `POST /v1/auth/login`, `POST /v1/auth/google`, `POST /v1/auth/refresh`, `GET /v1/auth/me`.
- `UserDto`: does NOT contain `avatarUrl` (used for lightweight internal task assignment DTOs).

#### `UserService.java`
- `uploadAvatar(Long userId, MultipartFile file)`:
  - Validates `user.getAuthProvider() != AuthProvider.GOOGLE`.
  - Validates `!file.isEmpty()` and `contentType.startsWith("image/")`.
  - Cleans up old avatar if `user.getAvatarUrl().startsWith("/uploads/avatars/")` by calling `storageService.delete(oldStorageKey)`.
  - Stores new file via `storageService.store(file)` -> returns `storageKey`.
  - Sets `user.setAvatarUrl("/uploads/avatars/" + storageKey)`.
  - Saves user and returns updated profile DTO.

#### `GoogleAuthService.java`
- Extracts profile `picture` URL from Google ID token payload.
- If user has no avatar (`user.getAvatarUrl() == null`), assigns `user.setAvatarUrl(picture)`.

#### `FileDownloadController.java`
- `@GetMapping("/uploads/{storageKey:.+}")`: Protected by `@PreAuthorize("isAuthenticated()")` and `DocumentAccessService.assertCanRead` for secure document downloads.
- `@GetMapping("/uploads/avatars/{storageKey:.+}")`: Public endpoint for avatars.
  - Calls `serveResource(storageKey)`.
  - Inspects file extension to set `Content-Type` header (`image/png`, `image/jpeg`, etc.).
  - Returns `Content-Disposition: inline`.

#### `DatabaseStorageService.java`
- Implements `StorageService`.
- `@ConditionalOnProperty(name = "app.storage.type", havingValue = "db", matchIfMissing = true)`.
- `store(MultipartFile)`: stores byte array directly in `stored_files` table with UUID key.
- `loadAsBytes` / `loadAsResource`:
  1. Searches for exact `storageKey` in `storedFileRepository`.
  2. Fallback: computes `altKey` by stripping or prepending `avatars/` and checks `storedFileRepository`.
  3. Fallback: delegates to `LocalStorageService` (if active) for both raw and `altKey`.
  4. Fallback: direct disk check `./uploads` and `./uploads/avatars`.

---

### 3.2 Frontend Avatar Consumption

#### `http.ts` (`zhan-finance-frontend/src/shared/api/http.ts`)
- `API_BASE_URL`: defaults to `https://zhanfinance.fly.dev` or `VITE_API_URL`.
- `getSecureImageUrl(url)`:
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
  - Handles Google URLs: `https://...` -> unchanged.
  - Handles backend relative URLs: `/uploads/avatars/xyz` -> `${API_BASE_URL}/api/uploads/avatars/xyz`.

#### Frontend Components
1. **`SettingsPage.tsx`**: Displays avatar preview via `getSecureImageUrl(profile.avatarUrl)` and upload file input calling `userApi.uploadAvatar()`.
2. **`DashboardLayout.tsx`**: Renders avatar in header bar; falls back to initials if `user.avatarUrl` is absent.
3. **`DashboardSidebar.tsx`**: Renders avatar in user footer card.
4. **`TaskKanbanCard.tsx`**: Renders assigned employee avatar via `getSecureImageUrl(task.assignedTo.avatarUrl)`.
5. **`ChatDrawer.tsx` / `ClientChatPage.tsx` / `EmployeeChatPage.tsx`**: Renders contact avatar via `getSecureImageUrl(contact.avatarUrl)`.

---

### 3.3 Security Configuration & Access Rules

#### `SecurityConfig.java`
- `server.servlet.context-path=/api`.
- In `SecurityConfig.java:77-101`:
  ```java
  .authorizeHttpRequests(auth -> auth
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
      ...
      .anyRequest().authenticated()
  )
  ```
- **Analysis**:
  - `/uploads/avatars/**` and `/api/uploads/avatars/**` are explicitly listed in `.permitAll()`.
  - This allows standard HTML `<img>` elements to fetch avatars without Bearer tokens.
  - Protected documents (`/uploads/**`) remain subject to `.anyRequest().authenticated()` and row-level permission checks.
- **Rate Limiting**:
  - `ApiRateLimitFilter` only filters paths starting with `/api/v1/`, leaving `/api/uploads/avatars/**` unthrottled during page renders with multiple avatar assets.

---

## 4. Current State & Remediation Verification

### 4.1 Remediation in Commit `08c2cda`
The C1 issue was remediated in commit `08c2cda` on branch `audit/pre-release`:
1. `FileDownloadController.java:48`:
   - Changed `return serveResource("avatars/" + storageKey);` -> `return serveResource(storageKey);`.
2. `DatabaseStorageService.java:83-89, 124-130`:
   - Added bidirectional fallback for legacy keys:
     ```java
     String altKey = storageKey.startsWith("avatars/")
             ? storageKey.substring("avatars/".length())
             : "avatars/" + storageKey;
     fileOpt = storedFileRepository.findById(altKey);
     ```
3. Regression Test `AvatarDownloadRegressionTest.java`:
   - Added 3 unit tests verifying raw key lookup, prefixed key fallback, and stripped key fallback.

---

## 5. Potential Edge Cases & Recommendations

1. **Local Disk Storage vs DB Storage**:
   - In production, `app.storage.type=db` is used.
   - For local development with `app.storage.type=local`, `LocalStorageService.loadAsResource` expects the file directly in `./uploads/<key>`. If `store()` in `LocalStorageService` is used, it saves as `UUID_filename`. Since `downloadAvatar` now passes `storageKey` directly, local storage also resolves correctly without artificial prefix distortion.
2. **Avatar Cache Headers**:
   - `FileDownloadController.serveResource` currently returns `ResponseEntity.ok()`. Adding `Cache-Control: max-age=86400, public` (or ETag/Last-Modified) is an optional performance enhancement (non-blocking).
3. **AuditLogControllerPaginationTest Compilation Note**:
   - During regression test runs, an unrelated compilation issue was noted in `AuditLogControllerPaginationTest.java` (using `.getData()` instead of `.data()`). This is in the C3 domain and does not impact C1 avatar functionality.
