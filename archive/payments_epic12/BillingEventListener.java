package com.example.zhanfinancebackend.modules.billing.event;

import com.example.zhanfinancebackend.modules.billing.entity.Invoice;
import com.example.zhanfinancebackend.modules.billing.entity.Subscription;
import com.example.zhanfinancebackend.modules.billing.repository.InvoiceRepository;
import com.example.zhanfinancebackend.modules.billing.repository.SubscriptionRepository;
import com.example.zhanfinancebackend.modules.billing.service.WebKassaService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class BillingEventListener {

    private static final Logger log = LoggerFactory.getLogger(BillingEventListener.class);

    private final WebKassaService webKassaService;
    private final InvoiceRepository invoiceRepository;
    private final SubscriptionRepository subscriptionRepository;

    public BillingEventListener(WebKassaService webKassaService, InvoiceRepository invoiceRepository, SubscriptionRepository subscriptionRepository) {
        this.webKassaService = webKassaService;
        this.invoiceRepository = invoiceRepository;
        this.subscriptionRepository = subscriptionRepository;
    }

    @Async
    @EventListener
    @Transactional
    public void handleInvoicePaidEvent(InvoicePaidEvent event) {
        log.info("Handling InvoicePaidEvent for Invoice: {}", event.getInvoiceId());

        // 1. Activate Subscription if present
        if (event.getSubscriptionId() != null) {
            subscriptionRepository.findById(event.getSubscriptionId()).ifPresent(sub -> {
                sub.setStatus(Subscription.SubscriptionStatus.ACTIVE);
                subscriptionRepository.save(sub);
                log.info("Activated Subscription: {} for User: {}", sub.getId(), sub.getUser().getId());
            });
        }

        // 2. Issue WebKassa Receipt
        invoiceRepository.findById(event.getInvoiceId()).ifPresent(invoice -> {
            try {
                String receiptUrl = webKassaService.issueReceipt(invoice);
                invoice.setFiscalReceiptUrl(receiptUrl);
                invoiceRepository.save(invoice);
                log.info("Saved fiscal receipt URL for invoice: {}", invoice.getId());
            } catch (Exception e) {
                log.error("Failed to issue WebKassa receipt for invoice: {}", invoice.getId(), e);
                // In a production system, we'd add retry logic or alert admin
            }
        });
    }
}
