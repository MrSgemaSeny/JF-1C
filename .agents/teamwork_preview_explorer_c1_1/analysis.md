# Investigation Analysis: C1 - Avatar 404 Prefix Mismatch

## 1. Executive Summary

Investigation of C1 (Avatar 404 prefix mismatch) within the JF-1C codebase. The issue stems from a mismatch between the storage key stored in `stored_files` / local disk during upload and the key queried by `FileDownloadController` during download.

## 2. File Inventory and Architecture Roles

- `FileDownloadController.java` (`zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/controller/FileDownloadController.java`)
  - Endpoints:
    - `@GetMapping("/uploads/{storageKey:.+}")` — authenticated download for general documents with `documentAccessService` authorization.
    - `@GetMapping("/uploads/avatars/{storageKey:.+}")` — public avatar download (`SecurityConfig.java` allows unauthenticated access).
  - Handles serving resource bytes with appropriate Content-Type and Content-Disposition headers.

- `StorageService.java` (`zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/service/StorageService.java`)
  - Contract defining file storage operations: `store(MultipartFile)`, `store(byte[], String, String)`, `loadAsResource(String)`, `loadAsBytes(String)`, `delete(String)`.

- `DatabaseStorageService.java` (`zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/service/DatabaseStorageService.java`)
  - Active when `app.storage.type=db` (default).
  - Stores binary content directly into PostgreSQL `stored_files` table (`id VARCHAR(255)`, `file_name`, `content_type`, `data BYTEA`).
  - Fallbacks to `LocalStorageService` and direct disk path `./uploads/`.

- `LocalStorageService.java` (`zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/documents/service/LocalStorageService.java`)
  - Active when `app.storage.type=local`.
  - Stores files on filesystem under root directory (default `./uploads`).

- `UserService.java` (`zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/modules/auth/service/UserService.java`)
  - Manages avatar upload (`uploadAvatar`), deletion of old avatar, and persistence of `avatar_url` on `User` entity.

- `SecurityConfig.java` (`zhan-finance-backend/src/main/java/com/example/zhanfinancebackend/common/config/SecurityConfig.java`)
  - Permits unauthenticated access to `/uploads/avatars/**` and `/api/uploads/avatars/**`.

- Frontend `http.ts` (`zhan-finance-frontend/src/shared/api/http.ts`)
  - `getSecureImageUrl(url)` prefixes relative upload paths with `${API_BASE_URL}/api`.

## 3. End-to-End Flow Tracing

### 3.1 Avatar Upload Flow

1. **Client Request**: Frontend calls `POST /api/v1/users/me/avatar` with a `multipart/form-data` image file.
2. **Controller**: `UserController.java:56-62` receives the request and delegates to `userService.uploadAvatar(principal.getId(), file)`.
3. **Validation & Old Avatar Cleanup** (`UserService.java:143-165`):
   - Confirms auth provider is not `GOOGLE` (Google avatars sync automatically).
   - Confirms file is non-empty and has `image/*` MIME type.
   - If user already has an avatar URL starting with `/uploads/avatars/`, extracts `oldStorageKey = user.getAvatarUrl().substring("/uploads/avatars/".length())` and calls `storageService.delete(oldStorageKey)`.
4. **Storage Key Generation & Persistence** (`UserService.java:166`):
   - Calls `String storageKey = storageService.store(file)`.
   - In `DatabaseStorageService.java:49-59`:
     - Generates raw UUID: `String storageKey = UUID.randomUUID().toString();` (e.g., `4096cb34-c7ec-4ca4-bb6d-4952d77d70cf`).
     - Constructs `StoredFile` with primary key `id = storageKey`.
     - Persists to `stored_files` table. Note: `id` contains NO `"avatars/"` prefix.
     - Returns `storageKey` (`"4096cb34-c7ec-4ca4-bb6d-4952d77d70cf"`).
   - In `LocalStorageService.java:58-69`:
     - Generates `storageKey = UUID.randomUUID().toString() + "_" + originalFilename`.
     - Writes file directly to `./uploads/<storageKey>`.
     - Returns `storageKey`.
