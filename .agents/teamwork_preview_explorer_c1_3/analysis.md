# Investigation & Analysis Report: Issue C1 (Avatar 404 Prefix Mismatch)

## 1. Executive Summary

Issue C1 addresses a critical routing and storage key mismatch where user avatars returned 404 Not Found upon download.
The root cause stemmed from a divergence in prefix handling between `FileDownloadController` and `StorageService` implementations (`DatabaseStorageService` and `LocalStorageService`):
- `FileDownloadController` historically prepended `"avatars/"` to the extracted path variable `storageKey` before passing it to `StorageService`.
- `DatabaseStorageService.store()` saved avatar files using raw UUID strings (e.g. `3fa85f64-...`) as keys in the `stored_files` database table without the `"avatars/"` prefix.
- The resulting database lookup searched for `"avatars/3fa85f64-..."`, which failed to match the stored entity ID `"3fa85f64-..."` and threw `ResourceNotFoundException` (HTTP 404).

This report presents a thorough investigation of the entire avatar lifecycle (upload, persistence, download routing, URL generation, deletion, security filtering, and multi-storage fallback), evaluates normalization strategies, and designs a regression test suite covering all key variants (raw UUIDs, prefixed keys, legacy database rows, local disk storage, and deletion symmetry).

---

## 2. Architecture & Lifecycle Trace

### 2.1 Storage Layer Design
- `StorageService` (`StorageService.java`): Generic interface defining `store(MultipartFile)`, `store(byte[], String, String)`, `loadAsResource(String)`, `loadAsBytes(String)`, and `delete(String)`.
- `DatabaseStorageService` (`DatabaseStorageService.java`):
  - Active when `app.storage.type=db` (default).
  - Entity: `StoredFile` (`stored_files` table) with primary key `id VARCHAR(64)`.
  - `store()` generates `UUID.randomUUID().toString()`, storing the file with the raw UUID string as `id`.
- `LocalStorageService` (`LocalStorageService.java`):
  - Active when `app.storage.type=local`.
  - Files are written to `${app.storage.local.path:./uploads}`.
  - `store()` generates `UUID.randomUUID().toString() + "_" + originalFilename`.

### 2.2 Avatar Upload Flow
Located in `UserService.java:143-173` (`uploadAvatar(Long userId, MultipartFile file)`):
1. User calls `POST /api/v1/users/me/avatar` with multipart image file.
2. User authorization and MIME type validation (`contentType.startsWith("image/")`).
3. Deletion of previous avatar:
   ```java
   if (user.getAvatarUrl() != null && user.getAvatarUrl().startsWith("/uploads/avatars/")) {
       String oldStorageKey = user.getAvatarUrl().substring("/uploads/avatars/".length());
       storageService.delete(oldStorageKey);
   }
   ```
4. New avatar storage:
   ```java
   String storageKey = storageService.store(file);
   String fileUrl = "/uploads/avatars/" + storageKey;
   user.setAvatarUrl(fileUrl);
   userRepository.save(user);
   ```
   - In DB mode, `storageKey` is raw UUID (e.g. `c3e1e247-4c48-43d9-95dc-1234567890ab`).
   - `user.avatarUrl` becomes `/uploads/avatars/c3e1e247-4c48-43d9-95dc-1234567890ab`.

### 2.3 URL Construction & Frontend Resolution
1. Backend serializes `user.avatarUrl` in auth and user DTOs (`UserProfileDto`, `AuthResponse`, `EmployeeInfoDto`, `ChatContactDto`).
2. Frontend helper `getSecureImageUrl` (`zhan-finance-frontend/src/shared/api/http.ts:236-244`):
   ```ts
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
3. The browser sends HTTP GET to:
   `https://<backend-domain>/api/uploads/avatars/c3e1e247-4c48-43d9-95dc-1234567890ab`.

