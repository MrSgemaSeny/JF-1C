package com.example.zhanfinancebackend.modules.billing.service;

import com.example.zhanfinancebackend.modules.billing.entity.Invoice;
import com.example.zhanfinancebackend.modules.billing.entity.Payment;
import com.example.zhanfinancebackend.modules.billing.event.InvoicePaidEvent;
import com.example.zhanfinancebackend.modules.billing.repository.InvoiceRepository;
import com.example.zhanfinancebackend.modules.billing.repository.PaymentRepository;
import com.example.zhanfinancebackend.common.exception.ApiException;
import com.example.zhanfinancebackend.common.exception.ErrorCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class KaspiPayService {

    private static final Logger log = LoggerFactory.getLogger(KaspiPayService.class);

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final ApplicationEventPublisher eventPublisher;

    public KaspiPayService(InvoiceRepository invoiceRepository, PaymentRepository paymentRepository, ApplicationEventPublisher eventPublisher) {
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.eventPublisher = eventPublisher;
    }

    public String generateCheckoutUrl(Long invoiceId) {
        // Mock generation for dev. In prod, this would call Kaspi Pay API to get a deep-link/QR.
        return "https://pay.kaspi.kz/checkout?invoice=" + invoiceId.toString();
    }

    @Transactional
    public void handleWebhook(String transactionId, Long invoiceId, BigDecimal amount, String status) {
        // Idempotency check
        if (paymentRepository.findByProviderTransactionId(transactionId).isPresent()) {
            log.info("Payment transaction {} already processed. Ignoring.", transactionId);
            return;
        }

        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Invoice not found"));

        Payment.PaymentStatus paymentStatus = "SUCCESS".equalsIgnoreCase(status) ? Payment.PaymentStatus.SUCCESS : Payment.PaymentStatus.FAILED;

        Payment payment = new Payment(
                invoice,
                Payment.PaymentProvider.KASPI,
                transactionId,
                amount,
                paymentStatus
        );

        paymentRepository.save(payment);

        if (paymentStatus == Payment.PaymentStatus.SUCCESS) {
            invoice.setStatus(Invoice.InvoiceStatus.PAID);
            invoiceRepository.save(invoice);

            Long subId = invoice.getSubscription() != null ? invoice.getSubscription().getId() : null;
            eventPublisher.publishEvent(new InvoicePaidEvent(this, invoice.getId(), subId));
            log.info("Invoice {} paid via Kaspi Pay", invoiceId);
        }
    }
}
