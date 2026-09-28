package com.example.zhanfinancebackend.modules.billing.service;

import com.example.zhanfinancebackend.common.exception.BadRequestException;
import com.example.zhanfinancebackend.common.exception.ConflictException;
import com.example.zhanfinancebackend.common.exception.ResourceNotFoundException;
import com.example.zhanfinancebackend.modules.auth.entity.Role;
import com.example.zhanfinancebackend.modules.auth.entity.User;
import com.example.zhanfinancebackend.modules.auth.repository.UserRepository;
import com.example.zhanfinancebackend.modules.billing.dto.PaymentReceiptDto;
import com.example.zhanfinancebackend.modules.billing.dto.PaymentReceiptUrlResponse;
import com.example.zhanfinancebackend.modules.billing.dto.PaymentRequisitesDto;
import com.example.zhanfinancebackend.modules.billing.entity.Invoice;
import com.example.zhanfinancebackend.modules.billing.entity.PaymentReceipt;
import com.example.zhanfinancebackend.modules.billing.entity.PaymentReceiptStatus;
import com.example.zhanfinancebackend.modules.billing.entity.Subscription;
import com.example.zhanfinancebackend.modules.billing.repository.InvoiceRepository;
import com.example.zhanfinancebackend.modules.billing.repository.PaymentReceiptRepository;
import com.example.zhanfinancebackend.modules.billing.repository.SubscriptionRepository;
import com.example.zhanfinancebackend.modules.telegram.service.TelegramOutboxService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Service
public class PaymentReceiptService {

    private static final Logger log = LoggerFactory.getLogger(PaymentReceiptService.class);

    private final PaymentReceiptRepository paymentReceiptRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;
    private final PaymentReceiptStorageService storageService;
    private final PaymentReceiptAccessService accessService;
    private final TelegramOutboxService telegramOutboxService;

    @Value("${app.billing.requisites.recipient-name:ТОО ЖАН FINANCE}")
    private String recipientName = "ТОО ЖАН FINANCE";

    @Value("${app.billing.requisites.bin:240140012345}")
    private String bin = "240140012345";

    @Value("${app.billing.requisites.iban:KZ123456789012345678}")
    private String iban = "KZ123456789012345678";

    @Value("${app.billing.requisites.kbe:17}")
    private String kbe = "17";

    @Value("${app.billing.requisites.bank-name:АО Каспий Банк}")
    private String bankName = "АО Каспий Банк";

    public PaymentReceiptService(
            PaymentReceiptRepository paymentReceiptRepository,
            SubscriptionRepository subscriptionRepository,
            InvoiceRepository invoiceRepository,
            UserRepository userRepository,
            PaymentReceiptStorageService storageService,
            PaymentReceiptAccessService accessService,
            TelegramOutboxService telegramOutboxService
    ) {
        this.paymentReceiptRepository = paymentReceiptRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.invoiceRepository = invoiceRepository;
        this.userRepository = userRepository;
        this.storageService = storageService;
        this.accessService = accessService;
        this.telegramOutboxService = telegramOutboxService;
    }