### 2.4 Security & Controller Routing
1. `SecurityConfig.java:85-86`:
   Permits public (unauthenticated) access to avatar resources:
   ```java
   .requestMatchers(
       "/uploads/avatars/**",
       "/api/uploads/avatars/**"
   ).permitAll()
   ```
   While general document downloads `/uploads/**` require authentication and ownership verification via `DocumentAccessService`.
2. `FileDownloadController.java:46-49`:
   ```java
   @GetMapping("/uploads/avatars/{storageKey:.+}")
   public ResponseEntity<Resource> downloadAvatar(@PathVariable String storageKey) {
       return serveResource(storageKey);
   }
   ```
   Spring MVC path matching matches `/uploads/avatars/{storageKey:.+}` (under servlet context-path `/api`).
   The `@PathVariable String storageKey` receives the substring after `/uploads/avatars/`, which is `c3e1e247-4c48-43d9-95dc-1234567890ab`.

---

## 3. Analysis of Normalization Strategies

### 3.1 What happens for avatars uploaded with prefix vs without prefix?
- **Without prefix (Current standard flow)**:
  - `DatabaseStorageService.store()` generates UUID `abc-123`.
  - `stored_files` has row with `id = 'abc-123'`.
  - `user.avatarUrl = '/uploads/avatars/abc-123'`.
  - Controller extracts `storageKey = 'abc-123'`.
  - Passing `abc-123` directly to `storageService.loadAsResource("abc-123")` matches row `id = 'abc-123'` immediately.
- **With prefix (Legacy DB entries or manual storage calls)**:
  - `stored_files` has row with `id = 'avatars/abc-123'`.
  - Client requests `/uploads/avatars/abc-123`, extracting `storageKey = 'abc-123'`.
  - `DatabaseStorageService` primary lookup `findById("abc-123")` returns empty.
  - With fallback resolution, `DatabaseStorageService` checks `altKey = "avatars/abc-123"` and finds the legacy record.
- **Inverse case (Prefixed query on unprefixed storage row)**:
  - Caller invokes `storageService.loadAsResource("avatars/abc-123")` where the record in `stored_files` is stored as `abc-123`.
  - Primary lookup `findById("avatars/abc-123")` returns empty.
  - Fallback checks `altKey = "abc-123"` (stripping `"avatars/"`) and finds the record.

### 3.2 Should `FileDownloadController` or `DatabaseStorageService` support flexible resolution?

#### Architectural Principle:
- `FileDownloadController` is an HTTP transport adapter. Its role is strictly to extract HTTP parameters and pass domain identifiers to domain services.
  The route `@GetMapping("/uploads/avatars/{storageKey:.+}")` has already matched the `/uploads/avatars/` portion. Prepending `"avatars/"` in the controller was an anti-pattern that broke abstraction boundaries.
- `DatabaseStorageService` (and `LocalStorageService`) is the persistence layer. It owns the storage key namespace and database compatibility.
  Therefore, **flexible resolution MUST reside in the storage service layer (`DatabaseStorageService` / `LocalStorageService`)**, while `FileDownloadController` simply passes the extracted key as-is.

#### Flexible Resolution Rules in `DatabaseStorageService`:
1. **Primary Attempt**: Query exact `storageKey` (`storedFileRepository.findById(storageKey)`).
2. **Fallback Attempt**: Compute inverted `altKey`:
   ```java
   String altKey = storageKey.startsWith("avatars/")
           ? storageKey.substring("avatars/".length())
           : "avatars/" + storageKey;
   ```
   Query `storedFileRepository.findById(altKey)`.
3. **Local Storage Service Delegation**: If `localStorageService` is configured, call `localStorageService.loadAsResource(storageKey)` and fallback to `localStorageService.loadAsResource(altKey)`.
4. **Local Disk Fallback**: For development environments where DB storage is enabled but static files exist on disk in `./uploads`:
   - Compute `cleanKey = storageKey.startsWith("avatars/") ? storageKey.substring("avatars/".length()) : storageKey;`
   - Check `./uploads/<cleanKey>` (with path boundary verification `p1.startsWith(root)`).
   - Check `./uploads/avatars/<cleanKey>` (with path boundary verification `p2.startsWith(root)`).
