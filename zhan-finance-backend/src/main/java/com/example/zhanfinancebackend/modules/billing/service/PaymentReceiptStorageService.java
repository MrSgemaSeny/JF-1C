package com.example.zhanfinancebackend.modules.billing.service;

import java.time.Duration;

public interface PaymentReceiptStorageService {
    String storeReceipt(byte[] fileBytes, String originalFilename);
    String generatePresignedUrl(String fileKey, Duration duration);
    byte[] loadReceipt(String fileKey);
}
