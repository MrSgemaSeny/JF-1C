package com.example.zhanfinancebackend.modules.billing.service;

import com.example.zhanfinancebackend.common.exception.BadRequestException;
import com.example.zhanfinancebackend.common.exception.ResourceNotFoundException;
import com.example.zhanfinancebackend.modules.documents.entity.StoredFile;
import com.example.zhanfinancebackend.modules.documents.repository.StoredFileRepository;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.apache.tika.Tika;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.util.UUID;

@Service
public class DefaultPaymentReceiptStorageService implements PaymentReceiptStorageService {

    private static final Logger log = LoggerFactory.getLogger(DefaultPaymentReceiptStorageService.class);
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

    private final StoredFileRepository storedFileRepository;
    private final Tika tika = new Tika();

    @Value("${app.r2.endpoint:}")
    private String r2Endpoint;

    @Value("${app.r2.bucket:${R2_BUCKET_NAME:${R2_BUCKET:jf1c-documents}}}")
    private String r2Bucket;

    @Value("${app.r2.access-key-id:${R2_ACCESS_KEY_ID:}}")
    private String r2AccessKeyId;

    @Value("${app.r2.secret-access-key:${R2_SECRET_ACCESS_KEY:}}")
    private String r2SecretAccessKey;

    private S3Client s3Client;
    private S3Presigner s3Presigner;
    private boolean r2Enabled = false;

    public DefaultPaymentReceiptStorageService(StoredFileRepository storedFileRepository) {
        this.storedFileRepository = storedFileRepository;
    }

    @PostConstruct
    public void init() {
        if (r2Endpoint != null && !r2Endpoint.isBlank()
                && r2AccessKeyId != null && !r2AccessKeyId.isBlank()
                && r2SecretAccessKey != null && !r2SecretAccessKey.isBlank()
                && r2Bucket != null && !r2Bucket.isBlank()) {
            try {
                AwsBasicCredentials credentials = AwsBasicCredentials.create(r2AccessKeyId.trim(), r2SecretAccessKey.trim());
                StaticCredentialsProvider credentialsProvider = StaticCredentialsProvider.create(credentials);
                URI endpointUri = URI.create(r2Endpoint.trim());

                S3Configuration s3Config = S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build();

                this.s3Client = S3Client.builder()
                        .endpointOverride(endpointUri)
                        .credentialsProvider(credentialsProvider)
                        .region(Region.of("auto"))
                        .serviceConfiguration(s3Config)
                        .build();

                this.s3Presigner = S3Presigner.builder()
                        .endpointOverride(endpointUri)
                        .credentialsProvider(credentialsProvider)
                        .region(Region.of("auto"))
                        .serviceConfiguration(s3Config)
                        .build();

                this.r2Enabled = true;
                log.info("Cloudflare R2 storage initialized successfully for bucket {}", r2Bucket);
            } catch (Exception e) {
                log.warn("Failed to initialize Cloudflare R2 client, falling back to database storage: {}", e.getMessage());
                this.r2Enabled = false;
            }
        } else {
            log.info("Cloudflare R2 credentials not configured. Using database storage fallback for payment receipts.");
            this.r2Enabled = false;
        }
    }

    @PreDestroy
    public void cleanup() {
        if (s3Presigner != null) {
            try {
                s3Presigner.close();
            } catch (Exception ignored) {
            }
        }
        if (s3Client != null) {
            try {
                s3Client.close();
            } catch (Exception ignored) {
            }
        }
    }

    @Override
    public String storeReceipt(byte[] fileBytes, String originalFilename) {
        if (fileBytes == null || fileBytes.length == 0) {
            throw new BadRequestException("File is empty.");
        }
        if (fileBytes.length > MAX_FILE_SIZE) {
            throw new BadRequestException("File size exceeds 10MB limit.");
        }

        String mimeType = tika.detect(fileBytes);
        if (mimeType == null || !mimeType.equalsIgnoreCase("application/pdf")) {
            throw new BadRequestException("Only PDF receipts are accepted. Detected MIME: " + mimeType);
        }

        LocalDate now = LocalDate.now();
        String fileKey = String.format("receipts/%d/%02d/%s.pdf", now.getYear(), now.getMonthValue(), UUID.randomUUID());

        if (r2Enabled && s3Client != null) {
            try {
                PutObjectRequest request = PutObjectRequest.builder()
                        .bucket(r2Bucket)
                        .key(fileKey)
                        .contentType("application/pdf")
                        .build();
                s3Client.putObject(request, RequestBody.fromBytes(fileBytes));
                log.debug("Stored receipt file {} in Cloudflare R2 bucket {}", fileKey, r2Bucket);
                return fileKey;
            } catch (Exception e) {
                log.error("Failed to store receipt in Cloudflare R2, falling back to database: {}", e.getMessage(), e);
            }
        }

        // Database storage fallback
        String safeName = originalFilename != null && !originalFilename.isBlank() ? originalFilename : "receipt.pdf";
        storedFileRepository.save(new StoredFile(fileKey, safeName, "application/pdf", fileBytes));
        log.debug("Stored receipt file {} in database storage fallback", fileKey);
        return fileKey;
    }

    @Override
    public String generatePresignedUrl(String fileKey, Duration duration) {
        if (fileKey == null || fileKey.isBlank()) {
            throw new BadRequestException("File key cannot be empty.");
        }

        Duration ttl = duration != null ? duration : Duration.ofMinutes(15);

        if (r2Enabled && s3Presigner != null) {
            try {
                GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                        .signatureDuration(ttl)
                        .getObjectRequest(b -> b.bucket(r2Bucket).key(fileKey))
                        .build();
                return s3Presigner.presignGetObject(presignRequest).url().toString();
            } catch (Exception e) {
                log.error("Failed to generate presigned URL from Cloudflare R2: {}", e.getMessage(), e);
            }
        }

        // Fallback: proxy download endpoint on backend
        return "/api/v1/billing/receipts/files/download?key=" + URLEncoder.encode(fileKey, StandardCharsets.UTF_8);
    }

    @Override
    public byte[] loadReceipt(String fileKey) {
        if (fileKey == null || fileKey.isBlank()) {
            throw new BadRequestException("File key cannot be empty.");
        }

        if (r2Enabled && s3Client != null) {
            try {
                return s3Client.getObjectAsBytes(b -> b.bucket(r2Bucket).key(fileKey)).asByteArray();
            } catch (Exception e) {
                log.warn("Failed to load receipt from Cloudflare R2, checking database fallback: {}", e.getMessage());
            }
        }

        return storedFileRepository.findById(fileKey)
                .map(StoredFile::getData)
                .orElseThrow(() -> new ResourceNotFoundException("Receipt file not found: " + fileKey));
    }

    public boolean isR2Enabled() {
        return r2Enabled;
    }
}