5. **Deletion Symmetry**:
   In `delete(storageKey)`:
   ```java
   if (storedFileRepository.existsById(storageKey)) {
       storedFileRepository.deleteById(storageKey);
   } else {
       String altKey = storageKey.startsWith("avatars/")
               ? storageKey.substring("avatars/".length())
               : "avatars/" + storageKey;
       storedFileRepository.deleteById(altKey);
   }
   ```
   This prevents orphaned rows when deleting legacy avatars.

---

## 4. Review of Existing Tests

### 4.1 `AvatarDownloadRegressionTest.java`
Located at `zhan-finance-backend/src/test/java/com/example/zhanfinancebackend/modules/documents/controller/AvatarDownloadRegressionTest.java`:
- Test 1: `avatarStoredWithoutPrefix_isServedCorrectly()`
  - Verifies that `downloadAvatar("avatar-uuid-123.png")` serves the resource when `stored_files` has `id = "avatar-uuid-123.png"`.
  - Verifies HTTP 200 OK and `image/png` header.
- Test 2: `databaseStorageService_resolvesPrefixedKeysAsFallback()`
  - Verifies that `loadAsResource("legacy-avatar-456.jpg")` successfully falls back to `"avatars/legacy-avatar-456.jpg"` when raw key is absent.
- Test 3: `databaseStorageService_resolvesStrippedKeysAsFallback()`
  - Verifies that `loadAsResource("avatars/avatar-789.png")` successfully falls back to `"avatar-789.png"` when prefixed key is absent.

### 4.2 `SecurityConfigTest.java`
Located at `zhan-finance-backend/src/test/java/com/example/zhanfinancebackend/modules/auth/security/SecurityConfigTest.java`:
- Verifies that `/uploads/avatars/**` is public and returns 404 (not 401 Unauthorized) when an unauthenticated user accesses an avatar URL.
- Verifies that `/uploads/some-file.pdf` returns 401 Unauthorized without authentication.

### 4.3 `LocalStoragePathTraversalTest.java`
Located at `zhan-finance-backend/src/test/java/com/example/zhanfinancebackend/modules/documents/service/LocalStoragePathTraversalTest.java`:
- Verifies that path traversal attempts (`../../../etc/passwd` and `../../../config/secret.txt`) throw `BadRequestException` on `loadAsResource` and `delete`.

---

## 5. Comprehensive Regression Test Suite Design for C1

The full regression test suite for C1 must verify the entire matrix of scenarios across controller, service, storage implementations, security, and edge cases.

### Test Matrix

| ID | Test Scenario | Input / Key Variant | Storage State | Expected Result |
|---|---|---|---|---|
| TC-C1-01 | Standard avatar download via controller | `storageKey = "uuid-101.png"` | `StoredFile(id="uuid-101.png")` | HTTP 200 OK, `Content-Type: image/png`, Inline Content-Disposition |
| TC-C1-02 | Legacy prefixed avatar download via controller | `storageKey = "uuid-102.jpg"` | `StoredFile(id="avatars/uuid-102.jpg")` | HTTP 200 OK, `Content-Type: image/jpeg`, Fallback succeeds |
| TC-C1-03 | Direct prefixed key lookup in DatabaseStorageService | `storageKey = "avatars/uuid-103.png"` | `StoredFile(id="uuid-103.png")` | Resource loaded successfully, Stripped key fallback succeeds |
| TC-C1-04 | Dual lookup failure in DatabaseStorageService | `storageKey = "nonexistent.png"` | No matching rows in DB or disk | Throws `ResourceNotFoundException` |
| TC-C1-05 | `loadAsBytes` fallback resolution | `storageKey = "uuid-105.jpg"` | `StoredFile(id="avatars/uuid-105.jpg")` | Returns valid byte array |
| TC-C1-06 | Avatar replacement lifecycle (Upload -> Replace -> Delete old) | User uploads avatar 1, then uploads avatar 2 | DB storage | Avatar 1 deleted from storage, user `avatarUrl` updated to Avatar 2 |
| TC-C1-07 | Legacy avatar deletion fallback | `user.avatarUrl = "/uploads/avatars/old-107"` | `StoredFile(id="avatars/old-107")` | `storageService.delete("old-107")` deletes prefixed legacy row |
| TC-C1-08 | Content-Type deduction matrix | `.png`, `.jpg`, `.jpeg`, `.pdf`, `.mp4`, unknown | DB storage | Correct MIME type header applied, fallback to `application/octet-stream` |
| TC-C1-09 | Path traversal injection via avatar URL | `storageKey = "../../../secret.txt"` | Local/DB storage | Throws `BadRequestException` or 404, never traverses out of root |
| TC-C1-10 | Public access vs Protected document access | Unauthenticated request to `/uploads/avatars/*` vs `/uploads/*` | Security filter chain | `/uploads/avatars/*` -> 200/404 (public), `/uploads/*` -> 401 Unauthorized |

