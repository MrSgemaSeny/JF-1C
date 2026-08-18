package com.example.zhanfinancebackend.modules.courses.controller;

import com.example.zhanfinancebackend.modules.documents.service.StorageService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/courses/media")
public class CourseMediaController {

    private final StorageService storageService;
    private final com.example.zhanfinancebackend.modules.courses.repository.LessonRepository lessonRepository;
    private final com.example.zhanfinancebackend.modules.courses.repository.EnrollmentRepository enrollmentRepository;

    public CourseMediaController(StorageService storageService,
                                 com.example.zhanfinancebackend.modules.courses.repository.LessonRepository lessonRepository,
                                 com.example.zhanfinancebackend.modules.courses.repository.EnrollmentRepository enrollmentRepository) {
        this.storageService = storageService;
        this.lessonRepository = lessonRepository;
        this.enrollmentRepository = enrollmentRepository;
    }

    /**
     * ARCHITECTURE DECISION (Capability URL):
     * Current implementation uses unguessable UUID storageKeys (122-bit entropy) as capability URLs.
     * This protects against IDOR/bruteforce enumeration without requiring complex database migrations
     * or streaming media files through memory-intensive backend endpoints.
     * 
     * FUTURE ROADMAP (Cloudflare R2 / AWS S3 Presigned URLs):
     * Upon migrating to object storage (app.storage.type=s3/r2), replace direct file streaming with
     * temporary presigned URLs (TTL = 1 hour) generated via S3Presigner after verifying course access
     * via CourseAccessService.
     */
    @GetMapping("/{storageKey:.+}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LEARNER')")
    public ResponseEntity<Resource> downloadMedia(
            @PathVariable String storageKey,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.example.zhanfinancebackend.modules.auth.security.UserPrincipal principal) {
        
        if (principal.getUser().getRole() == com.example.zhanfinancebackend.modules.auth.entity.Role.LEARNER) {
             String fullPath = "/uploads/" + storageKey;
             java.util.Optional<com.example.zhanfinancebackend.modules.courses.entity.Lesson> lessonOpt = 
                     lessonRepository.findByMediaUrlOrFileUrl(fullPath, fullPath);
             
             if (lessonOpt.isEmpty()) {
                  // Fail-closed: do not allow accessing orphan files or files not belonging to a lesson
                  throw new org.springframework.security.access.AccessDeniedException("File is not associated with any accessible lesson");
             }
             
             Long courseId = lessonOpt.get().getChapter().getCourse().getId();
             if (!enrollmentRepository.existsByCourseIdAndUserId(courseId, principal.getId())) {
                  throw new org.springframework.security.access.AccessDeniedException("You are not enrolled in this course");
             }
        }

        Resource resource = storageService.loadAsResource(storageKey);
        
        String contentType = "application/octet-stream";
        String filename = resource.getFilename();
        if (filename != null) {
            if (filename.endsWith(".pdf")) contentType = "application/pdf";
            else if (filename.endsWith(".png")) contentType = "image/png";
            else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) contentType = "image/jpeg";
            else if (filename.endsWith(".mp4")) contentType = "video/mp4";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}
