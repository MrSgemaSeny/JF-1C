package com.example.zhanfinancebackend.modules.documents.service;

import com.example.zhanfinancebackend.common.exception.BadRequestException;
import com.example.zhanfinancebackend.common.exception.ResourceNotFoundException;
import com.example.zhanfinancebackend.modules.documents.entity.StoredFile;
import com.example.zhanfinancebackend.modules.documents.repository.StoredFileRepository;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.net.URI;
import java.util.UUID;

@Service
@Primary
@ConditionalOnProperty(name = "app.storage.type", havingValue = "r2")
public class R2StorageService implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(R2StorageService.class);

    private final StoredFileRepository storedFileRepository;

    @Value("${app.r2.endpoint:}")
    private String r2Endpoint;

    @Value("${app.r2.bucket:${R2_BUCKET_NAME:${R2_BUCKET:jf1c-documents}}}")
    private String r2Bucket;

    @Value("${app.r2.access-key-id:${R2_ACCESS_KEY_ID:}}")
    private String r2AccessKeyId;

    @Value("${app.r2.secret-access-key:${R2_SECRET_ACCESS_KEY:}}")
    private String r2SecretAccessKey;

    private S3Client s3Client;
    private boolean r2Enabled = false;

    public R2StorageService(StoredFileRepository storedFileRepository) {
        this.storedFileRepository = storedFileRepository;
    }

    @PostConstruct
    public void init() {
        if (r2Endpoint != null && !r2Endpoint.isBlank()
                && r2AccessKeyId != null && !r2AccessKeyId.isBlank()
                && r2SecretAccessKey != null && !r2SecretAccessKey.isBlank()) {
            try {
                this.s3Client = S3Client.builder()
                        .endpointOverride(URI.create(r2Endpoint))
                        .credentialsProvider(StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(r2AccessKeyId, r2SecretAccessKey)
                        ))
                        .region(Region.of("auto"))
                        .serviceConfiguration(S3Configuration.builder()
                                .pathStyleAccessEnabled(true)
                                .build())
                        .build();
                this.r2Enabled = true;
                log.info("Cloudflare R2 Storage initialized for bucket: {}", r2Bucket);
            } catch (Exception e) {
                log.warn("Failed to initialize Cloudflare R2 for documents, fallback to DB: {}", e.getMessage());
                this.r2Enabled = false;
            }
        } else {
            log.info("R2 credentials not provided for documents, using DB fallback storage.");
        }
    }

    @PreDestroy
    public void close() {
        if (s3Client != null) {
            try {
                s3Client.close();
            } catch (Exception ignored) {}
        }
    }

    @Override
    public String store(MultipartFile file) {
        try {
            if (file.isEmpty()) {
                throw new BadRequestException("Failed to store empty file.");
            }
            return store(file.getBytes(), file.getOriginalFilename(), file.getContentType());
        } catch (IOException e) {
            throw new RuntimeException("Failed to read file", e);
        }
    }

    @Override
    public String store(byte[] content, String originalFilename, String contentType) {
        String cleanName = StringUtils.cleanPath(originalFilename != null ? originalFilename : "unnamed");
        String storageKey = UUID.randomUUID() + "-" + cleanName;

        if (r2Enabled && s3Client != null) {
            try {
                PutObjectRequest putReq = PutObjectRequest.builder()
                        .bucket(r2Bucket)
                        .key(storageKey)
                        .contentType(contentType != null ? contentType : "application/octet-stream")
                        .build();
                s3Client.putObject(putReq, RequestBody.fromBytes(content));
                log.info("Stored file in R2 with key: {}", storageKey);
                return storageKey;
            } catch (Exception e) {
                log.warn("Failed to store file in R2 ({}), falling back to database", e.getMessage());
            }
        }

        // DB Fallback
        StoredFile storedFile = new StoredFile(storageKey, cleanName, contentType, content);
        storedFileRepository.save(storedFile);
        return storageKey;
    }

    @Override
    public Resource loadAsResource(String storageKey) {
        return new ByteArrayResource(loadAsBytes(storageKey));
    }

    @Override
    public byte[] loadAsBytes(String storageKey) {
        if (r2Enabled && s3Client != null) {
            try {
                GetObjectRequest getReq = GetObjectRequest.builder()
                        .bucket(r2Bucket)
                        .key(storageKey)
                        .build();
                return s3Client.getObjectAsBytes(getReq).asByteArray();
            } catch (Exception e) {
                log.warn("Failed to fetch from R2 ({}), attempting DB fallback", e.getMessage());
            }
        }

        return storedFileRepository.findById(storageKey)
                .map(StoredFile::getData)
                .orElseThrow(() -> new ResourceNotFoundException("File not found for key: " + storageKey));
    }

    @Override
    public void delete(String storageKey) {
        if (r2Enabled && s3Client != null) {
            try {
                DeleteObjectRequest delReq = DeleteObjectRequest.builder()
                        .bucket(r2Bucket)
                        .key(storageKey)
                        .build();
                s3Client.deleteObject(delReq);
            } catch (Exception e) {
                log.warn("Failed to delete from R2: {}", e.getMessage());
            }
        }
        storedFileRepository.findById(storageKey)
                .ifPresent(storedFileRepository::delete);
    }
}