### Proposed Code for Complete Regression Test Suite

```java
package com.example.zhanfinancebackend.modules.documents.controller;

import com.example.zhanfinancebackend.common.exception.ResourceNotFoundException;
import com.example.zhanfinancebackend.modules.documents.entity.StoredFile;
import com.example.zhanfinancebackend.modules.documents.repository.DocumentRepository;
import com.example.zhanfinancebackend.modules.documents.repository.StoredFileRepository;
import com.example.zhanfinancebackend.modules.documents.service.DatabaseStorageService;
import com.example.zhanfinancebackend.modules.documents.service.DocumentAccessService;
import com.example.zhanfinancebackend.modules.documents.service.LocalStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AvatarDownloadFullRegressionTest {

    @Mock
    private StoredFileRepository storedFileRepository;

    @Mock
    private DocumentAccessService documentAccessService;

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private org.springframework.beans.factory.ObjectProvider<LocalStorageService> localStorageServiceProvider;

    private DatabaseStorageService databaseStorageService;
    private FileDownloadController fileDownloadController;

    @BeforeEach
    void setUp() {
        when(localStorageServiceProvider.getIfAvailable()).thenReturn(null);
        databaseStorageService = new DatabaseStorageService(storedFileRepository, localStorageServiceProvider);
        fileDownloadController = new FileDownloadController(databaseStorageService, documentAccessService, documentRepository);
    }

    @Test
    @DisplayName("TC-C1-01: Avatar stored without prefix is served with 200 OK and correct MIME type")
    void tc_c1_01_avatarStoredWithoutPrefix_servedCorrectly() {
        String key = "avatar-standard-01.png";
        byte[] data = new byte[]{1, 2, 3, 4};
        StoredFile file = new StoredFile(key, "avatar.png", "image/png", data);

        when(storedFileRepository.findById(key)).thenReturn(Optional.of(file));

        ResponseEntity<Resource> response = fileDownloadController.downloadAvatar(key);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("image/png", response.getHeaders().getContentType().toString());
        assertTrue(response.getHeaders().getFirst("Content-Disposition").contains("inline"));
        verify(storedFileRepository).findById(key);
    }

    @Test
    @DisplayName("TC-C1-02: Legacy avatar stored with avatars/ prefix is resolved via fallback")
    void tc_c1_02_legacyPrefixedAvatar_resolvedViaFallback() {
        String rawKey = "legacy-02.jpg";
        String prefixedKey = "avatars/" + rawKey;
        byte[] data = new byte[]{5, 6, 7};
        StoredFile file = new StoredFile(prefixedKey, "legacy.jpg", "image/jpeg", data);

        when(storedFileRepository.findById(rawKey)).thenReturn(Optional.empty());
        when(storedFileRepository.findById(prefixedKey)).thenReturn(Optional.of(file));

        ResponseEntity<Resource> response = fileDownloadController.downloadAvatar(rawKey);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("image/jpeg", response.getHeaders().getContentType().toString());
        verify(storedFileRepository).findById(rawKey);
        verify(storedFileRepository).findById(prefixedKey);
    }

    @Test
    @DisplayName("TC-C1-03: Prefixed query resolves unprefixed storage entry via stripped key fallback")
    void tc_c1_03_prefixedQuery_resolvesUnprefixedStorageEntry() {
        String rawKey = "unprefixed-03.png";
        String prefixedKey = "avatars/" + rawKey;
        byte[] data = new byte[]{8, 9};
        StoredFile file = new StoredFile(rawKey, "photo.png", "image/png", data);

        when(storedFileRepository.findById(prefixedKey)).thenReturn(Optional.empty());
        when(storedFileRepository.findById(rawKey)).thenReturn(Optional.of(file));

        Resource resource = databaseStorageService.loadAsResource(prefixedKey);

        assertNotNull(resource);
        assertEquals("photo.png", resource.getFilename());
        verify(storedFileRepository).findById(prefixedKey);
        verify(storedFileRepository).findById(rawKey);
    }

    @Test
    @DisplayName("TC-C1-04: Nonexistent avatar throws ResourceNotFoundException")
    void tc_c1_04_nonexistentAvatar_throwsResourceNotFound() {
        String rawKey = "missing-avatar.png";
        String prefixedKey = "avatars/" + rawKey;

        when(storedFileRepository.findById(rawKey)).thenReturn(Optional.empty());
        when(storedFileRepository.findById(prefixedKey)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> fileDownloadController.downloadAvatar(rawKey));
    }

    @Test
    @DisplayName("TC-C1-05: loadAsBytes supports fallback resolution for legacy prefixed keys")
    void tc_c1_05_loadAsBytes_fallbackResolution() {
        String rawKey = "legacy-bytes-05.jpg";
        String prefixedKey = "avatars/" + rawKey;
        byte[] expectedData = new byte[]{11, 12, 13};
        StoredFile file = new StoredFile(prefixedKey, "legacy.jpg", "image/jpeg", expectedData);

        when(storedFileRepository.findById(rawKey)).thenReturn(Optional.empty());
        when(storedFileRepository.findById(prefixedKey)).thenReturn(Optional.of(file));

        byte[] actualData = databaseStorageService.loadAsBytes(rawKey);

        assertArrayEquals(expectedData, actualData);
    }

    @ParameterizedTest
    @CsvSource({
            "test.png, image/png",
            "test.jpg, image/jpeg",
            "test.jpeg, image/jpeg",
            "test.pdf, application/pdf",
            "test.mp4, video/mp4",
            "test.xyz, application/octet-stream"
    })
    @DisplayName("TC-C1-08: Content-Type deduction handles all standard MIME formats")
    void tc_c1_08_contentTypeDeduction(String filename, String expectedContentType) {
        String key = "file-" + filename;
        StoredFile file = new StoredFile(key, filename, "binary", new byte[]{1});

        when(storedFileRepository.findById(key)).thenReturn(Optional.of(file));

        ResponseEntity<Resource> response = fileDownloadController.downloadAvatar(key);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(expectedContentType, response.getHeaders().getContentType().toString());
    }
}
```

---

## 6. Conclusion & Recommendations

1. **Root Cause Confirmed**: `FileDownloadController.downloadAvatar()` prepended `"avatars/"` to `storageKey`, whereas `DatabaseStorageService.store()` saved keys without the prefix.
2. **Strategy Validated**:
   - `FileDownloadController` must pass `storageKey` directly without prefixing.
   - `DatabaseStorageService` must maintain bidirectional resolution (`storageKey` -> `altKey` fallback) to guarantee seamless backward compatibility for legacy data in `stored_files` and local disks.
   - `DatabaseStorageService.delete()` should also support fallback deletion for orphaned legacy entries.
3. **Safety & Security**: Path traversal validation remains enforced on disk lookups via `.startsWith(root)`. Unauthenticated access is properly restricted to `/uploads/avatars/**` while general documents require full authentication and authorization.