    @Transactional
    public PaymentReceiptDto submitReceipt(User client, Long subscriptionId, Long invoiceId,
                                          BigDecimal amount, String currency, MultipartFile file) {
        accessService.assertCanSubmit(client);

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Payment amount must be greater than zero.");
        }
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Receipt PDF file is required.");
        }

        Subscription subscription = null;
        if (subscriptionId != null) {
            subscription = subscriptionRepository.findById(subscriptionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Subscription not found: " + subscriptionId));
            if (!subscription.getUser().getId().equals(client.getId()) && client.getRole() != Role.ADMIN) {
                throw new BadRequestException("Subscription does not belong to this user.");
            }
        }

        Invoice invoice = null;
        if (invoiceId != null) {
            invoice = invoiceRepository.findById(invoiceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + invoiceId));
            if (!invoice.getUser().getId().equals(client.getId()) && client.getRole() != Role.ADMIN) {
                throw new BadRequestException("Invoice does not belong to this user.");
            }
        }

        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (IOException e) {
            throw new BadRequestException("Failed to read uploaded file: " + e.getMessage());
        }

        String fileKey = storageService.storeReceipt(fileBytes, file.getOriginalFilename());

        PaymentReceipt receipt = new PaymentReceipt(
                client,
                subscription,
                invoice,
                amount,
                currency != null && !currency.isBlank() ? currency.toUpperCase() : "KZT",
                fileKey
        );
        PaymentReceipt savedReceipt = paymentReceiptRepository.save(receipt);

        // Notify active admins in Telegram Outbox
        try {
            List<User> admins = userRepository.findAllByRole(Role.ADMIN);
            String clientDisplay = client.getFullName() != null && !client.getFullName().isBlank() ? client.getFullName() : client.getEmail();
            String title = "Новый чек об оплате";
            String message = String.format("Клиент %s загрузил чек на сумму %s %s. Требуется модерация в панели управления.",
                    clientDisplay, savedReceipt.getAmount(), savedReceipt.getCurrency());
            for (User admin : admins) {
                telegramOutboxService.enqueue(admin, title, message, "/admin/billing/receipts");
            }
        } catch (Exception e) {
            log.warn("Failed to enqueue admin Telegram notification for new receipt {}: {}", savedReceipt.getId(), e.getMessage());
        }

        return mapToDto(savedReceipt);
    }

    @Transactional
    public PaymentReceiptDto confirmReceipt(User admin, Long receiptId) {
        accessService.assertCanReview(admin);

        PaymentReceipt receipt = paymentReceiptRepository.findById(receiptId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment receipt not found: " + receiptId));

        if (receipt.getStatus() != PaymentReceiptStatus.AWAITING_REVIEW) {
            throw new ConflictException("Receipt has already been reviewed with status: " + receipt.getStatus());
        }

        receipt.setStatus(PaymentReceiptStatus.CONFIRMED);
        receipt.setReviewedBy(admin);
        receipt.setReviewedAt(Instant.now());

        // Activate subscription if present
        Subscription subscription = receipt.getSubscription();
        if (subscription != null) {
            subscription.setStatus(Subscription.SubscriptionStatus.ACTIVE);
            LocalDate today = LocalDate.now();
            subscription.setStartsAt(today);
            subscription.setEndsAt(today.plusDays(30));
            subscriptionRepository.save(subscription);
            log.info("Subscription {} activated for client {} until {}", subscription.getId(), receipt.getClient().getId(), subscription.getEndsAt());
        }

        // Close invoice if present
        Invoice invoice = receipt.getInvoice();
        if (invoice != null) {
            invoice.setStatus(Invoice.InvoiceStatus.PAID);
            invoiceRepository.save(invoice);
            log.info("Invoice {} marked as PAID via receipt {}", invoice.getId(), receipt.getId());
        }

        PaymentReceipt saved = paymentReceiptRepository.save(receipt);

        // Notify client via Telegram Outbox
        try {
            String title = "Оплата подтверждена";
            String message = String.format("Ваш платеж на сумму %s %s успешно подтвержден. Тариф активирован.",
                    saved.getAmount(), saved.getCurrency());
            telegramOutboxService.enqueue(saved.getClient(), title, message, "/client/billing");
        } catch (Exception e) {
            log.warn("Failed to enqueue client confirmation notification for receipt {}: {}", saved.getId(), e.getMessage());
        }

        return mapToDto(saved);
    }

    @Transactional
    public PaymentReceiptDto rejectReceipt(User admin, Long receiptId, String note) {
        accessService.assertCanReview(admin);

        PaymentReceipt receipt = paymentReceiptRepository.findById(receiptId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment receipt not found: " + receiptId));

        if (receipt.getStatus() != PaymentReceiptStatus.AWAITING_REVIEW) {
            throw new ConflictException("Receipt has already been reviewed with status: " + receipt.getStatus());
        }

        if (note == null || note.trim().isBlank()) {
            throw new BadRequestException("Rejection note is required.");
        }

        receipt.setStatus(PaymentReceiptStatus.REJECTED);
        receipt.setRejectNote(note.trim());
        receipt.setReviewedBy(admin);
        receipt.setReviewedAt(Instant.now());

        PaymentReceipt saved = paymentReceiptRepository.save(receipt);

        // Notify client via Telegram Outbox
        try {
            String title = "Платеж отклонен";
            String message = String.format("Ваш чек на сумму %s %s был отклонен. Причина: %s. Пожалуйста, загрузите корректный чек.",
                    saved.getAmount(), saved.getCurrency(), saved.getRejectNote());
            telegramOutboxService.enqueue(saved.getClient(), title, message, "/client/billing");
        } catch (Exception e) {
            log.warn("Failed to enqueue client rejection notification for receipt {}: {}", saved.getId(), e.getMessage());
        }

        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<PaymentReceiptDto> getClientReceipts(User client) {
        accessService.assertCanSubmit(client);
        return paymentReceiptRepository.findByClientIdOrderByCreatedAtDesc(client.getId())
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PaymentReceiptDto> getAllReceipts(User admin, PaymentReceiptStatus status) {
        accessService.assertCanReview(admin);
        List<PaymentReceipt> receipts = status != null
                ? paymentReceiptRepository.findByStatusOrderByCreatedAtDesc(status)
                : paymentReceiptRepository.findAllWithDetailsOrderByCreatedAtDesc();

        return receipts.stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public PaymentReceiptUrlResponse getReceiptFileUrl(User actor, Long receiptId) {
        PaymentReceipt receipt = paymentReceiptRepository.findById(receiptId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment receipt not found: " + receiptId));

        accessService.assertCanRead(actor, receipt);

        String presignedUrl = storageService.generatePresignedUrl(receipt.getReceiptFileKey(), Duration.ofMinutes(15));
        return new PaymentReceiptUrlResponse(presignedUrl, 900);
    }

    @Transactional(readOnly = true)
    public byte[] loadReceiptFile(User actor, Long receiptId) {
        PaymentReceipt receipt = paymentReceiptRepository.findById(receiptId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment receipt not found: " + receiptId));

        accessService.assertCanRead(actor, receipt);

        return storageService.loadReceipt(receipt.getReceiptFileKey());
    }

    @Transactional(readOnly = true)
    public byte[] loadReceiptFileByKey(String fileKey) {
        if (fileKey == null || fileKey.isBlank()) {
            throw new BadRequestException("File key is required");
        }
        return storageService.loadReceipt(fileKey);
    }

    public PaymentRequisitesDto getRequisites() {
        return new PaymentRequisitesDto(recipientName, bin, iban, kbe, bankName);
    }

    private PaymentReceiptDto mapToDto(PaymentReceipt r) {
        User client = r.getClient();
        Subscription sub = r.getSubscription();
        Invoice inv = r.getInvoice();
        User reviewer = r.getReviewedBy();

        return new PaymentReceiptDto(
                r.getId(),
                client != null ? client.getId() : null,
                client != null ? (client.getFullName() != null && !client.getFullName().isBlank() ? client.getFullName() : client.getEmail()) : null,
                client != null ? client.getEmail() : null,
                sub != null ? sub.getId() : null,
                sub != null ? sub.getPlanName() : null,
                inv != null ? inv.getId() : null,
                inv != null ? inv.getTitle() : null,
                r.getAmount(),
                r.getCurrency(),
                r.getReceiptFileKey(),
                r.getStatus(),
                reviewer != null ? reviewer.getId() : null,
                reviewer != null ? reviewer.getFullName() : null,
                r.getReviewedAt(),
                r.getRejectNote(),
                r.getCreatedAt(),
                r.getUpdatedAt()
        );
    }
}