5. **User Entity Update** (`UserService.java:167-170`):
   - Generates URL: `String fileUrl = "/uploads/avatars/" + storageKey;`.
   - Sets `user.setAvatarUrl(fileUrl);`.
   - Saves `user` entity to `users` table (`users.avatar_url = "/uploads/avatars/4096cb34-c7ec-4ca4-bb6d-4952d77d70cf"`).
   - Returns `UserProfileDto` containing `avatarUrl`.

### 3.2 Avatar Download & Resolution Flow

1. **Frontend Image Resolution**:
   - Components invoke `getSecureImageUrl(user.avatarUrl)`.
   - In `http.ts:236-244`, `getSecureImageUrl("/uploads/avatars/4096cb34-...")` produces `${API_BASE_URL}/api/uploads/avatars/4096cb34-...`.
   - Browser requests `GET /api/uploads/avatars/4096cb34-c7ec-4ca4-bb6d-4952d77d70cf`.
2. **Context Path & Security**:
   - `server.servlet.context-path=/api` strips `/api`.
   - `SecurityConfig.java:85-86` matches `/uploads/avatars/**` and allows access without authentication headers.
3. **Controller Handling** (`FileDownloadController.java:46-49`):
   - `@GetMapping("/uploads/avatars/{storageKey:.+}")` extracts path variable `@PathVariable String storageKey`.
   - `storageKey` is parsed as `"4096cb34-c7ec-4ca4-bb6d-4952d77d70cf"`.
   - Invokes `serveResource(storageKey)`.
4. **Storage Lookup** (`DatabaseStorageService.java:123-167`):
   - Queries `storedFileRepository.findById(storageKey)`.
   - Matches record where `id = "4096cb34-c7ec-4ca4-bb6d-4952d77d70cf"`.
   - Returns `ByteArrayResource` containing image data.
   - Sets Content-Type (e.g., `image/png`, `image/jpeg`) and Content-Disposition inline header.
   - Returns HTTP 200 OK with binary payload.

## 4. Root Cause Analysis of Prefix Mismatch

### 4.1 The Exact Mismatch Points

- **Historical Failure Point**:
  - In prior implementation (`FileDownloadController.java:48`), the method invoked `serveResource("avatars/" + storageKey)`.
  - The parameter passed to `StorageService.loadAsResource` became `"avatars/4096cb34-c7ec-4ca4-bb6d-4952d77d70cf"`.
  - In `DatabaseStorageService.java`, the primary key query executed `storedFileRepository.findById("avatars/4096cb34-c7ec-4ca4-bb6d-4952d77d70cf")`.
  - Because `DatabaseStorageService.store` saved the entity with primary key `"4096cb34-c7ec-4ca4-bb6d-4952d77d70cf"` without `"avatars/"`, the repository returned `Optional.empty()`.
  - The service threw `ResourceNotFoundException("Could not read file: avatars/4096cb34-...")` resulting in HTTP 404 Not Found.
  - In `LocalStorageService.java:101-111`, resolving `"avatars/4096cb34-..."` checked `./uploads/avatars/4096cb34-...`, which did not exist on disk because files were written directly to `./uploads/4096cb34-...`.

### 4.2 Remediation Verification (Commit 08c2cda)

- Fixed in commit `08c2cda`:
  1. `FileDownloadController.java:48`: `downloadAvatar` now passes `storageKey` directly to `serveResource(storageKey)`.
  2. `DatabaseStorageService.java:83-89, 124-130`: Added symmetric bidirectional fallback:
     - First attempts direct lookup by `storageKey`.
     - If not found, attempts lookup with alternate key:
       - If `storageKey` starts with `"avatars/"`, checks `storageKey.substring("avatars/".length())`.
       - If `storageKey` does not start with `"avatars/"`, checks `"avatars/" + storageKey`.
     - This guarantees that both legacy database entries (stored with prefix) and new entries (stored without prefix) resolve properly.
  3. `DatabaseStorageService.java:110-117, 157-165`: Direct disk fallback checks both `./uploads/<cleanKey>` and `./uploads/avatars/<cleanKey>`.
  4. Regression test `AvatarDownloadRegressionTest.java` confirms all lookup paths (direct key, legacy prefix fallback, stripped prefix fallback).
